'use strict';

const utils = require('../src/utils');

describe('Utility tests', () => {
    test('isObject', () => {
        const { isObject } = utils;
        expect(isObject({ test: 'success' })).toBeTruthy();
        expect(isObject('not an object')).toBeFalsy();
    });
    test('isFunction', () => {
        const { isFunction } = utils;
        expect(isFunction(() => 'success')).toBeTruthy();
        expect(isFunction(async () => 'promise')).toBeTruthy();
        expect(isFunction('not a function')).toBeFalsy();
    });
    test('toMethodName', () => {
        const { toMethodName } = utils;
        expect(toMethodName('success')).toBe('onSuccess');
        expect(toMethodName('a')).toBe('onA');
        expect(toMethodName('')).toBe('');
        expect(toMethodName(2)).toBe(2);
        expect(toMethodName()).toBeFalsy();
    });
});
