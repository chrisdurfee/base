/**
 * Import-time registration survival check.
 *
 * Several framework modules register something the moment they are evaluated:
 * `events.js` and `unit.js` add DataTracker types, four layout directives add
 * more, `router.js` installs itself in the router registry, and every entry
 * point registers its directive sets. None of that is reachable from an
 * exported binding, so the only thing keeping it in a consumer's bundle is the
 * bundler agreeing that the emitted file it lives in has side effects.
 *
 * That agreement is `sideEffects` in package.json, and it is stated against
 * emitted file names. The emitted output bare-imports chunks purely for their
 * side effects (`import "../chunks/chunk-XXXX.js";`), so a registration that
 * moves into a chunk nothing names, or an entry file that drops out of
 * `sideEffects`, is a registration a consumer can silently lose. Measured: a
 * bare `import '@base-framework/base/component'` is 82kb with the entry
 * declared side-effectful and 0 bytes without it — no error, no warning, the
 * directives simply are not there.
 *
 * Nothing else catches this. The source is correct, the types are correct, the
 * sizes are correct, and the test suite imports `src` rather than `dist`, so
 * the whole class of failure exists only in the emitted output plus the
 * package metadata. This checks it the way a consumer would hit it: for every
 * published subpath it bundles a fixture whose only statement is a bare,
 * side-effect-only import of that subpath, against a staged copy of the real
 * `dist` and the real package.json, then evaluates the result and looks at
 * what actually ran.
 *
 * Three rules are enforced:
 *
 *   1. An emitted entry file that performs an import-time registration must be
 *      covered by `sideEffects`. Its own declared contract is otherwise
 *      deletable.
 *   2. For a subpath whose entry file is covered by `sideEffects`, a bare
 *      import must evaluate every emitted file in its graph that carries a
 *      registration.
 *   3. Where the subpath exports `Directives`, the live registry read back out
 *      of the evaluated bundle must contain the directive names that subpath
 *      promises.
 *
 * A subpath whose entry file carries no registration and is declared pure
 * (`data`, `html`, `state`, `date`) is expected to vanish under a bare import;
 * that is reported rather than failed, along with the registrations a bare
 * import of it therefore does not get.
 *
 * Usage:
 *   node ./scripts/side-effects-check.js            check, exit non-zero on loss
 *   node ./scripts/side-effects-check.js --verbose  also list every bare import
 *   node ./scripts/side-effects-check.js --no-build reuse the existing dist
 */

import { build } from 'esbuild';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { runBuild } from '../esbuild.js';

/**
 * Every source module that registers something when it is evaluated, mapped
 * to the call that does it.
 *
 * A new import-time registration has to be added here or it is not covered.
 * `--verbose` prints the registrations found per emitted file, so a missing
 * entry shows up as a suspiciously short list.
 *
 * @type {Record<string, string>}
 */
const REGISTRATIONS = {
	'src/base.js': 'registerDefaultDirectives()',
	'src/entries/component.js': 'registerDirectives(coreDirectives, reactiveDirectives)',
	'src/entries/router.js': 'registerDirectives(routerDirectives)',
	'src/main/events/events.js': "DataTracker.addType('events')",
	'src/modules/component/unit.js': "DataTracker.addType('components')",
	'src/modules/layout/directives/core/animate/animate.js': "DataTracker.addType('manual-destroy')",
	'src/modules/layout/directives/core/context/context-directives.js': "DataTracker.addType('context')",
	'src/modules/layout/directives/core/reactive/for-each.js': "DataTracker.addType('forScopes')",
	'src/modules/layout/directives/core/reactive/on-destroyed.js': "DataTracker.addType('destroyed')",
	'src/modules/layout/directives/core/route.js': "DataTracker.addType('routes')",
	'src/modules/layout/directives/core/switch.js': "DataTracker.addType('switch')",
	'src/modules/router/router.js': 'setRouter(router)'
};

