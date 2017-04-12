var assert = require('chai').assert;
var utils = require('../lib/utils');

describe('Utils', function() {
    it('#deepExtend', function() {
        var a = {};
        var b = { a: 1, b: 2, c: { d: 3, e: 4 } };
        var c = { b: [5, { f: 6 }, [7, 8, 9]] };
        var d = null;

        assert.deepEqual(utils.deepExtend(a, b, c, d), { a: 1, b: [5, { f: 6 }, [7, 8, 9]], c: { d: 3, e: 4 } });
        assert.isUndefined(utils.deepExtend(d, a, b, c));
    });
});
