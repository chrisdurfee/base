/**
 * Bundle size reporter.
 *
 * Runs the exact builds `esbuild.js` produces (the options are imported from
 * it so there is one source of truth) with `metafile: true` and `write: false`,
 * then resolves the live chunk graph for every published entry point from the
 * metafile. Nothing is ever globbed off disk: `esbuild` does not clean its
 * outdir, so `dist/chunks/` accumulates stale chunks from previous builds and
 * a directory listing would wildly over-report.
 *
 * Usage:
 *   node ./scripts/size-report.js                 write + print the baseline
 *   node ./scripts/size-report.js --check         compare against the baseline
 *   node ./scripts/size-report.js --check --threshold=5
 *   node ./scripts/size-report.js --verbose       list each entry's chunks
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import {
	createFeatureOptions,
	createRootOptions,
	featureEntryPoints,
	rootEntryPoints
} from '../esbuild.js';
import { build } from 'esbuild';

/**
 * The gzip level used for every measurement. Level 9 is what the `gzip-size`
 * ecosystem uses, so numbers here are comparable with other size budgets.
 *
 * @type {number}
 */
const GZIP_LEVEL = 9;

/**
 * Brotli quality used for every measurement (the zlib maximum, and the
 * default for `brotliCompressSync`).
 *
 * @type {number}
 */
const BROTLI_QUALITY = constants.BROTLI_MAX_QUALITY;

/**
 * Default regression threshold, as a percentage.
 *
 * @type {number}
 */
const DEFAULT_THRESHOLD = 3;

/**
 * Path of the committed baseline.
 *
 * @type {string}
 */
const BASELINE_PATH = path.resolve(process.cwd(), 'size-baseline.json');

/**
 * This will parse the command line arguments.
 *
 * @param {Array<string>} argv
 * @returns {{check: boolean, verbose: boolean, threshold: number}}
 */
const parseArgs = (argv) =>
{
	const options =
	{
		check: argv.includes('--check'),
		verbose: argv.includes('--verbose'),
		threshold: DEFAULT_THRESHOLD
	};

	for (const arg of argv)
	{
		if (arg.startsWith('--threshold='))
		{
			const value = Number(arg.slice('--threshold='.length));
			if (Number.isFinite(value) && value >= 0)
			{
				options.threshold = value;
			}
		}
	}

	return options;
};

/**
 * This will normalize an absolute output path into the same
 * cwd-relative, forward-slash form the metafile uses as its keys.
 *
 * @param {string} absolute
 * @returns {string}
 */
const toMetafileKey = (absolute) =>
{
	return path.relative(process.cwd(), absolute).split(path.sep).join('/');
};

/**
 * This will run both builds in memory and merge their results.
 *
 * @returns {Promise<{outputs: object, contents: Map<string, Uint8Array>}>}
 */
const runBuilds = async () =>
{
	const overrides =
	{
		metafile: true,
		write: false,
		logLevel: 'silent'
	};

	const results = await Promise.all([
		build(createRootOptions(overrides)),
		build(createFeatureOptions(overrides))
	]);

	const outputs = {};
	const contents = new Map();

	for (const result of results)
	{
		Object.assign(outputs, result.metafile.outputs);

		for (const file of result.outputFiles)
		{
			contents.set(toMetafileKey(file.path), file.contents);
		}
	}

	return { outputs, contents };
};

/**
 * This will find the output file produced for a source entry point.
 *
 * @param {object} outputs The merged metafile outputs.
 * @param {string} entryPoint e.g. 'src/entries/component.js'
 * @returns {string} The output key, e.g. 'dist/modules/component.js'.
 */
const findEntryOutput = (outputs, entryPoint) =>
{
	for (const key of Object.keys(outputs))
	{
		if (outputs[key].entryPoint === entryPoint)
		{
			return key;
		}
	}

	throw new Error(`No build output found for entry point "${entryPoint}".`);
};

/**
 * This will resolve the live transitive chunk graph for an output.
 *
 * Source maps are excluded: they are stripped from the published package
 * (see the "files" field in package.json) and are never downloaded by an
 * app at runtime.
 *
 * @param {object} outputs The merged metafile outputs.
 * @param {string} entryKey
 * @returns {Array<string>} The entry followed by its chunks, in walk order.
 */
