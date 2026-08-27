/**
 * Throwaway: interleaved A/B of the phase 0 regex segment parse against
 * the phase 2 scanner, per path shape, inside one process.
 */
import { performance } from 'node:perf_hooks';

const OLD_PATTERN = /(\w+)|(?:\[(\d)\))/g;

const oldParse = (str) => str.match(OLD_PATTERN);

const newParse = (str) =>
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

const SHAPES = [
	['a', 'a'],
	['a.b', 'a.b'],
	['a.b.c', 'a.b.c'],
	['phones[0]', 'phones[0]'],
	['a.b[2].c', 'a.b[2].c'],
	['deep 7 seg', 'a.b.c.d.e.f.g'],
	['bench hot', 'user.profile.contacts[12].value'],
	['bench cold', 'cold4321.profile.contacts[4].value']
];

const K = 50000;
const ROUNDS = 21;
const WARMUP = 5;

let sink = 0;

const time = (fn, str) =>
{
	const t = performance.now();
	for (let i = 0; i < K; i++)
	{
		const r = fn(str);
		sink += r.length;
	}
	return performance.now() - t;
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

console.log(`parse micro: K=${K} calls/sample, ${ROUNDS} interleaved rounds/shape, node ${process.version}`);
console.log('');
console.log('shape          equal?   regex med   scan med    delta%   scan wins   paired med delta (ms/50k)');

for (const [label, str] of SHAPES)
{
	const a = oldParse(str);
	const b = newParse(str);
	const equal = JSON.stringify(a) === JSON.stringify(b);

	for (let i = 0; i < WARMUP; i++)
	{
		time(oldParse, str);
		time(newParse, str);
	}

	const old = [];
	const nw = [];
	const paired = [];

	for (let r = 0; r < ROUNDS; r++)
	{
		let o, n;
		if (r % 2 === 0)
		{
			o = time(oldParse, str);
			n = time(newParse, str);
		}
		else
		{
			n = time(newParse, str);
			o = time(oldParse, str);
		}
		old.push(o);
		nw.push(n);
		paired.push(n - o);
	}

	const om = median(old);
	const nm = median(nw);
	const wins = paired.filter((d) => d < 0).length;

	console.log(
		label.padEnd(14) +
		String(equal).padEnd(9) +
		om.toFixed(3).padStart(9) +
		nm.toFixed(3).padStart(12) +
		(((nm - om) / om) * 100).toFixed(1).padStart(10) + '%' +
		`${wins}/${ROUNDS}`.padStart(12) +
		median(paired).toFixed(3).padStart(12) +
		`  (p95 old ${p95(old).toFixed(2)}, new ${p95(nw).toFixed(2)})`
	);
}

/* deterministic counts for the scanner */
console.log('');
console.log('deterministic scanner work per call (chars visited / substrings allocated / segments):');

for (const [label, str] of SHAPES)
{
	let chars = 0;
	let subs = 0;
	const length = str.length;
	let start = 0;
	for (let i = 0; i < length; i++)
	{
		chars++;
		const c = str[i];
		if (c !== '.' && c !== '[' && c !== ']')
		{
			continue;
		}
		if (i > start)
		{
			subs++;
		}
		start = i + 1;
	}
	if (length > start)
	{
		subs++;
	}
	console.log(`  ${label.padEnd(14)} chars ${String(chars).padStart(3)}   substrings ${subs}   segments ${newParse(str).length}`);
}

console.log('');
console.log('sink', sink);
