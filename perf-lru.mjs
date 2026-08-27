/**
 * Throwaway: interleaved A/B of LRUCache designs on the workloads the
 * four real caches see.
 */
import { performance } from 'node:perf_hooks';

class V1
{
	constructor(maxSize = 1000)
	{
		this.cache = new Map();
		this.maxSize = maxSize;
		this.lastKey = undefined;
	}

	get(key)
	{
		const cache = this.cache;
		const value = cache.get(key);
		if (value === undefined && !cache.has(key))
		{
			return undefined;
		}
		if (cache.size >= this.maxSize && key !== this.lastKey)
		{
			cache.delete(key);
			cache.set(key, value);
			this.lastKey = key;
		}
		return value;
	}

	set(key, value)
	{
		const cache = this.cache;
		cache.delete(key);
		cache.set(key, value);
		this.lastKey = key;
		if (cache.size > this.maxSize)
		{
			cache.delete(cache.keys().next().value);
		}
	}

	clear()
	{
		this.cache.clear();
		this.lastKey = undefined;
	}
}

class V2 extends V1
{
	get(key)
	{
		const cache = this.cache;
		const value = cache.get(key);
		if (value === undefined)
		{
			return undefined;
		}
		if (cache.size >= this.maxSize && key !== this.lastKey)
		{
			cache.delete(key);
			cache.set(key, value);
			this.lastKey = key;
		}
		return value;
	}
}

class V3 extends V2
{
	set(key, value)
	{
		const cache = this.cache;
		const maxSize = this.maxSize;
		if (cache.size >= maxSize)
		{
			cache.delete(key);
		}
		cache.set(key, value);
		this.lastKey = key;
		if (cache.size > maxSize)
		{
			cache.delete(cache.keys().next().value);
		}
	}
}

class V4 extends V2
{
	constructor(maxSize = 1000)
	{
		super(maxSize);
		this.batch = (maxSize > 8) ? (maxSize >> 3) : 1;
	}

	set(key, value)
	{
		const cache = this.cache;
		const maxSize = this.maxSize;
		if (cache.size >= maxSize)
		{
			cache.delete(key);
		}
		cache.set(key, value);
		this.lastKey = key;
		if (cache.size > maxSize)
		{
			const keys = cache.keys();
			for (let i = 0, len = this.batch; i < len; i++)
			{
				cache.delete(keys.next().value);
			}
		}
	}
}

/* second chance (CLOCK): reads mark a flag instead of mutating the map */
class V5
{
	constructor(maxSize = 1000)
	{
		this.cache = new Map();
		this.maxSize = maxSize;
		this.batch = (maxSize >= 8) ? (maxSize >> 3) : 1;
	}

	get(key)
	{
		const entry = this.cache.get(key);
		if (entry === undefined)
		{
			return undefined;
		}
		entry.used = true;
		return entry.value;
	}

	set(key, value)
	{
		const cache = this.cache;
		const entry = cache.get(key);
		if (entry !== undefined)
		{
			entry.value = value;
			entry.used = true;
			return;
		}

		cache.set(key, { value, used: false });

		const maxSize = this.maxSize;
		if (cache.size <= maxSize)
		{
			return;
		}

		const target = maxSize - this.batch + 1;
		const keys = cache.keys();
		let examined = 0;
		const limit = cache.size;
		while (cache.size > target && examined < limit)
		{
			examined++;
			const k = keys.next().value;
			const e = cache.get(k);
			if (e !== undefined && e.used)
			{
				e.used = false;
				continue;
			}
			cache.delete(k);
		}
	}

	clear()
	{
		this.cache.clear();
	}
}

class V0
{
	constructor()
	{
		this.cache = new Map();
	}

	get(key)
	{
		return this.cache.get(key);
	}

	set(key, value)
	{
		this.cache.set(key, value);
	}

	clear()
	{
		this.cache.clear();
	}
}

