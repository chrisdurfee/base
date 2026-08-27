/**
 * Core-runtime chunk boundary check.
 *
 * The framework ships content-hashed chunks. A chunk's hash covers its own
 * code and the names of the chunks it imports, so an edit propagates to
 * everything above it in the graph but never below. That makes the bottom of
 * the graph — the core runtime — the one thing a consuming app can keep
 * cached across framework releases, and it only holds while the core chunk
 * contains core modules and nothing else. A feature module that drifts into
 * it turns every feature release into a full cache invalidation.
 *
 * This asserts both halves of that:
 *
 *   1. The core chunk holds exactly CORE_MODULES.
 *   2. Editing a feature module leaves the core chunk's hash untouched.
 *
 * Usage:
 *   node ./scripts/chunk-stability.js            check, exit non-zero on drift
 *   node ./scripts/chunk-stability.js --verbose  also list every chunk
 */

import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createFeatureOptions } from '../esbuild.js';

/**
 * The modules that make up the core runtime: element event bookkeeping, the
 * DOM data tracker and the string/type helpers both use. Everything else in
 * the framework depends on this and it depends on nothing.
 *
 * @type {Array<string>}
 */
const CORE_MODULES = [
	'src/main/data-tracker/data-tracker.js',
	'src/main/data-tracker/tracker-types.js',
	'src/main/data-tracker/tracker.js',
	'src/main/events/events.js',
	'src/shared/strings.js',
	'src/shared/types.js'
];

/**
 * One module from each feature area. Editing any of these must leave the
 * core chunk alone.
 *
 * @type {Array<string>}
 */
const FEATURE_PROBES = [
	'src/modules/ajax/xhr-request.js',
	'src/modules/component/component.js',
	'src/modules/date/date-time.js',
	'src/modules/html/html.js',
	'src/modules/router/router.js',
	'src/modules/state/state-tracker.js'
];

/**
 * This will normalize a path to the forward-slash, cwd-relative form the
 * metafile uses.
 *
 * @param {string} value
 * @returns {string}
 */
const toKey = (value) => value.split(path.sep).join('/');

/**
 * This will create a plugin that appends a marker to one module.
 *
 * Editing the file on disk would be simpler and far more dangerous: a crashed
 * run would leave the working tree modified. The overlay only exists for the
 * duration of the build.
 *
 * @param {string|null} target A cwd-relative source path.
 * @returns {import('esbuild').Plugin}
 */
const createProbePlugin = (target) =>
{
	return {
		name: 'cache-probe',
		setup(build)
		{
			if (target === null)
			{
				return;
			}

			build.onLoad({ filter: /\.js$/ }, async (args) =>
			{
				if (toKey(path.relative(process.cwd(), args.path)) !== target)
				{
					return null;
				}

				const contents = await readFile(args.path, 'utf8');
				return {
					contents: `${contents}\nif (globalThis.__cacheProbe) { globalThis.__cacheProbe = "chunk-stability-probe"; }\n`,
					loader: 'js'
				};
			});
		}
	};
};

/**
 * This will build the feature graph and return its chunks.
 *
 * @param {string|null} [probe] A source module to perturb.
 * @returns {Promise<Array<{file: string, modules: Array<string>, imports: Array<string>}>>}
 */
const buildChunks = async (probe = null) =>
{
	const result = await build(createFeatureOptions({
		write: false,
		logLevel: 'silent',
		plugins: [createProbePlugin(probe)]
	}));

	const chunks = [];
	for (const [file, output] of Object.entries(result.metafile.outputs))
	{
		if (!file.includes('/chunks/') || file.endsWith('.map'))
		{
			continue;
		}

		chunks.push({
			file,
			modules: Object.keys(output.inputs).filter((key) => output.inputs[key].bytesInOutput > 0).sort(),
			imports: output.imports.map((item) => item.path).filter((item) => !item.endsWith('.map'))
		});
	}

	return chunks;
};

/**
 * This will find the chunk holding the core runtime.
 *
 * @param {Array<{file: string, modules: Array<string>}>} chunks
 * @returns {{file: string, modules: Array<string>}|null}
 */
const findCoreChunk = (chunks) =>
{
	return chunks.find((chunk) => chunk.modules.includes(CORE_MODULES[0])) ?? null;
};

/**
 * This will compare two sorted string lists.
 *
 * @param {Array<string>} a
 * @param {Array<string>} b
 * @returns {boolean}
 */
const sameList = (a, b) => (a.length === b.length && a.every((item, index) => item === b[index]));

/**
 * Entry point.
 *
 * @returns {Promise<void>}
 */
const main = async () =>
{
	const verbose = process.argv.includes('--verbose');
	const failures = [];

	const chunks = await buildChunks();
	const core = findCoreChunk(chunks);

	console.log('');
	console.log('Core-runtime chunk boundary');
	console.log('');

	if (core === null)
	{
		console.error(`No chunk contains ${CORE_MODULES[0]}.`);
		process.exitCode = 1;
		return;
	}

	console.log(`  core chunk: ${core.file}`);
	for (const module of core.modules)
	{
		console.log(`    ${module}`);
	}
	console.log('');

	/**
	 * esbuild emits its own helper chunk (class-field lowering for the es2020
	 * target) with no source modules in it. That one is allowed below the
	 * core: it only changes when esbuild does. Anything else means a source
	 * module sits underneath the core runtime.
	 */
	const runtimeHelpers = new Set(chunks.filter((chunk) => chunk.modules.length === 0).map((chunk) => chunk.file));
	const belowCore = core.imports.filter((item) => !runtimeHelpers.has(item));
	if (belowCore.length > 0)
	{
		failures.push(`the core chunk imports ${belowCore.join(', ')}; it must sit at the bottom of the graph`);
	}

	const expected = [...CORE_MODULES].sort();
	if (!sameList(core.modules, expected))
	{
		const extra = core.modules.filter((item) => !expected.includes(item));
		const missing = expected.filter((item) => !core.modules.includes(item));

		if (extra.length > 0)
		{
			failures.push(`feature modules drifted into the core chunk: ${extra.join(', ')}`);
		}

		if (missing.length > 0)
		{
			failures.push(`core modules left the core chunk: ${missing.join(', ')}`);
		}
	}

	if (verbose)
	{
		for (const chunk of chunks)
		{
			console.log(`  ${chunk.file}  (${chunk.modules.length} modules)`);
		}
		console.log('');
	}

	for (const probe of FEATURE_PROBES)
	{
		const perturbed = findCoreChunk(await buildChunks(probe));
		const stable = (perturbed !== null && perturbed.file === core.file);

		console.log(`  ${stable ? 'ok  ' : 'FAIL'} edit ${probe} -> core chunk ${perturbed ? perturbed.file : 'missing'}`);

		if (!stable)
		{
			failures.push(`editing ${probe} rehashed the core chunk (${core.file} -> ${perturbed ? perturbed.file : 'missing'})`);
		}
	}

	console.log('');

	if (failures.length > 0)
	{
		console.error(`Core chunk boundary broken: ${failures.length} problem(s).`);
		for (const failure of failures)
		{
			console.error(`  - ${failure}`);
		}
		console.error('');
		process.exitCode = 1;
		return;
	}

	console.log('The core chunk holds only core modules and survives every feature edit.');
	console.log('');
};

main().catch((error) =>
{
	console.error(error);
	process.exit(1);
});