/**
 * The directive names each subpath promises to have registered by the time a
 * bare import of it has been evaluated.
 *
 * Only the subpaths that export `Directives` can be checked this way — the
 * registry has to be readable from outside the bundle. Everything else is
 * covered by rule 2. A name added to a directive set belongs here too, which
 * is the point: the refactor may not quietly shrink a subpath's directive
 * surface.
 *
 * @type {Record<string, Array<string>>}
 */
const PROMISED_DIRECTIVES = {
	'.': [
		'cache', 'onCreated', 'onDestroyed', 'data', 'state', 'animateIn', 'animateOut',
		'useParent', 'useData', 'useState', 'getId', 'addState', 'addEvent', 'useContext',
		'addContext', 'context', 'role', 'aria', 'debug',
		'bind', 'onSet', 'onState', 'watch', 'map', 'for', 'dataSet', 'dataStateSet',
		'route', 'switch'
	],
	'./component': [
		'cache', 'onCreated', 'onDestroyed', 'data', 'state', 'animateIn', 'animateOut',
		'useParent', 'useData', 'useState', 'getId', 'addState', 'addEvent', 'useContext',
		'addContext', 'context', 'role', 'aria', 'debug',
		'bind', 'onSet', 'onState', 'watch', 'map', 'for', 'dataSet', 'dataStateSet'
	]
};

/**
 * The published package name, so the fixture specifiers resolve through
 * "exports" exactly as a consumer's would.
 *
 * @type {string}
 */
const PACKAGE_NAME = '@base-framework/base';

/**
 * The global the staging overlay records evaluated emitted files on.
 *
 * @type {string}
 */
const EVALUATED = '__baseEvaluatedOutputs';

/**
 * The global the staging overlay records live directive names on.
 *
 * @type {string}
 */
const DIRECTIVE_NAMES = '__baseRegisteredDirectives';

/**
 * This will normalize a path to the forward-slash form the metafile uses.
 *
 * @param {string} value
 * @returns {string}
 */
const toKey = (value) => value.split(path.sep).join('/');

/**
 * This will convert one `sideEffects` glob into an anchored regular
 * expression.
 *
 * The semantics are the bundler's, not the shell's: a leading './' is
 * dropped, a pattern with no slash matches at any depth, '**' crosses
 * directory boundaries and '*' does not.
 *
 * @param {string} pattern
 * @returns {RegExp}
 */
const toGlobPattern = (pattern) =>
{
	let glob = pattern.startsWith('./') ? pattern.slice(2) : pattern;
	if (!glob.includes('/'))
	{
		glob = `**/${glob}`;
	}

	let source = '';
	for (let i = 0; i < glob.length; i++)
	{
		const char = glob[i];
		if (char === '*')
		{
			if (glob[i + 1] === '*')
			{
				i++;

				/* A '**' followed by a separator has to be able to match
				 * nothing, so '**\/x.js' still matches a top level 'x.js'. */
				if (glob[i + 1] === '/')
				{
					i++;
					source += '(?:.*\\/)?';
					continue;
				}

				source += '.*';
				continue;
			}

			source += '[^/]*';
			continue;
		}

		if (char === '?')
		{
			source += '[^/]';
			continue;
		}

		source += char.replace(/[.+^${}()|[\]\\]/g, '\\$&');
	}

	return new RegExp(`^${source}$`);
};

/**
 * This will create a predicate deciding whether an emitted file is declared
 * side-effectful by the package.
 *
 * @param {boolean|string|Array<string>|undefined} sideEffects
 * @returns {function(string): boolean}
 */
const createSideEffectMatcher = (sideEffects) =>
{
	if (sideEffects === undefined || sideEffects === true)
	{
		return () => true;
	}

	if (sideEffects === false)
	{
		return () => false;
	}

	const patterns = (Array.isArray(sideEffects) ? sideEffects : [sideEffects]).map(toGlobPattern);
	return (file) => patterns.some((pattern) => pattern.test(file));
};

/**
 * This will resolve the transitive output graph of an emitted entry.
 *
 * @param {object} outputs The metafile outputs.
 * @param {string} entryFile
 * @returns {Array<string>}
 */
