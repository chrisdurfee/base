/**
 * Throwaway: interleaved A/B of only the code that changed on the cold
 * set path — the segment cache miss (regex vs scanner, non-promoting vs
 * promoting LRU) and the event message cache miss (plain Map vs bounded
 * LRU with eviction).
 */
import { performance } from 'node:perf_hooks';

const DANGEROUS = new Set(['__proto__', 'prototype', 'constructor']);
const OLD_PATTERN = /(\w+)|(?:\[(\d)\))/g;

class OldCache
{
	constructor(maxSize = 1000)
	{
		this.cache = new Map();
		this.maxSize = maxSize;
	}

	get(key)
	{
		return this.cache.get(key);
	}

	set(key, value)
	{
		this.cache.delete(key);
		this.cache.set(key, value);
		if (this.cache.size > this.maxSize)
		{
			this.cache.delete(this.cache.keys().next().value);
		}
	}

	clear()
	{
		this.cache.clear();
	}
}

class NewCache
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

const scan = (str) =>
{
	const segments = [];
	const length = str.length;
	let start = 0;
	for (let i = 0; i < length; i++)
	{
		const c = str[i];
		if (c !== '.' && c !== '[' && c !== ']')
		{
			continue;
		}
		if (i > start)
		{
			segments.push(str.substring(start, i));
		}
		start = i + 1;
	}
	if (length > start)
	{
		segments.push(str.substring(start));
	}
	return (segments.length > 0) ? segments : null;
};

const guard = (segments, str) =>
{
	if (segments)
	{
		for (let i = 0, len = segments.length; i < len; i++)
		{
			if (DANGEROUS.has(segments[i]))
			{
				segments = null;
				break;
			}
		}
	}
	return segments;
};

const oldUtils =
{
	segmentCache: new OldCache(1000),
	getSegments(str)
	{
		let segments = this.segmentCache.get(str);
		if (segments !== undefined)
		{
			return segments;
		}
		segments = guard(str.match(OLD_PATTERN), str);
		this.segmentCache.set(str, segments);
		return segments;
	}
};

const newUtils =
{
	segmentCache: new NewCache(1000),
	getSegments(str)
	{
		let segments = this.segmentCache.get(str);
		if (segments !== undefined)
		{
			return segments;
		}
		segments = guard(scan(str), str);
		this.segmentCache.set(str, segments);
		return segments;
	}
};

const oldMsgCache = new Map();
const newMsgCache = new NewCache(2000);

const oldMessage = (attr) =>
{
	let entry = oldMsgCache.get(attr);
	if (!entry)
	{
		entry = { change: `${attr}:change`, delete: `${attr}:delete` };
		oldMsgCache.set(attr, entry);
	}
	return entry.change;
};

const newMessage = (attr) =>
{
	let entry = newMsgCache.get(attr);
	if (!entry)
	{
		entry = { change: `${attr}:change`, delete: `${attr}:delete` };
		newMsgCache.set(attr, entry);
	}
	return entry.change;
};

/**
 * The cold set bench issues three getSegments calls per set: one miss
 * from the initial read and two hits from the stage/attributes writes.
 */
const N = 10000;
const paths = [];
for (let i = 0; i < N; i++)
{
	paths.push(`cold${i}.profile.contacts[${i % 10}].value`);
}

let sink = 0;

const runSegments = (utils) =>
{
	utils.segmentCache.clear();
	const t = performance.now();
	for (let i = 0; i < N; i++)
	{
		const p = paths[i];
		sink += utils.getSegments(p).length;
		sink += utils.getSegments(p).length;
		sink += utils.getSegments(p).length;
	}
	const d = performance.now() - t;
	utils.segmentCache.clear();
	return d;
};

const runMessages = (fn, cache) =>
{
	cache.clear();
	const t = performance.now();
	for (let i = 0; i < N; i++)
	{
		sink += fn(paths[i]).length;
	}
	const d = performance.now() - t;
	cache.clear();
	return d;
};

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

const ROUNDS = 25;

