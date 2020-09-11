'use strict';

const StateMachine = require('../src/state-machine');
const StateMachineError = require('../src/state-machine-error');

const waitingStateMock = jest.fn().mockReturnValue('end');
const endStateMock = jest.fn().mockImplementation(() => {
    throw new Error('error');
});

const TEST_STATES_1 = {
    name: 'test-states-1',
    initial: 'start',
    states: {
        start: {
            begin: 'waiting',
            next: 'waiting',
        },
        waiting: {
            next: waitingStateMock,
        },
        end: null,
    },
};

const TEST_STATES_2 = {
    name: 'test-states-2',
    initial: 'start',
    states: {
        start: {
            begin: 'waiting',
        },
        waiting: {
            bounce: 'invalid',
            slide: 'end',
        },
        end: {
            jumpOffACliff: endStateMock,
        },
    },
};

describe('State machine - synchronous', () => {
    let machine = null;

    beforeEach(() => {
        machine = new StateMachine(TEST_STATES_1);
        waitingStateMock.mockClear();
    });

    test('Instantiation and initialization', () => {
        expect(machine.begin).toBeDefined();
        expect(machine.next).toBeDefined();
        expect(machine.onStart).toBeDefined();
        expect(machine.onWaiting).toBeDefined();
        expect(machine.onEnd).toBeDefined();
    });

    test('Convenience method naming collisions', () => {
        const stateStartMock = jest.fn();
        const collisions = new StateMachine({
            name: 'collisions',
            initial: 'begin',
            states: {
                begin: 'state',
                state: {
                    start: stateStartMock,
                },
            },
        });

        collisions.start();
    });

    test('Basic transitions', () => {
        let result = machine.start({ data: true });
        expect(result.currentState).toBe('start');
        expect(machine._context.data).toBe(true);

        result = machine.begin();
        expect(result.currentState).toBe('waiting');

        result = machine.transition('next');
        expect(waitingStateMock).toHaveBeenCalled();
        expect(result.currentState).toBe('end');
    });

    test('State change handlers', () => {
        machine.onWaiting((params) => {
            expect(params.previousState).toBe('start');
            expect(params.lastTransition).toBe('begin');
        });
        machine.onState('end', (params) => {
            expect(params.previousState).toBe('waiting');
            expect(params.lastTransition).toBe('next');
        });

        machine.start();
        machine.begin();
        machine.next();

        machine.onStateChanges((state) => {
            expect(state).toBe('start');
        });

        machine.start();
    });

    describe('Error handling', () => {
        test('Returned errors', () => {
            const errorMachine = new StateMachine(TEST_STATES_2);
            errorMachine.start();

            let error = errorMachine.transition('fail');
            expect(error.error).toBe('INVALID_TRANSITION');

            errorMachine.begin();
            error = errorMachine.bounce();
            expect(error.error).toBe('INVALID_STATE');

            errorMachine.slide();
            error = errorMachine.jumpOffACliff();
            expect(error.error).toBe('MACHINE_ERROR');
            expect(error.message).toBe('Error: error');

            errorMachine.onError((err) => {
                expect(err.error).toBe('INVALID_TRANSITION');
            });
            errorMachine.start();
            errorMachine.bounce();
        });
        test('Thrown errors', () => {
            const thrower = new StateMachine(TEST_STATES_2, { throws: true });
            thrower.start();
            expect(() => thrower.bounce()).toThrow(StateMachineError);

            thrower.begin();
            expect(() => thrower.bounce()).toThrow(StateMachineError);

            thrower.slide();
            expect(() => thrower.jumpOffACliff()).toThrow(StateMachineError);
        });
    });
});
