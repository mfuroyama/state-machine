'use strict';

const { StateMachine } = require('../src/index');

const parser = new StateMachine({
    name: 'parser',
    states: {
        header: {
            nextState: (context) => {
                const { string } = context;
                const header = string.slice(0, 8);
                if (header !== '[HEADER]') {
                    throw new Error('Invalid header');
                }

                const value = string.slice(8, 11);
                Object.assign(context, {
                    bodyLength: +value,
                    cursor: 11,
                });
                return 'body';
            },
        },
        body: {
            nextState: (context) => {
                const { string, cursor, bodyLength } = context;
                const body = string.slice(cursor, cursor + bodyLength);

                Object.assign(context, {
                    body,
                    cursor: cursor + bodyLength,
                });

                return 'trailer';
            },
        },
        trailer: {
            nextState: (context) => {
                const { string, cursor } = context;
                const trailer = string.slice(cursor, cursor + 9);
                if (trailer !== '[TRAILER]') {
                    throw new Error('Invalid trailer');
                }

                return 'done';
            },
        },
        error: {
            nextState: 'done',
        },
        done: null,
    },
    initial: 'header',
});

parser.onStateChanges((state) => {
    if (state !== 'done') {
        parser.nextState();
    }
});

parser.onError((err, context) => {
    context.error = err.message;
});

const result = parser.start({ string: '[HEADER]022This is a test payload[TRAILER]' });
console.log(result);
