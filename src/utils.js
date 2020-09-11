'use strict';

const isObject = (val) => typeof val === 'object';
const isFunction = (val) => typeof val === 'function';
const toMethodName = (str) => {
    if (typeof str !== 'string' || str.length === 0) {
        return str;
    }
    return `on${str[0].toUpperCase()}${str.slice(1).toLowerCase()}`;
};

module.exports = {
    isObject,
    isFunction,
    toMethodName,
};
