var Scope = require('./lib/scope');
var processNames = require('./lib/namesProcessor');
var processValues = require('./lib/valuesProcessor');
var valueResolver = require('./lib/valueResolver');
var utils = require('./lib/utils');
var walker = require('./lib/walker');

module.exports = {
    Scope: Scope,
    processNames: processNames,
    processValues: processValues,
    valueResolver: valueResolver,
    utils: utils,
    walker: walker
};
