/**
 * Throwaway: interleaved A/B of full deep-data scenarios across several
 * source-tree variants loaded into one process, plus deterministic Map
 * operation counts per scenario.
 *
 * Variants live in C:/xampp/htdocs/base-perf-scratch.
 */
import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';

const ROOT = 'C:/xampp/htdocs/base-perf-scratch';

const setupDom = async () =>
{
	const { JSDOM } = await import('jsdom');
	const dom = new JSDOM('<!doctype html><html><body></body></html>',
	{
		url: 'http://localhost/',
		pretendToBeVisual: true
	});

	const { window } = dom;
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
		Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
	}
};

await setupDom();

const NAMES = process.env.VARIANTS
	? process.env.VARIANTS.split(',')
	: ['phase0', 'current', 'regex', 'evt', 'both'];

const DIRS =
{
	phase0: 'v_phase0',
	current: 'v_current',
	regex: 'v_regex',
	evt: 'v_evt',
	both: 'v_both'
};

const variants = [];
for (const name of NAMES)
{
	const dir = `${ROOT}/${DIRS[name]}/src`;
	const { Data } = await import(pathToFileURL(`${dir}/modules/data/data.js`).href);
	const { DataUtils } = await import(pathToFileURL(`${dir}/modules/data/types/deep-data/data-utils.js`).href);
	variants.push({ name, Data, DataUtils });
}

const DEEP_OPS = Number(process.env.DEEP_OPS || 10000);
const ROUNDS = Number(process.env.ROUNDS || 15);
const WARMUP = 3;

const hotPaths = [];
for (let i = 0; i < 50; i++)
{
	hotPaths.push(`user.profile.contacts[${i}].value`);
}

const median = (arr) =>
{
	const s = [...arr].sort((a, b) => a - b);
	const mid = s.length >> 1;
	return (s.length % 2) ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

const p95 = (arr) =>
{
	const s = [...arr].sort((a, b) => a - b);
	return s[Math.min(s.length - 1, Math.ceil(0.95 * s.length) - 1)];
};

/**
 * Scenario bodies mirror scripts/bench.js exactly.
 */
const SCENARIOS =
{
	'set.coldCache':
	{
		before: (v) => v.DataUtils.segmentCache.clear(),
		run: (v) =>
		{
			const data = new v.Data({});
			for (let i = 0; i < DEEP_OPS; i++)
			{
				data.set(`cold${i}.profile.contacts[${i % 10}].value`, i);
			}
			v.DataUtils.segmentCache.clear();
		}
	},
	'set.hotCache':
	{
		before: (v) =>
		{
			for (const hotPath of hotPaths)
			{
				v.DataUtils.getSegments(hotPath);
			}
		},
		run: (v) =>
		{
			const data = new v.Data({});
			for (let i = 0; i < DEEP_OPS; i++)
			{
				data.set(hotPaths[i % hotPaths.length], i);
			}
		}
	},
	'get.hotCache':
	{
		before: (v) =>
		{
			for (const hotPath of hotPaths)
			{
				v.DataUtils.getSegments(hotPath);
			}
		},
		run: (v) =>
		{
			for (let i = 0; i < DEEP_OPS; i++)
			{
				v.readData.get(hotPaths[i % hotPaths.length]);
			}
		}
	},
	'get.coldCache':
	{
		before: (v) => v.DataUtils.segmentCache.clear(),
		run: (v) =>
		{
			for (let i = 0; i < DEEP_OPS; i++)
			{
				v.readData.get(hotPaths[i % hotPaths.length]);
				v.DataUtils.segmentCache.clear();
			}
		}
	}
};

for (const v of variants)
{
	v.readData = new v.Data({});
	for (const hotPath of hotPaths)
	{
		v.readData.set(hotPath, 1);
	}
}

const only = process.env.SCENARIOS ? process.env.SCENARIOS.split(',') : Object.keys(SCENARIOS);

console.log(`scenario A/B: DEEP_OPS=${DEEP_OPS}, ${ROUNDS} interleaved rounds, variants=${NAMES.join('/')}, node ${process.version}`);

for (const key of only)
{
	const scenario = SCENARIOS[key];
	const samples = {};
	for (const v of variants)
	{
		samples[v.name] = [];
	}

	for (let i = 0; i < WARMUP; i++)
	{
		for (const v of variants)
		{
			scenario.before(v);
			scenario.run(v);
		}
	}

	for (let r = 0; r < ROUNDS; r++)
	{
		/* order is reversed on odd rounds so drift cannot favour a
		 * fixed position in the sequence */
		const order = (r % 2) ? [...variants].reverse() : variants;
		for (const v of order)
		{
			scenario.before(v);
			if (globalThis.gc)
			{
				globalThis.gc();
			}
			const t = performance.now();
			scenario.run(v);
			samples[v.name].push(performance.now() - t);
		}
	}

	console.log('');
	console.log(`${key}`);
	console.log('  variant    median      p95      vs phase0    rounds slower than phase0');
	const basis = samples.phase0;
	for (const v of variants)
	{
		const s = samples[v.name];
		const m = median(s);
		let vs = '';
		let worse = '';
		if (basis && v.name !== 'phase0')
		{
			const bm = median(basis);
			vs = (((m - bm) / bm) * 100).toFixed(1) + '%';
			let count = 0;
			for (let r = 0; r < ROUNDS; r++)
			{
				if (s[r] > basis[r])
				{
					count++;
				}
			}
			worse = `${count}/${ROUNDS}`;
		}
		console.log(
			'  ' + v.name.padEnd(11) +
			m.toFixed(3).padStart(7) +
			p95(s).toFixed(3).padStart(10) +
			vs.padStart(12) +
			worse.padStart(15)
		);
	}
}
