const esbuild = require('esbuild');

esbuild
    .build({
        entryPoints: ['src/base.js'],
        outdir: 'dist',
        bundle: true,
        sourcemap: true,
        minify: false,
        minifyWhitespace: true,
        minifyIdentifiers: true,
        splitting: true,
        format: 'esm',
        target: ['esnext']
    })
    .catch(() => process.exit(1));