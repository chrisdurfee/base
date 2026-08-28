import { build } from 'esbuild';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

/**
 * The directory every build writes to.
 *
 * @type {string}
 */
export const OUT_DIR = 'dist';

/**
 * Shared esbuild options for every output.
 *
 * `target` names the 4.0 floor browsers rather than an es-year. esbuild reads
 * only this array, so naming browsers keeps the stated floor and the emitted
 * syntax from drifting apart; a `browserslist` key would be ignored.
 *
 * The floor is iOS Safari 14.1 because that is where public static class
 * fields shipped. Asking for es2020, or for Safari 14.0, makes esbuild lower
 * every class field into a `__publicField` helper, which becomes its own
 * chunk that all seven subpaths then import for one extra request each.
 *
 * `sourcemap` is 'external' because the `files` whitelist excludes
 * dist/**\/*.map. Emitting linked maps would append a sourceMappingURL to
 * every published file pointing at a map that is not in the tarball.
 *
 * @type {import('esbuild').BuildOptions}
 */
export const shared = {
	bundle: true,
	sourcemap: 'external',
	minify: true,
	treeShaking: true,
	format: 'esm',
	target: ['safari14.1', 'chrome84', 'firefox79'],
	legalComments: 'none',
	logLevel: 'info',
	metafile: true,
	define: {
		__DEV__: 'false'
	},
	drop: ['debugger']
};

/**
 * The root bundle entry point.
 *
 * @type {Record<string, string>}
 */
export const rootEntryPoints = {
	base: 'src/base.js'
};

/**
 * The per-feature entry points. Each key maps to a package subpath (see
 * "exports" in package.json) so apps can import only the parts they use.
 *
 * There is deliberately no 'core' entry. esbuild groups modules into chunks
 * by the set of entry points that reach them, so adding one refines that
 * partition and splits chunks the features currently share; measured, it cost
 * every subpath 200-290 gzip bytes. The core boundary is instead an invariant
 * of the module layering, asserted by `npm run cache:check`.
 *
 * @type {Record<string, string>}
 */
export const featureEntryPoints = {
	'modules/ajax': 'src/entries/ajax.js',
	'modules/html': 'src/entries/html.js',
	'modules/date': 'src/entries/date.js',
	'modules/data': 'src/entries/data.js',
	'modules/state': 'src/entries/state.js',
	'modules/component': 'src/entries/component.js',
	'modules/router': 'src/entries/router.js',
};

/**
 * This will create the root bundle options.
 *
 * This keeps the package root ('@base-framework/base') as a single,
 * self-contained file for backward compatibility and direct/CDN usage.
 * Splitting is intentionally disabled here so the root stays one file.
 *
 * @param {import('esbuild').BuildOptions} [overrides]
 * @returns {import('esbuild').BuildOptions}
 */
export const createRootOptions = (overrides = {}) =>
{
	return {
		...shared,
		entryPoints: rootEntryPoints,
		outdir: OUT_DIR,
		splitting: false,
		...overrides
	};
};

/**
 * This will create the per-feature, code-split build options.
 *
 * Splitting lets esbuild hoist the shared code into common chunks instead
 * of duplicating it across features, which keeps the per-feature download
 * small.
 *
 * @param {import('esbuild').BuildOptions} [overrides]
 * @returns {import('esbuild').BuildOptions}
 */
export const createFeatureOptions = (overrides = {}) =>
{
	return {
		...shared,
		entryPoints: featureEntryPoints,
		outdir: OUT_DIR,
		splitting: true,
		chunkNames: 'chunks/[name]-[hash]',
		...overrides
	};
};

/**
 * This will empty the output directory.
 *
 * esbuild never removes anything it did not just write, and every content
 * hash change leaves the previous chunk behind. Without this the published
 * package carries every chunk the framework has ever built.
 *
 * @returns {void}
 */
export const cleanOutDir = () =>
{
	rmSync(OUT_DIR, { recursive: true, force: true });
	mkdirSync(OUT_DIR, { recursive: true });
};

/**
 * This will run both builds.
 *
 * @param {import('esbuild').BuildOptions} [overrides] Applied to both builds.
 * @returns {Promise<Array<import('esbuild').BuildResult>>}
 */
export const runBuild = async (overrides = {}) =>
{
	cleanOutDir();

	const results = await Promise.all([
		build(createRootOptions(overrides)),
		build(createFeatureOptions(overrides))
	]);

	const metafile = {
		inputs: {},
		outputs: {}
	};

	for (const result of results)
	{
		if (!result.metafile)
		{
			continue;
		}

		Object.assign(metafile.inputs, result.metafile.inputs);
		Object.assign(metafile.outputs, result.metafile.outputs);
	}

	writeFileSync(path.join(OUT_DIR, 'meta.json'), JSON.stringify(metafile));
	return results;
};

/**
 * Only build when executed directly (`node ./esbuild.js`). Importing this
 * module for its options must not trigger a write to dist.
 */
const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href)
{
	runBuild().catch(() => process.exit(1));
}