const resolveGraph = (outputs, entryKey) =>
{
	const seen = new Set([entryKey]);
	const queue = [entryKey];
	const graph = [];

	while (queue.length > 0)
	{
		const key = queue.shift();
		graph.push(key);

		const meta = outputs[key];
		if (!meta || !meta.imports)
		{
			continue;
		}

		for (const imported of meta.imports)
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
 * This will measure a single file.
 *
 * @param {Map<string, Uint8Array>} contents
 * @param {string} key
 * @returns {{file: string, raw: number, gzip: number, brotli: number}}
 */
const measureFile = (contents, key) =>
{
	const bytes = contents.get(key);
	if (!bytes)
	{
		throw new Error(`No output contents captured for "${key}".`);
	}

	const buffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);

	return {
		file: key,
		raw: buffer.length,
		gzip: gzipSync(buffer, { level: GZIP_LEVEL }).length,
		brotli: brotliCompressSync(buffer, {
			params: {
				[constants.BROTLI_PARAM_QUALITY]: BROTLI_QUALITY
			}
		}).length
	};
};

/**
 * This will measure one entry point and its live chunks.
 *
 * @param {object} outputs
 * @param {Map<string, Uint8Array>} contents
 * @param {string} entryPoint
 * @returns {object}
 */
const measureEntry = (outputs, contents, entryPoint) =>
{
	const entryKey = findEntryOutput(outputs, entryPoint);
	const graph = resolveGraph(outputs, entryKey);
	const files = graph.map((key) => measureFile(contents, key));

	const totals = files.reduce((sum, file) =>
	{
		sum.raw += file.raw;
		sum.gzip += file.gzip;
		sum.brotli += file.brotli;
		return sum;
	}, { raw: 0, gzip: 0, brotli: 0 });

	return {
		entryPoint,
		entryFile: entryKey,
		chunkCount: files.length - 1,
		raw: totals.raw,
		gzip: totals.gzip,
		brotli: totals.brotli,
		files
	};
};

/**
 * This will build the full report.
 *
 * @returns {Promise<object>}
 */
const createReport = async () =>
{
	const { outputs, contents } = await runBuilds();

	/**
	 * The subpath name for each feature entry, taken from the esbuild entry
	 * key ('modules/component' -> 'component'). These match the package.json
	 * "exports" subpaths.
	 */
	const entries = {};
	entries.root = measureEntry(outputs, contents, rootEntryPoints.base);

	for (const [outName, entryPoint] of Object.entries(featureEntryPoints))
	{
		const name = outName.replace(/^modules\//, '');
		entries[name] = measureEntry(outputs, contents, entryPoint);
	}

	/**
	 * Every distinct live output across all entries, so the shared chunks
	 * are counted once instead of once per entry that imports them.
	 */
	const uniqueFiles = new Map();
	for (const entry of Object.values(entries))
	{
		for (const file of entry.files)
		{
			uniqueFiles.set(file.file, file);
		}
	}

	const distinct = [...uniqueFiles.values()].reduce((sum, file) =>
	{
		sum.raw += file.raw;
		sum.gzip += file.gzip;
		sum.brotli += file.brotli;
		return sum;
	}, { raw: 0, gzip: 0, brotli: 0 });

	return {
		generatedAt: new Date().toISOString(),
		compression:
		{
			gzipLevel: GZIP_LEVEL,
			brotliQuality: BROTLI_QUALITY
		},
		entries,
		distinctLiveOutputs:
		{
			fileCount: uniqueFiles.size,
			raw: distinct.raw,
			gzip: distinct.gzip,
			brotli: distinct.brotli
		}
	};
};

/**
 * This will format a byte count with thousands separators.
 *
 * @param {number} value
 * @returns {string}
 */
const bytes = (value) => value.toLocaleString('en-US');

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
	return (left)? text.padStart(width) : text.padEnd(width);
};

/**
 * This will print the human readable table.
 *
 * @param {object} report
 * @param {boolean} verbose
 * @returns {void}
 */
const printReport = (report, verbose) =>
{
	const rows = Object.entries(report.entries).map(([name, entry]) => ({
		name,
		file: entry.entryFile,
		chunks: entry.chunkCount,
		raw: entry.raw,
		gzip: entry.gzip,
		brotli: entry.brotli
	}));

	const widths =
	{
		name: Math.max(9, ...rows.map((row) => row.name.length)),
		file: Math.max(10, ...rows.map((row) => row.file.length)),
		chunks: 6,
		raw: 10,
		gzip: 10,
		brotli: 10
	};

	console.log('');
	console.log(`Bundle size report  (gzip level ${report.compression.gzipLevel}, brotli quality ${report.compression.brotliQuality})`);
	console.log('');
	console.log([
		pad('entry', widths.name),
		pad('output', widths.file),
		pad('chunks', widths.chunks, true),
		pad('raw', widths.raw, true),
		pad('gzip', widths.gzip, true),
		pad('brotli', widths.brotli, true)
	].join('  '));
	console.log('-'.repeat(widths.name + widths.file + widths.chunks + widths.raw + widths.gzip + widths.brotli + 10));

	for (const row of rows)
	{
		console.log([
			pad(row.name, widths.name),
			pad(row.file, widths.file),
			pad(row.chunks, widths.chunks, true),
			pad(bytes(row.raw), widths.raw, true),
			pad(bytes(row.gzip), widths.gzip, true),
			pad(bytes(row.brotli), widths.brotli, true)
		].join('  '));

		if (!verbose)
		{
			continue;
		}

		for (const file of report.entries[row.name].files)
		{
			console.log(`  ${pad('', widths.name)}${file.file}  raw ${bytes(file.raw)}  gzip ${bytes(file.gzip)}  brotli ${bytes(file.brotli)}`);
		}
	}

	const distinct = report.distinctLiveOutputs;
	console.log('');
	console.log(`distinct live outputs: ${distinct.fileCount} files, raw ${bytes(distinct.raw)}, gzip ${bytes(distinct.gzip)}, brotli ${bytes(distinct.brotli)}`);

	/**
	 * Success metric for the bundle-restructuring phase: importing only the
	 * component toolkit currently downloads more compressed bytes than
	 * importing the entire framework from the package root.
	 */
	const root = report.entries.root;
	const component = report.entries.component;
	const delta = component.gzip - root.gzip;
	const percent = ((delta / root.gzip) * 100).toFixed(1);
	const relation = (delta > 0)? 'EXCEEDS' : 'is under';

	console.log('');
	console.log(`SUCCESS METRIC (component vs root gzip): 'component' subpath gzip ${bytes(component.gzip)} ${relation} root bundle gzip ${bytes(root.gzip)} by ${bytes(Math.abs(delta))} bytes (${percent}%).`);
	console.log('  The code-split component entry should be a strict subset of the root bundle.');
	console.log('  Driving this negative is the target of the bundle-restructuring phase.');
	console.log('');
};

/**
 * This will compare a report against the committed baseline.
 *
 * @param {object} report
 * @param {number} threshold Percentage.
 * @returns {boolean} True when no entry regressed past the threshold.
 */
const checkReport = (report, threshold) =>
{
	if (!existsSync(BASELINE_PATH))
	{
		console.error(`No baseline found at ${BASELINE_PATH}. Run "npm run size" first.`);
		return false;
	}

	const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
	const metrics = ['raw', 'gzip', 'brotli'];
	const failures = [];

	console.log('');
	console.log(`Bundle size check  (threshold ${threshold}%)`);
	console.log('');

	if (baseline.compression && baseline.compression.gzipLevel !== report.compression.gzipLevel)
	{
		console.error('Baseline was recorded with different compression settings; regenerate it.');
		return false;
	}

	for (const [name, current] of Object.entries(report.entries))
	{
		const previous = baseline.entries[name];
		if (!previous)
		{
			console.log(`  ${pad(name, 12)} NEW ENTRY (no baseline)`);
			continue;
		}

		const parts = [];
		let entryFailed = false;

		for (const metric of metrics)
		{
			const before = previous[metric];
			const after = current[metric];
			const delta = after - before;
			const percent = (before === 0)? 0 : (delta / before) * 100;

			parts.push(`${metric} ${bytes(after)} (${(percent >= 0)? '+' : ''}${percent.toFixed(2)}%)`);

			if (percent > threshold)
			{
				entryFailed = true;
				failures.push(`${name}.${metric} grew ${percent.toFixed(2)}% (${bytes(before)} -> ${bytes(after)})`);
			}
		}

		console.log(`  ${entryFailed ? 'FAIL' : 'ok  '} ${pad(name, 12)} ${parts.join('  ')}`);
	}

	console.log('');

	if (failures.length > 0)
	{
		console.error(`Bundle size regression: ${failures.length} metric(s) past the ${threshold}% threshold.`);
		for (const failure of failures)
		{
			console.error(`  - ${failure}`);
		}
		console.error('');
		return false;
	}

	console.log(`No entry regressed past ${threshold}%.`);
	console.log('');
	return true;
};

/**
 * Entry point.
 *
 * @returns {Promise<void>}
 */
const main = async () =>
{
	const options = parseArgs(process.argv.slice(2));
	const report = await createReport();

	if (options.check)
	{
		printReport(report, options.verbose);
		const passed = checkReport(report, options.threshold);
		process.exitCode = passed ? 0 : 1;
		return;
	}

	printReport(report, options.verbose);
	writeFileSync(BASELINE_PATH, `${JSON.stringify(report, null, '\t')}\n`);
	console.log(`Wrote ${toMetafileKey(BASELINE_PATH)}`);
	console.log('');
};

main().catch((error) =>
{
	console.error(error);
	process.exit(1);
});
