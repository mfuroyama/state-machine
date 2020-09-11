'use strict';

const AsyncStateMachine = require('../src/async-state-machine');
const StateMachineError = require('../src/state-machine-error');

const waitingStateMock = jest.fn().mockResolvedValue('end');
const endStateMock = jest.fn().mockRejectedValue('error');

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

describe('State machine - asynchronous', () => {
    let machine = null;

    beforeEach(() => {
        machine = new AsyncStateMachine(TEST_STATES_1);
        waitingStateMock.mockClear();
    });

    test('Basic transitions', async () => {
        let result = await machine.start({ data: true });
        expect(result.currentState).toBe('start');
        expect(machine._context.data).toBe(true);

        result = await machine.begin();
        expect(result.currentState).toBe('waiting');

        result = await machine.transition('next');
        expect(waitingStateMock).toHaveBeenCalled();
        expect(result.currentState).toBe('end');
    });

    test('State change handlers', async () => {
        machine.onWaiting(async (params) => {
            expect(params.previousState).toBe('start');
            expect(params.lastTransition).toBe('begin');
        });
        machine.onState('end', (params) => {
            expect(params.previousState).toBe('waiting');
            expect(params.lastTransition).toBe('next');
        });

        await machine.start();
        await machine.begin();
        await machine.next();

        machine.onStateChanges(async (state) => {
            expect(state).toBe('start');
        });

        await machine.start();
    });

    describe('Error handling', () => {
        test('Returned errors', async () => {
            const errorMachine = new AsyncStateMachine(TEST_STATES_2);
            await errorMachine.start();

            let error = await errorMachine.transition('fail');
            expect(error.error).toBe('INVALID_TRANSITION');

            await errorMachine.begin();
            error = await errorMachine.bounce();
            expect(error.error).toBe('INVALID_STATE');

            await errorMachine.slide();
            error = await errorMachine.jumpOffACliff();
            expect(error.error).toBe('MACHINE_ERROR');
            expect(error.message).toBe('error');

            errorMachine.onError((err) => {
                expect(err.error).toBe('INVALID_TRANSITION');
            });
            await errorMachine.start();
            await errorMachine.bounce();
        });
        test('Rejections', async () => {
            const thrower = new AsyncStateMachine(TEST_STATES_2, { throws: true });
            thrower.start();
            await expect(thrower.bounce()).rejects.toThrow(StateMachineError);

            thrower.begin();
            await expect(thrower.bounce()).rejects.toThrow(StateMachineError);

            thrower.slide();
            await expect(thrower.jumpOffACliff()).rejects.toThrow(StateMachineError);
        });
    });
});
