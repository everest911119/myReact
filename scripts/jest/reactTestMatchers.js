'use strict';

const JestReact = require('jest-react');
const SchedulerMatchers = require('./schedulerTestMatchers');

function captureAssertion(fn) {
	// Trick to use a Jest matcher inside another Jest matcher. `fn` contains an
	// assertion; if it throws, we capture the error and return it, so the stack
	// trace presented to the user points to the original assertion in the
	// test file.
	try {
		fn();
	} catch (error) {
		return {
			pass: false,
			message: () => error.message
		};
	}
	return { pass: true };
}

function assertYieldsWereCleared(Scheduler) {
	const actualYields = Scheduler.unstable_clearYields();
	if (actualYields.length !== 0) {
		throw new Error(
			'Log of yielded values is not empty. ' +
				'Call expect(Scheduler).toHaveYielded(...) first.'
		);
	}
}

function toMatchRenderedOutput(ReactNoop, expectedJSX) {
	if (typeof ReactNoop.getChildrenAsJsx === 'function') {
		const Scheduler = ReactNoop._Scheduler;
		assertYieldsWereCleared(Scheduler);
		console.log(ReactNoop.getChildrenAsJsx());
		return captureAssertion(() => {
			expect(ReactNoop.getChildrenAsJsx()).toEqual(expectedJSX);
		});
	}
	return JestReact.unstable_toMatchRenderedOutput(ReactNoop, expectedJSX);
}

module.exports = {
	...SchedulerMatchers,
	toMatchRenderedOutput
};
