/**
 * Publish guard.
 *
 * Run from the "prepublishOnly" script, which npm runs on `npm publish` only
 * (never on `npm pack`, `npm install` or `npm ci`) and before the tarball is
 * assembled. Publishing therefore has to clear this check before any build or
 * upload work happens, and packing stays usable for verification.
 *
 * The hazard this exists to remove: npm versions are immutable and the
 * "latest" dist-tag is what a bare `npm install @base-framework/base`
 * resolves. A single unthinking `npm publish` from a work-in-progress tree
 * pins that unfinished state as the version every consumer installs, and it
 * cannot be taken back.
 *
 * A publish is allowed when either
 *
 *   - the current branch is exactly `release/<version>`, where <version>
 *     matches package.json, which is the documented release process and so
 *     needs no extra ceremony, or
 *   - BASE_RELEASE names the version being shipped, for CI and detached
 *     HEADs where no branch name exists.
 *
 * Both require restating the version, which is easy to do deliberately and
 * essentially impossible to do by accident.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

/**
 * The package root, resolved from this file so the guard behaves the same
 * however it is invoked.
 *
 * @type {string}
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Name of the environment variable that opts in to a publish.
 *
 * @type {string}
 */
const OPT_IN = 'BASE_RELEASE';

/**
 * This will read the version from package.json.
 *
 * @returns {string}
 */
const getVersion = () =>
{
	const file = path.join(ROOT, 'package.json');
	return JSON.parse(readFileSync(file, 'utf8')).version;
};

/**
 * This will get the current branch name.
 *
 * @returns {?string} Null when there is no branch: a detached HEAD, or no
 * git at all (publishing from an extracted tarball, for instance).
 */
const getBranch = () =>
{
	try
	{
		const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
			cwd: ROOT,
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore']
		}).trim();

		return (!branch || branch === 'HEAD') ? null : branch;
	}
	catch
	{
		return null;
	}
};

/**
 * This will drop a leading "v" so a git tag name can be compared against a
 * package version. The repo has used both conventions (3.0.0, v3.7.75).
 *
 * @param {string} value
 * @returns {string}
 */
const stripTagPrefix = (value) => value.trim().replace(/^v/, '');

/**
 * This will check whether a version carries a prerelease component.
 *
 * @param {string} version
 * @returns {boolean}
 */
const isPrerelease = (version) => version.includes('-');

/**
 * This will print the lines to stderr and exit non-zero.
 *
 * @param {Array<string>} lines
 * @returns {never}
 */
const fail = (lines) =>
{
	console.error(`\n${lines.join('\n')}\n`);
	process.exit(1);
};

/**
 * This will build the message shown when the tree is not an approved release
 * point. It has to say what to do, not just that something was refused.
 *
 * @param {string} version
 * @param {?string} branch
 * @returns {Array<string>}
 */
const blockedMessage = (version, branch) =>
{
	const next = version.replace(/-.*$/, '');
	return [
		'PUBLISH BLOCKED  (scripts/publish-guard.js)',
		'',
		`  package:  @base-framework/base`,
		`  version:  ${version}`,
		`  branch:   ${branch ?? '(detached HEAD / not a git checkout)'}`,
		'',
		'Nothing was published and nothing was built.',
		'',
		'This tree is not an approved release point. Releases are cut from a',
		'dedicated release branch, never from master: master carries unfinished',
		'work, npm versions are immutable, and a bare publish claims the',
		'"latest" dist-tag that every `npm install @base-framework/base`',
		'resolves. Shipping master would pin work-in-progress as the version',
		'all consumers get, and it could not be undone.',
		'',
		'To release intentionally:',
		'',
		'  1. Cut a release branch from the commit you actually mean to ship:',
		`       git switch -c release/${next} <release-point>`,
		`  2. Set "version" in package.json and package-lock.json to ${next}.`,
		'  3. Verify: npm ci, npm run build, npm run test:run, npm run size:check,',
		'     npm run cache:check, npm pack --dry-run',
		'  4. Publish from that branch: npm publish',
		'',
		`The guard passes on its own once the branch is release/${version} with a`,
		'matching package.json version, so a real release needs no extra step.',
		'',
		'For CI or a detached HEAD, name the version explicitly instead:',
		`  PowerShell:  $env:${OPT_IN}="${version}"; npm publish`,
		`  bash / CI:   ${OPT_IN}=${version} npm publish`
	];
};

/**
 * This will run the guard.
 *
 * @returns {void}
 */
const main = () =>
{
	const version = getVersion();
	const branch = getBranch();
	const optIn = process.env[OPT_IN];

	if (optIn)
	{
		const claimed = stripTagPrefix(optIn);
		if (claimed !== version)
		{
			fail([
				'PUBLISH BLOCKED  (scripts/publish-guard.js)',
				'',
				`${OPT_IN} does not match the version being published.`,
				'',
				`  ${OPT_IN}:            ${optIn}  (read as ${claimed})`,
				`  package.json version: ${version}`,
				'',
				'Nothing was published. This usually means a release was tagged',
				'from a tree whose package.json was never bumped, so the tarball',
				'would not contain the version the tag promises.',
				'',
				`Bump package.json (and package-lock.json) to ${claimed}, or set`,
				`${OPT_IN} to ${version} if that is really the version to ship.`
			]);
		}
	}
	else if (branch !== `release/${version}`)
	{
		fail(blockedMessage(version, branch));
	}

	/**
	 * A prerelease must never take the "latest" dist-tag. npm 11 refuses this
	 * on its own, but only after prepublishOnly has run, and npm 8 (still what
	 * older CI images ship) applies "latest" silently. Checking it here makes
	 * the behaviour the same on every npm.
	 */
	if (isPrerelease(version))
	{
		const tag = process.env.npm_config_tag;
		if (!tag || tag === 'latest')
		{
			fail([
				'PUBLISH BLOCKED  (scripts/publish-guard.js)',
				'',
				`${version} is a prerelease, so it must not be published to the`,
				'"latest" dist-tag: latest is what a bare `npm install` resolves,',
				'and pointing it at a prerelease hands unfinished work to every',
				'consumer.',
				'',
				`  requested tag: ${tag ?? '(none, which means latest)'}`,
				'',
				'Publish it under its own tag instead:',
				'',
				'  npm publish --tag next',
				'',
				'Consumers then opt in with `npm install @base-framework/base@next`,',
				'while `latest` keeps pointing at the current stable release.'
			]);
		}
	}

	const via = process.env[OPT_IN] ? `${OPT_IN}=${version}` : `branch release/${version}`;
	console.log(`publish-guard: approved ${version} (${via}).`);
};

main();
