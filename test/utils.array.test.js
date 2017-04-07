var assert = require('chai').assert;
var utils = require('../lib/utils');

describe('Utils.array', function() {
    describe('#indexOf()', function() {
        it('with scalar', function() {
            var array = [1, 2, 3];

            assert.equal(utils.array.indexOf(array, 1), 0);
            assert.equal(utils.array.indexOf(array, 2), 1);
            assert.equal(utils.array.indexOf(array, 3), 2);
            assert.equal(utils.array.indexOf(array, 4), -1);
        });

        it('with objects property', function() {
            var array = [{ value: 1 }, { value: 2 }, { value: 3 }];

            assert.equal(utils.array.indexOf(array, 1, 'value'), 0);
            assert.equal(utils.array.indexOf(array, 2, 'value'), 1);
            assert.equal(utils.array.indexOf(array, 3, 'value'), 2);
            assert.equal(utils.array.indexOf(array, 4, 'value'), -1);
        });
    });

    describe('#has()', function() {
        it('with scalar', function() {
            var array = [1, 2, 3];

            assert.equal(utils.array.has(array, 1), true);
            assert.equal(utils.array.has(array, 2), true);
            assert.equal(utils.array.has(array, 3), true);
            assert.equal(utils.array.has(array, 4), false);
        });

        it('with objects property', function() {
            var array = [{ value: 1 }, { value: 2 }, { value: 3 }];

            assert.equal(utils.array.has(array, 1, 'value'), true);
            assert.equal(utils.array.has(array, 2, 'value'), true);
            assert.equal(utils.array.has(array, 3, 'value'), true);
            assert.equal(utils.array.has(array, 4, 'value'), false);
        });
    });

    describe('#search()', function() {
        it('with scalar', function() {
            var array = [1, 2, 3];

            assert.equal(utils.array.search(array, 1), 1);
            assert.equal(utils.array.search(array, 2), 2);
            assert.equal(utils.array.search(array, 3), 3);
            assert.equal(utils.array.search(array, 4), null);
        });

        it('with objects property', function() {
            var array = [{ value: 1 }, { value: 2 }, { value: 3 }];

            assert.equal(utils.array.search(array, 1, 'value'), array[0]);
            assert.equal(utils.array.search(array, 2, 'value'), array[1]);
            assert.equal(utils.array.search(array, 3, 'value'), array[2]);
            assert.equal(utils.array.search(array, 4, 'value'), null);
        });
    });

    describe('#remove()', function() {
        it('with scalar', function() {
            var array = [1, 2, 3];

            assert.equal(utils.array.remove(array, 4), false);
            assert.equal(utils.array.remove(array, 1), true);
            assert.lengthOf(array, 2);
            assert.equal(utils.array.remove(array, 2), true);
            assert.lengthOf(array, 1);
            assert.equal(utils.array.remove(array, 3), true);
            assert.lengthOf(array, 0);
        });

        it('with objects property', function() {
            var array = [{ value: 1 }, { value: 2 }, { value: 3 }];

            assert.equal(utils.array.remove(array, 4, 'value'), false);
            assert.lengthOf(array, 3);
            assert.equal(utils.array.remove(array, 1, 'value'), true);
            assert.lengthOf(array, 2);
            assert.equal(utils.array.remove(array, 2, 'value'), true);
            assert.lengthOf(array, 1);
            assert.equal(utils.array.remove(array, 3, 'value'), true);
            assert.lengthOf(array, 0);
        });
    });

    describe('#is()', function() {
        it('should return true with array and array-like', function() {
            var array = [];

            assert.isTrue(utils.array.is(array));
            assert.isTrue(utils.array.is({ 0: 'a', 1: 'b', length: 2 }));
        });
        it('should return false with no array', function() {
            assert.isFalse(utils.array.is());
            assert.isFalse(utils.array.is(123));
            assert.isFalse(utils.array.is('qwerty'));
            assert.isFalse(utils.array.is(function() {
                // dummy
            }));
        });
    });
    describe('#from()', function() {
        it('should return array with any value', function() {
            var array = utils.array.from();

            assert(Array.isArray(array) && array.length == 0);

            array = utils.array.from([1, 2, 3]);
            assert.sameMembers(array, [1, 2, 3]);

            array = utils.array.from(1);
            assert.sameMembers(array, [1]);

            array = utils.array.from({ 0: 'a', 1: 'b', length: 2 });
            assert.sameMembers(array, ['a', 'b']);
        });
    });
});
