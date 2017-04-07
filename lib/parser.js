var esprima = require('esprima');
var escodegen = require('escodegen');

module.exports = {
    parse: esprima.parse.bind(esprima),
    translate: escodegen.generate.bind(escodegen)
};
