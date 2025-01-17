import { build } from 'esbuild';

build({
	entryPoints: ['src/base.js'],
	outdir: 'dist',
	bundle: true,
	sourcemap: true,
	minify: true,
	splitting: true,
	treeShaking: true,
	format: 'esm',
	target: ['esnext'],
})
.catch(() => process.exit(1));
