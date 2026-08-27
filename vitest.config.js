import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration.
 *
 * The framework is a browser UI library, so every suite runs against a
 * jsdom document. Module-level singletons (dataBinder, RenderController)
 * probe for `window`/`document` when they are first imported, so the DOM
 * has to exist before any framework module is loaded.
 */
export default defineConfig({
	test: {
		environment: 'jsdom',
		environmentOptions: {
			jsdom: {
				url: 'http://localhost/'
			}
		},
		include: ['tests/**/*.test.js'],
		setupFiles: ['./tests/setup.js'],
		restoreMocks: true,

		/**
		 * Standing up a jsdom document costs a few seconds per file. Running
		 * the files sequentially in one forked process keeps that cost from
		 * being paid by several workers at once, which was starving the pool
		 * on Windows. Module isolation per file is still on, so the framework
		 * singletons (dataBinder, Directives, StateTracker) start clean for
		 * every suite.
		 */
		pool: 'forks',
		maxWorkers: 1,
		minWorkers: 1,
		fileParallelism: false,
		testTimeout: 30000,
		hookTimeout: 30000
	}
});
