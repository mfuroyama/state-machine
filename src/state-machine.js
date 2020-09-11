'use strict';

const StateMachineError = require('./state-machine-error');
const { isObject, isFunction, toMethodName } = require('./utils');

class StateMachine {
    constructor(config, options = {}) {
        Object.assign(this, {
            _options: options,
            _config: config,
            _stateChangeHandlers: {},
            _defaultStateChangeHandler: null,
        });

        this._initializeStates();
    }

    transition(name, params) {
        const transition = this._getTransition(name);
        if (!transition) {
            return this._transitionError(name);
        }

        try {
            const newState = isFunction(transition) ? transition(this._context, params) : transition;

            this._lastTransition = name;
            return this._setState(newState);
        } catch (err) {
            return this._machineError(err.toString(), name);
        }
    }

    getState() {
        const { _state: currentState, _lastTransition, _context } = this;
        return {
            currentState,
            lastTransition: _lastTransition,
            context: _context,
        };
    }

    onStateChanges(callback) {
        this._defaultStateChangeHandler = callback;
        return this;
    }

    onState(state, callback) {
        this._stateChangeHandlers[state] = callback;
        return this;
    }

    onError(errorHandler) {
        this._errorHandler = errorHandler;
        return this;
    }

    start(context = {}) {
        Object.assign(this, {
            _context: context,
            _lastTransition: null,
        });

        return this._setState(this._config.initial);
    }

    _initializeStates() {
        const { states } = this._config;
        this.validStates = Object.keys(states);

        const apiMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
            .filter((name) => !name.startsWith('_') && name !== 'constructor');

        // If the state change handler already exists on the object, we silently ignore it
        this.validStates.forEach((state) => {
            const methodName = toMethodName(state);
            if (!apiMethods.includes(methodName)) {
                this[methodName] = this.onState.bind(this, state);
            }
        });

        // For each of the states, bind a copy of the transition method. if the transition
        // handler already exists on the object, we silently ignore it
        Object.values(states).forEach((transitions) => {
            if (!transitions || !isObject(transitions)) {
                return;
            }

            Object.keys(transitions).forEach((name) => {
                if (!apiMethods.includes(name) && !this[name]) {
                    this[name] = this.transition.bind(this, name);
                }
            });
        });
    }

    _getTransition(name) {
        const { _config, _state: state } = this;
        const { states } = _config;
        const transition = states[state];

        return (transition && transition[name]) ? transition[name] : null;
    }

    _setState(state) {
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
            stateHandler(status);
        } else if (isFunction(this._defaultStateChangeHandler)) {
            this._defaultStateChangeHandler(this._state, status);
        }

        return this.getState();
    }

    _transitionError(transition) {
        return this._handleError({
            error: 'INVALID_TRANSITION',
            message: `Error: Invalid transition: ${transition}, current state: ${this.state}`,
            transition,
        });
    }

    _stateError(state) {
        return this._handleError({
            error: 'INVALID_STATE',
            message: `Error: Invalid new state: ${state}`,
            state,
        });
    }

    _machineError(message, transition) {
        return this._handleError({
            error: 'MACHINE_ERROR',
            message,
            transition,
        });
    }

    _handleError(error) {
        const errorObj = {
            ...error,
            currentState: this._state,
            ...(this._lastTransition && { lastTransition: this._lastTransition }),
            context: this._context,
        };

        if (this._options.throws) {
            throw new StateMachineError(errorObj);
        }

        if (this._errorHandler) {
            this._errorHandler(errorObj, this._context);
        }

        return errorObj;
    }
}

module.exports = StateMachine;
