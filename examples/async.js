'use strict';

const { AsyncStateMachine } = require('../src/index');

const machine = new AsyncStateMachine({
    name: 'light',
    initial: 'green',
    states: {
        green: {
            timer: 'yellow',
        },
        yellow: {
            timer: 'red',
        },
        red: {
            timer: async (context) => {
                if (context.count > 0) {
                    throw new Error('You can\'t do that');
                }
                context.count += 1;
                return 'green';
            },
        },
        done: null,
    },
}, { throws: false });

machine.onGreen(async () => {
    console.log('HEY, I turned GREEN, jump to next state...');
    await machine.timer();
}).onYellow((params) => {
    console.log('HEY, I turned YELLOW, here\'s what\'s up:');
    console.log(JSON.stringify(params, null, 4));
}).onState('red', () => {
    console.log('HEY, I just turned RED');
}).onError((err) => {
    console.log('Yoo! I got an error', err);
});

(async () => {
    console.log(await machine.start({ count: 0 }));
    console.log(await machine.timer());
    console.log(await machine.transition('timer'));
    console.log(await machine.timer());
    console.log(await machine.timer());
    console.log(await machine.timer());
})();
