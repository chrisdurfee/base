/**
 * Runtime benchmark harness.
 *
 * Every benchmark warms up, then collects one sample per iteration and
 * reports the median and p95 rather than a mean, so a single GC pause does
 * not dominate the number. Results are printed and written to
 * bench-baseline.json.
 *
 * The framework probes for `window`/`document` when its modules are first
 * imported, so the DOM is installed on globalThis before anything is loaded
 * (hence the dynamic imports below).
 *
 * Usage:
 *   node --expose-gc ./scripts/bench.js
 *   node ./scripts/bench.js --env=node        skip the DOM-dependent suites
 *   node ./scripts/bench.js --quick           fewer iterations
 */

import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import process from 'node:process';

/**
 * @type {Array<string>}
 */
const argv = process.argv.slice(2);

/**
 * This will read a `--name=value` flag.
 *
 * @param {string} name
 * @param {string} fallback
 * @returns {string}
 */
const flag = (name, fallback) =>
{
	const prefix = `--${name}=`;
	const found = argv.find((arg) => arg.startsWith(prefix));
	return (found)? found.slice(prefix.length) : fallback;
};

/**
 * @type {string} 'jsdom' or 'node'
 */
const ENV = flag('env', 'jsdom');

/**
 * @type {boolean}
 */
const QUICK = argv.includes('--quick');

/**
 * Path of the written baseline.
 *
 * @type {string}
 */
const BASELINE_PATH = path.resolve(process.cwd(), 'bench-baseline.json');

/**
 * This will yield to the macrotask queue so every pending publish batch
 * (and any cascade it schedules) has been delivered.
 *
 * @returns {Promise<void>}
 */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * This will install a jsdom document onto globalThis.
 *
 * @returns {Promise<void>}
 */
const setupDom = async () =>
{
	const { JSDOM } = await import('jsdom');
	const dom = new JSDOM('<!doctype html><html><body></body></html>',
	{
		url: 'http://localhost/',
		pretendToBeVisual: true
	});

	const { window } = dom;

	/* jsdom has no layout engine, so scrolling logs a "not implemented"
	 * error through its virtual console on every router navigation. */
	window.scrollTo = () => {};
	window.Element.prototype.scrollIntoView = () => {};

	const globals =
	{
		window,
		document: window.document,
		navigator: window.navigator,
		location: window.location,
		history: window.history,
		getComputedStyle: window.getComputedStyle.bind(window),
		requestAnimationFrame: window.requestAnimationFrame.bind(window),
		cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
		Event: window.Event,
		CustomEvent: window.CustomEvent,
		Node: window.Node,
		Element: window.Element,
		HTMLElement: window.HTMLElement
	};

	for (const [key, value] of Object.entries(globals))
	{
		Object.defineProperty(globalThis, key,
		{
			value,
			configurable: true,
			writable: true
		});
	}
};

/**
 * This will compute a percentile from a sorted sample array.
 *
 * @param {Array<number>} sorted
 * @param {number} percentile 0-100
 * @returns {number}
 */
const percentileOf = (sorted, percentile) =>
{
	if (sorted.length === 0)
	{
		return 0;
	}

	const rank = (percentile / 100) * (sorted.length - 1);
	const low = Math.floor(rank);
	const high = Math.ceil(rank);
	if (low === high)
	{
		return sorted[low];
	}

	return sorted[low] + ((sorted[high] - sorted[low]) * (rank - low));
};

/**
 * This will round a millisecond value to a stable precision.
 *
 * @param {number} value
 * @returns {number}
 */
const ms = (value) => Math.round(value * 1000) / 1000;

/**
 * This will summarize a set of duration samples.
 *
 * @param {Array<number>} samples
 * @returns {object}
 */
const summarize = (samples) =>
{
	const sorted = [...samples].sort((a, b) => a - b);
	const total = sorted.reduce((sum, value) => sum + value, 0);

	return {
		samples: sorted.length,
		minMs: ms(sorted[0]),
		medianMs: ms(percentileOf(sorted, 50)),
		p95Ms: ms(percentileOf(sorted, 95)),
		maxMs: ms(sorted[sorted.length - 1]),
		meanMs: ms(total / sorted.length)
	};
};

/**
 * Collected results, written to the baseline at the end.
 *
 * @type {object}
 */
const results = {};

/**
 * This will record and print a result.
 *
 * @param {string} name
 * @param {object} value
 * @returns {void}
 */
