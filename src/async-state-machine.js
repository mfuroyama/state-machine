'use strict';

const StateMachine = require('./state-machine');
const { isFunction } = require('./utils');

class AsyncStateMachine extends StateMachine {
    async transition(name, params) {
        const transition = this._getTransition(name);
        if (!transition) {
            return this._transitionError(name);
        }

        try {
            const newState = await this._processTransition(transition, params);

            this._lastTransition = name;

            const result = await this._setState(newState);
            return result;
        } catch (err) {
            return this._machineError(err.toString(), name);
        }
    }

    async start(context = {}) {
        Object.assign(this, {
            _context: context,
            _lastTransition: null,
        });

        const result = await this._setState(this._config.initial);
        return result;
    }

    async _processTransition(transition, params) {
        if (!isFunction(transition)) {
            return transition;
        }

        const newState = await transition(this._context, params);
        return newState;
    }

    async _setState(state) {
        if (!this.validStates.includes(state)) {
            return this._stateError(state);
        }

        const previousState = this._state;
        this._state = state;

        const stateHandler = this._stateChangeHandlers[this._state];
        const status = {
            lastTransition: this._lastTransition,
            previousState,
            context: this._context,
        };

        if (isFunction(stateHandler)) {
            await stateHandler(status);
        } else if (isFunction(this._defaultStateChangeHandler)) {
            await this._defaultStateChangeHandler(this._state, status);
        }

        return this.getState();
    }
}

module.exports = AsyncStateMachine;
