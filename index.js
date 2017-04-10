var Scope = require('./lib/scope');
var processNames = require('./lib/namesProcessor');
var processValues = require('./lib/valuesProcessor');
var utils = require('./lib/utils');
var parser = require('./lib/parser');
var walker = require('./lib/walker');

module.exports = {
    Scope: Scope,
    processNames: processNames,
    processValues: processValues,
    parser: parser,
    utils: utils,
    walker: walker
};