const record = (name, value) =>
{
	results[name] = value;

	if (typeof value.medianMs === 'number')
	{
		console.log(`  ${name.padEnd(34)} median ${String(value.medianMs).padStart(9)} ms   p95 ${String(value.p95Ms).padStart(9)} ms   n=${value.samples}`);
		return;
	}

	console.log(`  ${name.padEnd(34)} ${JSON.stringify(value)}`);
};

/**
 * This will run a benchmark, discarding warmup runs.
 *
 * @param {string} name
 * @param {object} options
 * @param {function} options.run Called per iteration; may be async.
 * @param {number} [options.warmup]
 * @param {number} [options.iterations]
 * @param {function} [options.before] Called before each timed section.
 * @param {function} [options.after] Called after each timed section.
 * @returns {Promise<object>}
 */
const bench = async (name, options) =>
{
	const warmup = options.warmup ?? 3;
	const iterations = options.iterations ?? (QUICK ? 5 : 15);

	for (let i = 0; i < warmup; i++)
	{
		if (options.before)
		{
			await options.before();
		}
		await options.run();
		if (options.after)
		{
			await options.after();
		}
	}

	const samples = [];
	for (let i = 0; i < iterations; i++)
	{
		if (options.before)
		{
			await options.before();
		}

		const start = performance.now();
		await options.run();
		samples.push(performance.now() - start);

		if (options.after)
		{
			await options.after();
		}
	}

	const summary = summarize(samples);
	record(name, summary);
	return summary;
};

/**
 * This will build a list of row objects.
 *
 * @param {number} count
 * @param {number} generation
 * @returns {Array<object>}
 */
const createRows = (count, generation) =>
{
	const rows = new Array(count);
	for (let i = 0; i < count; i++)
	{
		rows[i] = { id: i, label: `row-${generation}-${i}` };
	}
	return rows;
};

/**
 * This will count every live subscriber callback on a data source.
 *
 * @param {object} data
 * @returns {number}
 */
const countSubscribers = (data) =>
{
	let count = 0;
	for (const subscribers of data.eventSub.callBacks.values())
	{
		count += subscribers.size;
	}
	return count;
};

/**
 * This will force a garbage collection when the process was started with
 * --expose-gc.
 *
 * @returns {Promise<boolean>}
 */
const collectGarbage = async () =>
{
	// @ts-ignore
	const gc = globalThis.gc;
	if (typeof gc !== 'function')
	{
		return false;
	}

	gc();
	await flush();
	gc();
	return true;
};

/* ------------------------------------------------------------------ */

if (ENV === 'jsdom')
{
	await setupDom();
}

const { Data } = await import('../src/modules/data/data.js');
const { DataPubSub } = await import('../src/modules/data-binder/data-pub-sub.js');
const { DataUtils } = await import('../src/modules/data/types/deep-data/data-utils.js');

console.log('');
console.log(`Base runtime benchmarks  (env=${ENV}${QUICK ? ', quick' : ''}, node ${process.version})`);

/* ------------------------------------------------------------------ *
 * Deep data
 * ------------------------------------------------------------------ */

console.log('');
console.log('deep data');

const DEEP_OPS = QUICK ? 2000 : 10000;

/**
 * Hot cache: the same small set of paths is reused, so every
 * `DataUtils.getSegments` call is a cache hit.
 */
const hotPaths = [];
for (let i = 0; i < 50; i++)
{
	hotPaths.push(`user.profile.contacts[${i}].value`);
}

await bench('deepData.set.hotCache', {
	before: () =>
	{
		for (const hotPath of hotPaths)
		{
			DataUtils.getSegments(hotPath);
		}
	},
	run: () =>
	{
		const data = new Data({});
		for (let i = 0; i < DEEP_OPS; i++)
		{
			data.set(hotPaths[i % hotPaths.length], i);
		}
	}
});

await bench('deepData.set.coldCache', {
	before: () =>
	{
		DataUtils.segmentCache.clear();
	},
	run: () =>
	{
		const data = new Data({});
		for (let i = 0; i < DEEP_OPS; i++)
		{
			data.set(`cold${i}.profile.contacts[${i % 10}].value`, i);
		}
		DataUtils.segmentCache.clear();
	}
});

/**
 * Reads are measured against a pre-populated tree so the cost is the path
 * walk, not the allocation of the intermediate objects.
 */
const readData = new Data({});
for (const hotPath of hotPaths)
{
	readData.set(hotPath, 1);
}

