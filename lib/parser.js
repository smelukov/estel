var utils = require('./utils/index');
var esprima = require('esprima');
var escodegen = require('escodegen');

module.exports = {
    parse: function(code, params) {
        params = utils.deepExtend({}, {
            sourceType: 'script',
            loc: false,
            range: false,
            comment: false,
            tokens: false,
            tolerant: false
        }, params);

        return esprima.parse(code, params);
    },
    translate: escodegen.generate.bind(escodegen)
};
