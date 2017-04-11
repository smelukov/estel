var Scope = require('./lib/scope');
var processNames = require('./lib/namesProcessor');
var processValues = require('./lib/valuesProcessor');
var valueResolver = require('./lib/valueResolver');
var utils = require('./lib/utils');
var parser = require('./lib/parser');
var walker = require('./lib/walker');

module.exports = {
    Scope: Scope,
    processNames: processNames,
    processValues: processValues,
    valueResolver: valueResolver,
    parser: parser,
    utils: utils,
    walker: walker
};