await bench('deepData.get.hotCache', {
	before: () =>
	{
		for (const hotPath of hotPaths)
		{
			DataUtils.getSegments(hotPath);
		}
	},
	run: () =>
	{
		for (let i = 0; i < DEEP_OPS; i++)
		{
			readData.get(hotPaths[i % hotPaths.length]);
		}
	}
});

await bench('deepData.get.coldCache', {
	before: () =>
	{
		DataUtils.segmentCache.clear();
	},
	run: () =>
	{
		for (let i = 0; i < DEEP_OPS; i++)
		{
			readData.get(hotPaths[i % hotPaths.length]);
			DataUtils.segmentCache.clear();
		}
	}
});

/* ------------------------------------------------------------------ *
 * Publish fan-out
 * ------------------------------------------------------------------ */

console.log('');
console.log('publish fan-out');

const FAN_OUT = QUICK ? 200 : 1000;

/**
 * @type {DataPubSub|null}
 */
let fanOutPubSub = null;

await bench('publish.fanOut.sameProp', {
	before: () =>
	{
		fanOutPubSub = new DataPubSub();
		for (let i = 0; i < FAN_OUT; i++)
		{
			fanOutPubSub.on('value', () => {});
		}
	},
	run: async () =>
	{
		fanOutPubSub.publish('value', Math.random());
		await flush();
	}
});

/**
 * @type {object|null}
 */
let nestedData = null;

/**
 * @type {number}
 */
let nestedGeneration = 0;

await bench('publish.fanOut.nestedPaths', {
	before: () =>
	{
		nestedData = new Data({ root: {} });
		for (let i = 0; i < FAN_OUT; i++)
		{
			nestedData.set(`root.key${i}`, 0);
			nestedData.on(`root.key${i}`, () => {});
		}
	},
	run: async () =>
	{
		const next = {};
		for (let i = 0; i < FAN_OUT; i++)
		{
			next[`key${i}`] = ++nestedGeneration;
		}

		nestedData.set('root', next);
		await flush();
	},
	warmup: 2,
	iterations: QUICK ? 3 : 8
});

/* ------------------------------------------------------------------ *
 * DOM suites
 * ------------------------------------------------------------------ */

