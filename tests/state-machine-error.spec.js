'use strict';

const StateMachineError = require('../src/state-machine-error');

test('State machine error', () => {
    const error = new StateMachineError({ message: 'state error' });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('StateMachineError');
    expect(error.message).toBe('state error');
    expect(error.toString()).toBe('StateMachineError: state error');
});
