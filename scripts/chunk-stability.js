/**
 * Chunk cache stability check.
 *
 * The framework ships content-hashed chunks. A chunk's hash covers its own
 * code and the names of the chunks it imports, so an edit propagates to
 * everything above it in the graph but never below. That makes the bottom of
 * the graph — the core runtime — the one thing a consuming app can keep
 * cached across framework releases, and it only holds while the core chunk
 * contains core modules and nothing else. A feature module that drifts into
 * it turns every feature release into a full cache invalidation.
 *
 * This asserts three things:
 *
 *   1. The core chunk holds exactly CORE_MODULES.
 *   2. Editing a feature module leaves the core chunk's hash untouched.
 *   3. Editing any one module invalidates no more outputs than the committed
 *      budget in `cache-baseline.json` allows.
 *
 * The first two only test the harmless direction. Hashes propagate upward, so
 * "an edit above the core did not change the core" is close to a restatement
 * of how content hashing works. What a consuming app actually pays is the
 * upward direction: one module changes and some number of files they had
 * cached stop matching. That is the third assertion, and it is the one that
 * regresses when the chunk graph is re-partitioned.
 *
 * Two kinds of output are counted, because a filename-only measurement lies:
 *
 *   - Chunks (`dist/chunks/chunk-[hash].js`) are named after their contents,
 *     so a changed chunk is a chunk name that disappeared.
 *   - Entries (`dist/modules/*.js`) are not hashed. Their bytes change — the
 *     module's own code, or just the chunk name in an import specifier — while
 *     their filename stays put. Counting filenames scores these zero and hides
 *     a real invalidation, so their contents are hashed here instead.
 *
 * Usage:
 *   node ./scripts/chunk-stability.js                  check, exit non-zero on drift
 *   node ./scripts/chunk-stability.js --verbose        also list every chunk
 *   node ./scripts/chunk-stability.js --update-budget  rewrite cache-baseline.json
 */

import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
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
 * The modules the blast radius is measured against.
 *
 * A superset of FEATURE_PROBES, spread deliberately across the depth of the
 * graph: the core helpers everything reaches, the mid-layer modules several
 * features share, and the leaf features only one entry reaches. The point of
 * the spread is that the shape of the numbers is itself the signal — a leaf
 * module that starts invalidating half the output means the graph has been
 * flattened.
 *
 * @type {Array<string>}
 */
const BLAST_PROBES = [
	'src/shared/strings.js',
	'src/shared/dom.js',
	'src/main/events/events.js',
	'src/main/data-tracker/data-tracker.js',
	'src/modules/data-binder/data-binder.js',
	'src/modules/data/types/basic-data.js',
	'src/modules/html/html.js',
	'src/modules/state/state-tracker.js',
	'src/modules/component/component.js',
	'src/modules/router/router.js',
	'src/modules/date/date-time.js',
	'src/modules/ajax/xhr-request.js'
];

/**
 * Path of the committed cache budget.
 *
 * @type {string}
 */
const BUDGET_PATH = path.resolve(process.cwd(), 'cache-baseline.json');

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
 * This will build the feature graph.
 *
 * One build serves both assertions: `chunks` describes the chunk contents the
 * boundary check needs, and `chunkNames`/`entryHashes` are the two identities
 * the blast radius is counted over.
 *
 * @param {string|null} [probe] A source module to perturb.
 * @returns {Promise<{chunks: Array<{file: string, modules: Array<string>, imports: Array<string>}>, chunkNames: Set<string>, entryHashes: Map<string, string>}>}
 */
const buildGraph = async (probe = null) =>
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

	const chunkNames = new Set();
	const entryHashes = new Map();

	for (const file of result.outputFiles)
	{
		const key = toKey(path.relative(process.cwd(), file.path));
		if (key.endsWith('.map'))
		{
			continue;
		}

		if (key.includes('/chunks/'))
		{
			chunkNames.add(key);
			continue;
		}

		entryHashes.set(key, createHash('sha256').update(file.contents).digest('hex'));
	}

	return { chunks, chunkNames, entryHashes };
};

/**
 * This will count the outputs a perturbed build invalidated.
 *
 * @param {{chunkNames: Set<string>, entryHashes: Map<string, string>}} base
 * @param {{chunkNames: Set<string>, entryHashes: Map<string, string>}} perturbed
 * @returns {{chunks: Array<string>, entries: Array<string>}}
 */