if (ENV === 'jsdom')
{
	const { Component } = await import('../src/modules/component/component.js');
	const { Builder } = await import('../src/modules/layout/builder.js');
	await import('../src/modules/layout/directives/core/default-directives.js');

	/**
	 * A 1,000 row list rendered through the `for` directive with scoped row
	 * data left on (the default), which is the configuration that allocates
	 * a Data instance and two link subscriptions per row.
	 */
	class BigList extends Component
	{
		/**
		 * @returns {object}
		 */
		setData()
		{
			// @ts-ignore
			return new Data({ items: this.rows });
		}

		/**
		 * @returns {object}
		 */
		render()
		{
			return {
				tag: 'div',
				children: [
					{
						tag: 'ul',
						cache: 'list',
						for: ['items', (row) => ({ tag: 'li', text: row.label })]
					}
				]
			};
		}
	}

	const container = document.createElement('div');
	document.body.appendChild(container);

	const ROW_COUNT = QUICK ? 200 : 1000;
	const UPDATE_COUNT = QUICK ? 10 : 50;

	console.log('');
	console.log(`large list (${ROW_COUNT} rows)`);

	let mounted = null;

	await bench(`list.build.${ROW_COUNT}Rows`, {
		before: () =>
		{
			mounted = new BigList({ rows: createRows(ROW_COUNT, 0) });
		},
		run: () =>
		{
			Builder.render(mounted, container);
		},
		after: () =>
		{
			mounted.destroy();
			mounted = null;
		},
		warmup: 2,
		iterations: QUICK ? 3 : 5
	});

	/**
	 * The update pass is deliberately a single run of UPDATE_COUNT successive
	 * updates rather than repeated runs: the subscriber leak compounds across
	 * updates, so restarting would hide it. Each update is its own sample.
	 */
	console.log('');
	console.log(`large list updates (${UPDATE_COUNT} successive sets)`);

	let list = new BigList({ rows: createRows(ROW_COUNT, 0) });
	Builder.render(list, container);
	await flush();

	let listData = list.data;
	const subscribersAtMount = countSubscribers(listData);
	const growthSamples = [];
	const updateSamples = [];
	let previous = subscribersAtMount;

	for (let generation = 1; generation <= UPDATE_COUNT; generation++)
	{
		const rows = createRows(ROW_COUNT, generation);

		const start = performance.now();
		listData.set('items', rows);
		await flush();
		updateSamples.push(performance.now() - start);

		const current = countSubscribers(listData);
		growthSamples.push(current - previous);
		previous = current;
	}

	const subscribersAfter = countSubscribers(listData);
	record(`list.update.${ROW_COUNT}Rows`, summarize(updateSamples));

	const totalGrowth = subscribersAfter - subscribersAtMount;
	record('list.subscriberLeak', {
		rows: ROW_COUNT,
		updates: UPDATE_COUNT,
		subscribersAtMount,
		subscribersAfterUpdates: subscribersAfter,
		totalGrowth,
		growthPerUpdate: Math.round((totalGrowth / UPDATE_COUNT) * 100) / 100,
		growthPerUpdatePerRow: Math.round((totalGrowth / UPDATE_COUNT / ROW_COUNT) * 100) / 100,
		firstUpdateGrowth: growthSamples[0],
		lastUpdateGrowth: growthSamples[growthSamples.length - 1],
		unbounded: totalGrowth > 0,
		note: 'Steady-state re-rendering should return to subscribersAtMount. Any positive totalGrowth is the for-directive scope leak.'
	});

	list.destroy();
	container.innerHTML = '';

	/* Drop the references so the leaked scoped instances from the update
	 * pass above are collectable before the memory suite samples the heap. */
	list = null;
	listData = null;

	/* -------------------------------------------------------------- *
	 * Router
	 * -------------------------------------------------------------- */

	console.log('');
	console.log('router (200 routes)');

	const { router } = await import('../src/modules/router/router.js');

	const ROUTE_COUNT = 200;

	/**
	 * Navigation cursor for the cache-miss benchmark. The stride is coprime
	 * with the route count so every iteration lands on a different route.
	 *
	 * @type {number}
	 */
	let routerStep = 0;

	router.setup('/', 'Bench');
	for (let i = 0; i < ROUTE_COUNT; i++)
	{
		router.add({ uri: `/r${i}/`, callBack: () => {} });
	}

	await bench(`router.navigate.cacheMiss.${ROUTE_COUNT}Routes`, {
		run: () =>
		{
			/* Every navigation lands on a different route, so
			 * `lastMatchedRoute` never matches and the full table is
			 * scanned. */
			routerStep = (routerStep + 37) % ROUTE_COUNT;
			router.navigate(`/r${routerStep}/`);
		},
		warmup: 5,
		iterations: QUICK ? 20 : 100
	});

	await bench(`router.navigate.cacheHit.${ROUTE_COUNT}Routes`, {
		before: () =>
		{
			router.navigate('/r5/');
		},
		run: () =>
		{
			/* Re-navigating to the already-selected route takes the
			 * `lastMatchedRoute` fast path. */
			router.navigate('/r5/');
		},
		warmup: 5,
		iterations: QUICK ? 20 : 100
	});

	router.reset();

	/* -------------------------------------------------------------- *
	 * Memory
	 * -------------------------------------------------------------- */

	console.log('');
	console.log('memory');

	const gcAvailable = await collectGarbage();
	const CYCLES = QUICK ? 5 : 20;

	const before = process.memoryUsage().heapUsed;

	for (let i = 0; i < CYCLES; i++)
	{
		const cycleList = new BigList({ rows: createRows(ROW_COUNT, i) });
		Builder.render(cycleList, container);
		await flush();
		cycleList.destroy();
		container.innerHTML = '';
	}

	await flush();
	await collectGarbage();
	const after = process.memoryUsage().heapUsed;

	record('memory.listMountUnmount', {
		gcForced: gcAvailable,
		cycles: CYCLES,
		rowsPerCycle: ROW_COUNT,
		heapUsedBeforeBytes: before,
		heapUsedAfterBytes: after,
		heapDeltaBytes: after - before,
		heapDeltaPerCycleBytes: Math.round((after - before) / CYCLES),
		note: gcAvailable
			? 'Measured around a forced GC. A retained delta indicates mount/unmount does not release.'
			: 'Run with --expose-gc for a GC-stable number.'
	});
}

/* ------------------------------------------------------------------ */

const baseline =
{
	generatedAt: new Date().toISOString(),
	environment:
	{
		env: ENV,
		quick: QUICK,
		node: process.version,
		platform: process.platform,
		arch: process.arch,
		gcExposed: typeof globalThis.gc === 'function'
	},
	results
};

writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, '\t')}\n`);

console.log('');
console.log(`Wrote ${path.relative(process.cwd(), BASELINE_PATH)}`);
console.log('');

process.exit(0);
