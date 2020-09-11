# (Yet Another) State Machine Implementation

## Introduction
This state machine implementation is similar to the XState implementation, but with some differences:

* Comes in two flavors: synchronous and asynchronous state transition handling
* Transition convenience functions (i.e. `machine.transition('slide')` => `machine.slide()`)
* Post-state change callbacks
  - `machine.onState('running', ...)`
  - Convenience functions (i.e. `machine.onState('running', ...)` => `machine.onRunning(...)`)
  - Add handler for **all** state changes (i.e. `machine.onStateChanges((state, status) => ...)`)
* Graceful error handling
  - Can be configured to return errors or to throw exceptions (`reject` in the asynchronous flavor) on state transitions
  - Error state callbacks (i.e. `machine.onError(err)`)
* Use your own context objects in transition handlers (default to an empty JS object)

More documentation (API, etc.) to come