const measureBlast = (base, perturbed) =>
{
	/* A chunk's name is its content hash, so a chunk whose name is gone from
	 * the perturbed build is a chunk a consumer has to download again. */
	const chunks = [...base.chunkNames].filter((name) => !perturbed.chunkNames.has(name)).sort();

	/* Entry filenames never move, so the bytes are what tell. An entry changes
	 * either because its own module changed or because a chunk name in one of
	 * its import specifiers did. */
	const entries = [...base.entryHashes.keys()]
		.filter((file) => perturbed.entryHashes.get(file) !== base.entryHashes.get(file))
		.sort();

	return { chunks, entries };
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
	const updateBudget = process.argv.includes('--update-budget');
	const failures = [];

	const baseline = await buildGraph();
	const chunks = baseline.chunks;
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

	/**
	 * Every probe is built once and used for both assertions: the core
	 * boundary needs the perturbed chunk contents, the blast radius needs the
	 * perturbed output identities.
	 */
	const perturbedGraphs = new Map();
	for (const probe of BLAST_PROBES)
	{
		perturbedGraphs.set(probe, await buildGraph(probe));
	}

	for (const probe of FEATURE_PROBES)
	{
		const graph = perturbedGraphs.get(probe) ?? await buildGraph(probe);
		const perturbed = findCoreChunk(graph.chunks);
		const stable = (perturbed !== null && perturbed.file === core.file);

		console.log(`  ${stable ? 'ok  ' : 'FAIL'} edit ${probe} -> core chunk ${perturbed ? perturbed.file : 'missing'}`);

		if (!stable)
		{
			failures.push(`editing ${probe} rehashed the core chunk (${core.file} -> ${perturbed ? perturbed.file : 'missing'})`);
		}
	}

	console.log('');

	/**
	 * Cache blast radius: how much of the output one edited module
	 * invalidates.
	 */
	const chunkCount = baseline.chunkNames.size;
	const entryCount = baseline.entryHashes.size;

	console.log(`Cache blast radius  (${chunkCount} hashed chunks + ${entryCount} unhashed entries = ${chunkCount + entryCount} outputs)`);
	console.log('');

	const budget = (existsSync(BUDGET_PATH))
		? JSON.parse(readFileSync(BUDGET_PATH, 'utf8'))
		: null;

	if (budget === null && !updateBudget)
	{
		console.error(`No cache budget found at ${BUDGET_PATH}. Run "node ./scripts/chunk-stability.js --update-budget" to record one.`);
		process.exitCode = 1;
		return;
	}

	const measured = {};
	for (const probe of BLAST_PROBES)
	{
		const blast = measureBlast(baseline, perturbedGraphs.get(probe));
		const total = blast.chunks.length + blast.entries.length;
		measured[probe] = {
			chunks: blast.chunks.length,
			entries: blast.entries.length
		};

		const allowed = budget?.probes?.[probe] ?? null;
		let status = 'ok  ';

		if (!updateBudget)
		{
			if (allowed === null)
			{
				status = 'FAIL';
				failures.push(`${probe} has no entry in ${path.basename(BUDGET_PATH)}; record one with --update-budget after reviewing its blast radius`);
			}
			else if (blast.chunks.length > allowed.chunks || blast.entries.length > allowed.entries)
			{
				status = 'FAIL';
				failures.push(
					`editing ${probe} now invalidates ${blast.chunks.length} of ${chunkCount} chunks and ${blast.entries.length} of ${entryCount} entries, ` +
					`over the committed budget of ${allowed.chunks} and ${allowed.entries}. Every consumer re-downloads those files on this release. ` +
					`Chunks: ${blast.chunks.join(', ') || 'none'}. Entries: ${blast.entries.join(', ') || 'none'}.`
				);
			}
		}

		const budgetText = (allowed === null)
			? 'no budget'
			: `budget ${allowed.chunks}/${allowed.entries}`;

		console.log(
			`  ${status} edit ${probe.padEnd(44)} ` +
			`chunks ${String(blast.chunks.length).padStart(2)}/${chunkCount}  ` +
			`entries ${String(blast.entries.length).padStart(2)}/${entryCount}  ` +
			`total ${String(total).padStart(2)}/${chunkCount + entryCount}  (${budgetText})`
		);

		if (verbose)
		{
			for (const file of [...blast.chunks, ...blast.entries])
			{
				console.log(`         ${file}`);
			}
		}
	}

	console.log('');

	if (updateBudget)
	{
		const record = {
			generatedAt: new Date().toISOString(),
			chunkCount,
			entryCount,
			probes: measured
		};

		writeFileSync(BUDGET_PATH, `${JSON.stringify(record, null, '\t')}\n`);
		console.log(`Wrote ${toKey(path.relative(process.cwd(), BUDGET_PATH))}`);
		console.log('');
	}
	else if (budget.chunkCount !== chunkCount || budget.entryCount !== entryCount)
	{
		/**
		 * Not a failure on its own — re-partitioning the graph is the point of
		 * the work this guards — but the per-probe counts are read against a
		 * different denominator once it happens, so it has to be visible.
		 */
		console.log(`  NOTE the output count moved since the budget was recorded: ${budget.chunkCount} chunks + ${budget.entryCount} entries -> ${chunkCount} + ${entryCount}.`);
		console.log('       Re-read the per-probe numbers against the new denominator before trusting them.');
		console.log('');
	}

	if (failures.length > 0)
	{
		console.error(`Chunk cache stability broken: ${failures.length} problem(s).`);
		console.error('');
		for (const failure of failures)
		{
			console.error(`  - ${failure}`);
		}
		console.error('');
		process.exitCode = 1;
		return;
	}

	console.log('The core chunk holds only core modules, survives every feature edit, and no module');
	console.log('invalidates more output than the committed budget allows.');
	console.log('');
};

main().catch((error) =>
{
	console.error(error);
	process.exit(1);
});
