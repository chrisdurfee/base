import { build } from 'esbuild';

/**
 * Shared esbuild options for every output.
 *
 * @type {import('esbuild').BuildOptions}
 */
const shared = {
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
 * Root bundle.
 *
 * This keeps the package root ('@base-framework/base') as a single,
 * self-contained file for backward compatibility and direct/CDN usage.
 * Splitting is intentionally disabled here so the root stays one file.
 */
const root = build({
	...shared,
	entryPoints: { base: 'src/base.js' },
	outdir: 'dist',
	splitting: false,
});

/**
 * Per-feature, code-split build.
 *
 * Each entry maps to a package subpath (see "exports" in package.json) so
 * apps can import only the parts they use. Splitting lets esbuild hoist the
 * shared code into common chunks instead of duplicating it across features,
 * which keeps the per-feature download small.
 */
const features = build({
	...shared,
	entryPoints: {
		'modules/ajax': 'src/entries/ajax.js',
		'modules/html': 'src/entries/html.js',
		'modules/date': 'src/entries/date.js',
		'modules/data': 'src/entries/data.js',
		'modules/state': 'src/entries/state.js',
		'modules/component': 'src/entries/component.js',
		'modules/router': 'src/entries/router.js',
	},
	outdir: 'dist',
	splitting: true,
	chunkNames: 'chunks/[name]-[hash]',
});

Promise.all([root, features]).catch(() => process.exit(1));
