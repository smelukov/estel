var Scope = require('./lib/scope');
var processNames = require('./lib/namesProcessor');
var utils = require('./lib/utils');
var parser = require('./lib/parser');
var walker = require('./lib/walker');

module.exports = {
    Scope: Scope,
    processNames: processNames,
    parser: parser,
    utils: utils,
    walker: walker
};
