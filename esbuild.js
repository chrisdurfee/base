import { build } from 'esbuild';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

/**
 * Shared esbuild options for every output.
 *
 * @type {import('esbuild').BuildOptions}
 */
export const shared = {
	bundle: true,
	sourcemap: true,
	minify: true,
	treeShaking: true,
	format: 'esm',
	target: ['esnext'],
	legalComments: 'none',
	logLevel: 'info',
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
		outdir: 'dist',
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
		outdir: 'dist',
		splitting: true,
		chunkNames: 'chunks/[name]-[hash]',
		...overrides
	};
};

/**
 * This will run both builds.
 *
 * @param {import('esbuild').BuildOptions} [overrides] Applied to both builds.
 * @returns {Promise<Array<import('esbuild').BuildResult>>}
 */
export const runBuild = (overrides = {}) =>
{
	return Promise.all([
		build(createRootOptions(overrides)),
		build(createFeatureOptions(overrides))
	]);
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
