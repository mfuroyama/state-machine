'use strict';

const { StateMachine } = require('../src/index');

const machine = new StateMachine({
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
            timer: (context) => {
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

machine.onGreen(() => {
    console.log('HEY, I turned GREEN, jump to next state...');
    machine.timer();
}).onYellow((params) => {
    console.log('HEY, I turned YELLOW, here\'s what\'s up:');
    console.log(JSON.stringify(params, null, 4));
}).onState('red', () => {
    console.log('HEY, I just turned RED');
}).onError((err) => {
    console.log('Yoo! I got an error', err);
});

console.log(machine.start({ count: 0 }));
console.log(machine.timer());
console.log(machine.transition('timer'));
console.log(machine.timer());
console.log(machine.timer());
console.log(machine.timer());