const resolveGraph = (outputs, entryFile) =>
{
	const seen = new Set([entryFile]);
	const queue = [entryFile];
	const graph = [];

	while (queue.length > 0)
	{
		const key = queue.shift();
		graph.push(key);

		for (const imported of (outputs[key]?.imports ?? []))
		{
			const target = imported.path;
			if (seen.has(target) || !outputs[target] || target.endsWith('.map'))
			{
				continue;
			}

			seen.add(target);
			queue.push(target);
		}
	}

	return graph;
};

/**
 * This will list the registrations an emitted file carries.
 *
 * @param {object} output A metafile output record.
 * @returns {Array<{module: string, call: string}>}
 */
const findRegistrations = (output) =>
{
	const found = [];
	for (const [module, call] of Object.entries(REGISTRATIONS))
	{
		const input = output.inputs[module];
		if (input && input.bytesInOutput > 0)
		{
			found.push({ module, call });
		}
	}

	return found;
};

/**
 * This will find every bare, side-effect-only import in an emitted file.
 *
 * A bare import is the only import form with nothing keeping it alive but the
 * `sideEffects` declaration, which is what makes them worth listing.
 *
 * @param {string} file The emitted file's path, used to resolve the targets.
 * @param {string} contents
 * @returns {Array<string>} Resolved, cwd-relative import targets.
 */
