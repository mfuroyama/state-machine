'use strict';

class StateMachineError extends Error {
    constructor(errorObj) {
        super(errorObj.message);
        Object.assign(this, {
            name: 'StateMachineError',
            ...errorObj,
        });
    }
}

module.exports = StateMachineError;