const IMPLS = [['V0 plain Map', V0], ['V1 current', V1], ['V2 no has', V2], ['V3 +lazy del', V3], ['V4 +batch evict', V4], ['V5 clock', V5]];

const N = 10000;
const keys = [];
for (let i = 0; i < N; i++)
{
	keys.push(`cold${i}.profile.contacts[${i % 10}].value`);
}
const hotKeys = keys.slice(0, 50);

let sink = 0;

/* miss-only churn, 5x over capacity (event message cache shape) */
const churn = (Impl) =>
{
	const cache = new Impl(2000);
	const t = performance.now();
	for (let i = 0; i < N; i++)
	{
		const k = keys[i];
		let entry = cache.get(k);
		if (!entry)
		{
			entry = { change: `${k}:change`, delete: `${k}:delete` };
			cache.set(k, entry);
		}
		sink += entry.change.length;
	}
	return performance.now() - t;
};

/* 1 miss + 2 hits per key, 10x over capacity (segment cache shape) */
const segments = (Impl) =>
{
	const cache = new Impl(1000);
	const t = performance.now();
	for (let i = 0; i < N; i++)
	{
		const k = keys[i];
		for (let j = 0; j < 3; j++)
		{
			let v = cache.get(k);
			if (v === undefined)
			{
				v = k.split('.');
				cache.set(k, v);
			}
			sink += v.length;
		}
	}
	return performance.now() - t;
};

/* hot hits well under capacity */
const hotUnder = (Impl) =>
{
	const cache = new Impl(1000);
	for (const k of hotKeys)
	{
		cache.set(k, k.split('.'));
	}
	const t = performance.now();
	for (let i = 0; i < N * 5; i++)
	{
		sink += cache.get(hotKeys[i % 50]).length;
	}
	return performance.now() - t;
};

/* hot hits with the cache already full, so promotion is live */
const hotFull = (Impl) =>
{
	const cache = new Impl(2000);
	for (let i = 0; i < 2000; i++)
	{
		cache.set(keys[i], keys[i].split('.'));
	}
	const t = performance.now();
	for (let i = 0; i < N * 5; i++)
	{
		sink += cache.get(keys[i % 50]).length;
	}
	return performance.now() - t;
};

const WORKLOADS = [['churn (miss only, 2000 cap)', churn], ['segments (1 miss 2 hits, 1000 cap)', segments], ['hot under capacity', hotUnder], ['hot at capacity', hotFull]];

const median = (arr) =>
{
	const s = [...arr].sort((a, b) => a - b);
	const mid = s.length >> 1;
	return (s.length % 2) ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

const ROUNDS = 21;

console.log(`lru designs, node ${process.version}, ${ROUNDS} interleaved rounds`);

for (const [wLabel, work] of WORKLOADS)
{
	const samples = new Map(IMPLS.map(([label]) => [label, []]));

	for (let i = 0; i < 3; i++)
	{
		for (const [, Impl] of IMPLS)
		{
			work(Impl);
		}
	}

	for (let r = 0; r < ROUNDS; r++)
	{
		const order = (r % 2) ? [...IMPLS].reverse() : IMPLS;
		for (const [label, Impl] of order)
		{
			samples.get(label).push(work(Impl));
		}
	}

	console.log('');
	console.log(wLabel);
	const current = median(samples.get('V1 current'));
	for (const [label] of IMPLS)
	{
		const s = samples.get(label);
		const m = median(s);
		const v1 = samples.get('V1 current');
		let wins = 0;
		for (let r = 0; r < ROUNDS; r++)
		{
			if (s[r] < v1[r])
			{
				wins++;
			}
		}
		console.log(
			'  ' + label.padEnd(18) +
			m.toFixed(3).padStart(8) + ' ms' +
			(((m - current) / current) * 100).toFixed(1).padStart(9) + '% vs V1' +
			`   beats V1 in ${wins}/${ROUNDS}`
		);
	}
}

console.log('');
console.log('sink', sink);