const findBareImports = (file, contents) =>
{
	/* Anchored on a statement boundary so `import{a}from"x"` and `import("x")`
	 * are both skipped. */
	const pattern = /(?:^|[;\n}])\s*import\s*(["'])([^"']+)\1/g;
	const dir = path.posix.dirname(toKey(file));
	const found = [];

	let match;
	while ((match = pattern.exec(contents)) !== null)
	{
		found.push(path.posix.normalize(path.posix.join(dir, match[2])));
	}

	return found;
};

/**
 * This will stage a throwaway consumer package.
 *
 * The fixtures have to resolve `@base-framework/base` through the real
 * "exports" map and pick up the real `sideEffects`, and a bundler only applies
 * `sideEffects` to something it resolved as a package. So the built `dist` and
 * the real package.json are copied into a node_modules tree rather than
 * imported by relative path. Copying instead of linking keeps this working
 * without the symlink privilege Windows wants.
 *
 * @param {string} root The repository root.
 * @returns {{dir: string, packageDir: string, cleanup: function(): void}}
 */
const stageConsumer = (root) =>
{
	const dir = path.join(os.tmpdir(), `base-side-effects-${process.pid}`);
	const packageDir = path.join(dir, 'node_modules', PACKAGE_NAME);

	rmSync(dir, { recursive: true, force: true });
	mkdirSync(packageDir, { recursive: true });

	cpSync(path.join(root, 'dist'), path.join(packageDir, 'dist'), {
		recursive: true,

		/* Source maps and declarations are irrelevant to resolution and are
		 * most of the bytes. */
		filter: (src) => (!src.endsWith('.map') && !src.endsWith('.d.ts'))
	});
	cpSync(path.join(root, 'package.json'), path.join(packageDir, 'package.json'));

	writeFileSync(
		path.join(dir, 'package.json'),
		`${JSON.stringify({ name: 'side-effects-fixture', version: '0.0.0', private: true, type: 'module' }, null, '\t')}\n`
	);

	return {
		dir,
		packageDir,
		cleanup: () => rmSync(dir, { recursive: true, force: true })
	};
};

/**
 * This will create the plugin that instruments the staged package.
 *
 * A dropped registration cannot be observed by importing the framework and
 * looking: reading its state needs an import, and an import is what stops the
 * drop. So the observation is planted inside the staged copy instead.
 *
 * Every staged emitted file gets a marker appended. A marker is a top level
 * expression statement, exactly like the registration calls beside it, so the
 * bundler keeps or drops the two together — and a marker is observable from
 * outside the bundle where a registration is not.
 *
 * Files that export `Directives` additionally get a self-import of it, which
 * lets the live registry be read back out. The self-import cannot keep the
 * file alive on its own: nothing outside the file references the added
 * binding, so the file's fate is still decided entirely by the consumer's
 * import and `sideEffects`.
 *
 * @param {string} packageDir
 * @param {Set<string>} directiveExporters Emitted files exporting `Directives`.
 * @returns {import('esbuild').Plugin}
 */
const createProbePlugin = (packageDir, directiveExporters) =>
{
	const distDir = path.join(packageDir, 'dist');

	return {
		name: 'side-effect-probe',
		setup(build)
		{
			build.onLoad({ filter: /\.js$/ }, (args) =>
			{
				if (!args.path.startsWith(distDir))
				{
					return null;
				}

				const key = `dist/${toKey(path.relative(distDir, args.path))}`;
				let contents = `${readFileSync(args.path, 'utf8')}\n;(globalThis.${EVALUATED} ??= []).push(${JSON.stringify(key)});\n`;

				if (directiveExporters.has(key))
				{
					const self = `./${path.posix.basename(key)}`;
					contents += `import { Directives as __baseProbeDirectives } from ${JSON.stringify(self)};\n` +
						`;(globalThis.${DIRECTIVE_NAMES} ??= []).push(...__baseProbeDirectives.items.keys());\n`;
				}

				return { contents, loader: 'js' };
			});
		}
	};
};

/**
 * This will bundle and evaluate one bare, side-effect-only import.
 *
 * @param {{dir: string, packageDir: string}} consumer
 * @param {import('esbuild').Plugin} probe
 * @param {string} specifier The subpath a consumer would write.
 * @param {number} nonce Keeps every fixture a distinct ES module.
 * @returns {Promise<{bytes: number, evaluated: Set<string>, directives: Set<string>}>}
 */
const probeBareImport = async (consumer, probe, specifier, nonce) =>
{
	const name = `fixture-${nonce}`;
	const entry = path.join(consumer.dir, `${name}.js`);
	writeFileSync(entry, `import ${JSON.stringify(specifier)};\n`);

	const outFile = path.join(consumer.dir, `${name}.bundle.js`);
	await build({
		entryPoints: [entry],
		outfile: outFile,
		absWorkingDir: consumer.dir,
		bundle: true,
		format: 'esm',
		platform: 'browser',
		treeShaking: true,
		logLevel: 'silent',
		plugins: [probe]
	});

	const bytes = readFileSync(outFile, 'utf8').length;

	globalThis[EVALUATED] = [];
	globalThis[DIRECTIVE_NAMES] = [];
	await import(pathToFileURL(outFile).href);
	const evaluated = new Set(globalThis[EVALUATED]);
	const directives = new Set(globalThis[DIRECTIVE_NAMES]);
	delete globalThis[EVALUATED];
	delete globalThis[DIRECTIVE_NAMES];

	return { bytes, evaluated, directives };
};

/**
 * This will collect the published subpaths and the emitted file each resolves
 * to.
 *
 * @param {object} packageJson
 * @param {object} outputs The metafile outputs.
 * @returns {Array<{subpath: string, specifier: string, file: string}>}
 */
const collectSubpaths = (packageJson, outputs) =>
{
	const entries = [];

	for (const [subpath, condition] of Object.entries(packageJson.exports ?? {}))
	{
		if (subpath === './package.json' || typeof condition !== 'object')
		{
			continue;
		}

		const target = condition.import ?? condition.require;
		if (!target)
		{
			continue;
		}

		const file = target.startsWith('./') ? target.slice(2) : target;
		if (!outputs[file])
		{
			throw new Error(`"exports" maps ${subpath} to ${target}, which the build did not emit.`);
		}

		entries.push({
			subpath,
			specifier: (subpath === '.') ? PACKAGE_NAME : `${PACKAGE_NAME}/${subpath.slice(2)}`,
			file
		});
	}

	return entries;
};

/**
 * This will pad a value to a column width.
 *
 * @param {string|number} value
 * @param {number} width
 * @param {boolean} [left=false]
 * @returns {string}
 */
const pad = (value, width, left = false) =>
{
	const text = String(value);
	return (left) ? text.padStart(width) : text.padEnd(width);
};

/**
 * Entry point.
 *
 * @returns {Promise<void>}
 */
const main = async () =>
{
	const verbose = process.argv.includes('--verbose');
	const root = process.cwd();

	if (!process.argv.includes('--no-build'))
	{
		await runBuild({ logLevel: 'silent' });
	}

	const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
	const metafile = JSON.parse(readFileSync(path.join(root, 'dist', 'meta.json'), 'utf8'));
	const outputs = metafile.outputs;
	const isSideEffectful = createSideEffectMatcher(packageJson.sideEffects);
	const failures = [];
	const notes = [];

	console.log('');
	console.log('Import-time registration survival');
	console.log('');
	console.log(`  package "sideEffects": ${JSON.stringify(packageJson.sideEffects)}`);
	console.log('');

	/**
	 * Which emitted file carries which registration, derived from the build's
	 * own metafile so a re-partitioned chunk graph is followed automatically.
	 */
	const carriers = new Map();
	for (const [file, output] of Object.entries(outputs))
	{
		if (file.endsWith('.map'))
		{
			continue;
		}

		const registrations = findRegistrations(output);
		if (registrations.length > 0)
		{
			carriers.set(file, registrations);
		}
	}

	const directiveExporters = new Set(
		Object.keys(outputs).filter((file) => !file.endsWith('.map') && (outputs[file].exports ?? []).includes('Directives'))
	);

	console.log(`  ${carriers.size} emitted file(s) carry an import-time registration.`);
	for (const [file, registrations] of carriers)
	{
		console.log(`    ${isSideEffectful(file) ? 'side-effectful' : 'declared pure '}  ${file}`);
		if (verbose)
		{
			for (const registration of registrations)
			{
				console.log(`        ${registration.call}  (${registration.module})`);
			}
		}
	}
	console.log('');

	const subpaths = collectSubpaths(packageJson, outputs);

	/**
	 * Rule 1: an emitted entry file that performs a registration is making a
	 * promise to whoever imports that subpath, and a promise the bundler is
	 * allowed to delete is not a promise.
	 */
	const undeclared = new Set();
	for (const { specifier, file } of subpaths)
	{
		if (!carriers.has(file) || isSideEffectful(file))
		{
			continue;
		}

		undeclared.add(file);
		failures.push(
			`${file} performs ${carriers.get(file).map((entry) => entry.call).join(', ')} at import time but is not covered by package.json "sideEffects", ` +
			`so a bundler may delete the whole file. A consumer writing "import '${specifier}'" gets an empty bundle and no registration, silently.`
		);
	}

	/**
	 * Rules 2 and 3, measured rather than reasoned about: bundle a bare import
	 * of every subpath and look at what ran.
	 */
	const consumer = stageConsumer(root);
	const probe = createProbePlugin(consumer.packageDir, directiveExporters);
	let nonce = 0;

	try
	{
		console.log('  Bare side-effect-only import of each published subpath');
		console.log('');
		console.log(`    ${pad('subpath', 32)}${pad('bytes', 9, true)}  ${pad('files', 7, true)}  ${pad('regs', 6, true)}  ${pad('directives', 11, true)}`);
		console.log(`    ${'-'.repeat(32 + 9 + 7 + 6 + 11 + 8)}`);

		for (const { subpath, specifier, file } of subpaths)
		{
			const graph = resolveGraph(outputs, file);
			const required = graph.filter((item) => carriers.has(item));
			const { bytes, evaluated, directives } = await probeBareImport(consumer, probe, specifier, nonce++);

			const declared = isSideEffectful(file);
			const missing = declared ? required.filter((item) => !evaluated.has(item)) : [];
			const promised = PROMISED_DIRECTIVES[subpath] ?? null;
			const absent = promised ? promised.filter((name) => !directives.has(name)) : [];

			const status = (missing.length === 0 && absent.length === 0 && !undeclared.has(file)) ? 'ok  ' : 'FAIL';
			console.log(
				`  ${status}${pad(specifier, 32)}${pad(bytes.toLocaleString('en-US'), 9, true)}  ` +
				`${pad(`${evaluated.size}/${graph.length}`, 7, true)}  ` +
				`${pad(declared ? `${required.length - missing.length}/${required.length}` : '-', 6, true)}  ` +
				`${pad(promised ? `${promised.length - absent.length}/${promised.length}` : '-', 11, true)}` +
				`${declared ? '' : '   (declared pure)'}`
			);

			for (const item of missing)
			{
				const calls = carriers.get(item).map((entry) => entry.call).join(', ');
				console.log(`        LOST  ${item}  ${calls}`);

				failures.push(
					`a bare "import '${specifier}'" did not evaluate ${item}, so ${calls} never ran. ` +
					`${file} is declared side-effectful, but ${item} is reached from it by a side-effect-only import and is not covered by "sideEffects", ` +
					'so the bundler deleted it. Nothing throws and nothing is logged: the directive or DataTracker type simply is not there at runtime, ' +
					'and the first symptom is a layout key being ignored or an element never being cleaned up.'
				);
			}

			if (absent.length > 0)
			{
				console.log(`        MISSING DIRECTIVES  ${absent.join(', ')}`);

				failures.push(
					`after a bare "import '${specifier}'" the live Directives registry is missing ${absent.length} promised directive(s): ${absent.join(', ')}. ` +
					`It holds ${directives.size} name(s). A layout using any missing key is silently ignored by the parser rather than erroring.`
				);
			}

			if (!declared && !undeclared.has(file) && required.length > 0)
			{
				notes.push(
					`"import '${specifier}'" is eliminated entirely (${bytes} bytes). ${file} is declared pure and performs no registration of its own, so that is correct, ` +
					`but it does mean a bare import of this subpath does not run ${[...new Set(required.flatMap((item) => carriers.get(item).map((entry) => entry.call)))].join(', ')}. ` +
					'Those live in shared chunks and are retained by any named import from this subpath.'
				);
			}

			if (verbose)
			{
				for (const item of graph)
				{
					console.log(`        ${evaluated.has(item) ? 'ran ' : 'gone'}  ${item}${carriers.has(item) ? '  [registers]' : ''}`);
				}
			}
		}
	}
	finally
	{
		consumer.cleanup();
	}

	console.log('');

	/**
	 * The static cross-check. The measurements above say whether a
	 * registration survives; this says how much surface is one chunk
	 * re-partition away from becoming one of those measurements.
	 */
	console.log('  Bare chunk imports vs "sideEffects"');
	console.log('');

	let bareCount = 0;
	const pureBare = new Map();
	for (const file of Object.keys(outputs))
	{
		if (file.endsWith('.map'))
		{
			continue;
		}

		const contents = readFileSync(path.join(root, file), 'utf8');
		for (const target of findBareImports(file, contents))
		{
			bareCount++;
			if (isSideEffectful(target))
			{
				continue;
			}

			if (!pureBare.has(target))
			{
				pureBare.set(target, []);
			}
			pureBare.get(target).push(file);
		}
	}

	console.log(`    ${bareCount} bare, side-effect-only import(s) across the emitted output.`);
	console.log(`    ${pureBare.size} distinct chunk(s) imported only for their side effects yet declared pure:`);
	for (const target of [...pureBare.keys()].sort())
	{
		const registrations = carriers.get(target);
		console.log(`      ${target}${registrations ? `  <-- carries ${registrations.map((entry) => entry.call).join(', ')}` : ''}`);
		if (verbose)
		{
			for (const importer of pureBare.get(target))
			{
				console.log(`          imported by ${importer}`);
			}
		}
	}

	console.log('');

	if (notes.length > 0)
	{
		console.log('  Notes');
		console.log('');
		for (const note of notes)
		{
			console.log(`    - ${note}`);
		}
		console.log('');
	}

	if (failures.length > 0)
	{
		console.error(`Import-time registrations are being dropped: ${failures.length} problem(s).`);
		console.error('');
		for (const failure of failures)
		{
			console.error(`  - ${failure}`);
			console.error('');
		}
		console.error('  Fix by covering the emitted file in package.json "sideEffects", or by moving the');
		console.error('  registration into a file the consumer names something from.');
		console.error('');
		process.exitCode = 1;
		return;
	}

	console.log('Every published subpath keeps its import-time registrations under a bare import.');
	console.log('');
};

main().catch((error) =>
{
	console.error(error);
	process.exit(1);
});