const report = (label, aName, bName, a, b) =>
{
	const am = median(a);
	const bm = median(b);
	const paired = a.map((x, i) => b[i] - x);
	const bWins = paired.filter((d) => d < 0).length;
	console.log('');
	console.log(`${label}  (${N} cold keys, ${ROUNDS} interleaved rounds)`);
	console.log(`  ${aName.padEnd(22)} median ${am.toFixed(3)} ms   p95 ${p95(a).toFixed(3)}`);
	console.log(`  ${bName.padEnd(22)} median ${bm.toFixed(3)} ms   p95 ${p95(b).toFixed(3)}`);
	console.log(`  delta ${(((bm - am) / am) * 100).toFixed(1)}%   paired median ${median(paired).toFixed(3)} ms   ${bName} faster in ${bWins}/${ROUNDS} rounds`);
};

for (let i = 0; i < 4; i++)
{
	runSegments(oldUtils);
	runSegments(newUtils);
	runMessages(oldMessage, oldMsgCache);
	runMessages(newMessage, newMsgCache);
}

const segOld = [];
const segNew = [];
const msgOld = [];
const msgNew = [];

for (let r = 0; r < ROUNDS; r++)
{
	if (r % 2 === 0)
	{
		segOld.push(runSegments(oldUtils));
		segNew.push(runSegments(newUtils));
		msgOld.push(runMessages(oldMessage, oldMsgCache));
		msgNew.push(runMessages(newMessage, newMsgCache));
	}
	else
	{
		segNew.push(runSegments(newUtils));
		segOld.push(runSegments(oldUtils));
		msgNew.push(runMessages(newMessage, newMsgCache));
		msgOld.push(runMessages(oldMessage, oldMsgCache));
	}
}

console.log(`cold path micro, node ${process.version}`);
report('getSegments: 1 miss + 2 hits per key', 'phase0 regex + FIFO', 'phase2 scan + LRU', segOld, segNew);
report('createEventMessage: 1 miss per key', 'phase0 unbounded Map', 'phase2 LRUCache(2000)', msgOld, msgNew);

/* deterministic map operation counts */
const counts = { get: 0, set: 0, has: 0, delete: 0, keys: 0 };
const proto = Map.prototype;
const orig = { get: proto.get, set: proto.set, has: proto.has, delete: proto.delete, keys: proto.keys };

const instrument = () =>
{
	for (const k of Object.keys(counts))
	{
		counts[k] = 0;
	}

	proto.get = function (k) { counts.get++; return orig.get.call(this, k); };
	proto.set = function (k, v) { counts.set++; return orig.set.call(this, k, v); };
	proto.has = function (k) { counts.has++; return orig.has.call(this, k); };
	proto.delete = function (k) { counts.delete++; return orig.delete.call(this, k); };
	proto.keys = function () { counts.keys++; return orig.keys.call(this); };
};

const restore = () =>
{
	Object.assign(proto, orig);
	return { ...counts };
};

const countFor = (fn) =>
{
	instrument();
	fn();
	return restore();
};

const total = (c) => c.get + c.set + c.has + c.delete + c.keys;

console.log('');
console.log(`deterministic Map operations for ${N} cold keys`);

const segOldCount = countFor(() => runSegments(oldUtils));
const segNewCount = countFor(() => runSegments(newUtils));
const msgOldCount = countFor(() => runMessages(oldMessage, oldMsgCache));
const msgNewCount = countFor(() => runMessages(newMessage, newMsgCache));

const line = (label, c) => console.log(`  ${label.padEnd(34)} get ${String(c.get).padStart(6)}  has ${String(c.has).padStart(6)}  set ${String(c.set).padStart(6)}  delete ${String(c.delete).padStart(6)}  keys ${String(c.keys).padStart(6)}  total ${total(c)}`);

line('segments phase0 (regex + FIFO)', segOldCount);
line('segments phase2 (scan + LRU)', segNewCount);
line('messages phase0 (Map)', msgOldCount);
line('messages phase2 (LRUCache 2000)', msgNewCount);

console.log('');
console.log('sink', sink);
