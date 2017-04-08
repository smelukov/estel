var assert = require('chai').assert;
var Scope = require('../lib/scope');

describe('Scope', function() {
    var rootScope;

    beforeEach(function() {
        rootScope = new Scope();
    });

    it('building scope tree', function() {
        var childScope1 = new Scope();
        var childScope2 = new Scope();
        var result;

        result = rootScope.addScope(childScope1);
        assert.equal(result, true);
        result = rootScope.addScope(childScope1);
        assert.equal(result, false);
        assert.sameMembers(rootScope.scopes, [childScope1]);
        assert.isTrue(rootScope.hasScope(childScope1));

        result = rootScope.addScope(childScope2);
        assert.equal(result, true);
        assert.sameMembers(rootScope.scopes, [childScope1, childScope2]);
        assert.isTrue(rootScope.hasScope(childScope1));
        assert.isTrue(rootScope.hasScope(childScope2));
        assert.equal(childScope1.parent, rootScope);
        assert.equal(childScope2.parent, rootScope);

        result = childScope1.addScope(childScope2);
        assert.equal(result, true);
        assert.sameMembers(rootScope.scopes, [childScope1]);
        assert.isTrue(rootScope.hasScope(childScope1));
        assert.isFalse(rootScope.hasScope(childScope2));
        assert.sameMembers(childScope1.scopes, [childScope2]);
        assert.isTrue(childScope1.hasScope(childScope2));
        assert.equal(childScope2.parent, childScope1);
    });

    describe('references', function() {
        it('working with references', function() {
            var childScope1 = new Scope(rootScope);
            var childScope2 = new Scope(childScope1);

            rootScope.setReference('a', 'someValue');
            assert.isTrue(rootScope.hasReference('a'));
            assert.isTrue(rootScope.hasOwnReference('a'));
            assert.equal(rootScope.getReference('a'), 'someValue');
            assert.equal(rootScope.getOwnReference('a'), 'someValue');
            assert.equal(rootScope.countReferences(), 1);
            assert.equal(rootScope.countOwnReferences(), 1);
            assert.sameMembers(rootScope.getReferenceNames(), ['a']);
            assert.sameMembers(rootScope.getOwnReferenceNames(), ['a']);

            childScope1.setReference('a', 'someValue2');
            assert.isTrue(childScope1.hasReference('a'));
            assert.isFalse(childScope1.hasOwnReference('a'));
            assert.equal(childScope1.getReference('a'), 'someValue2');
            assert.isNull(childScope1.getOwnReference('a'));
            assert.equal(childScope1.countReferences(), 1);
            assert.equal(childScope1.countOwnReferences(), 0);
            assert.sameMembers(childScope1.getReferenceNames(), ['a']);
            assert.lengthOf(childScope1.getOwnReferenceNames(), 0);
            assert.equal(rootScope.getReference('a'), 'someValue2');
            assert.equal(rootScope.countReferences(), 1);
            assert.equal(rootScope.countOwnReferences(), 1);
            assert.sameMembers(rootScope.getReferenceNames(), ['a']);
            assert.sameMembers(rootScope.getOwnReferenceNames(), ['a']);

            childScope1.setOwnReference('a', 'someValue3');
            assert.isTrue(childScope1.hasReference('a'));
            assert.isTrue(childScope1.hasOwnReference('a'));
            assert.equal(childScope1.getReference('a'), 'someValue3');
            assert.equal(childScope1.getOwnReference('a'), 'someValue3');
            assert.equal(childScope1.countReferences(), 1);
            assert.equal(childScope1.countOwnReferences(), 1);
            assert.sameMembers(childScope1.getReferenceNames(), ['a']);
            assert.sameMembers(childScope1.getOwnReferenceNames(), ['a']);
            assert.equal(rootScope.getReference('a'), 'someValue2');
            assert.equal(rootScope.countReferences(), 1);
            assert.equal(rootScope.countOwnReferences(), 1);
            assert.sameMembers(childScope1.getReferenceNames(), ['a']);
            assert.sameMembers(childScope1.getOwnReferenceNames(), ['a']);

            childScope2.setReference('a', 'someValue4');
            assert.isTrue(childScope2.hasReference('a'));
            assert.isFalse(childScope2.hasOwnReference('a'));
            assert.equal(childScope2.getReference('a'), 'someValue4');
            assert.isNull(childScope2.getOwnReference('a'));
            assert.equal(childScope2.countReferences(), 1);
            assert.equal(childScope2.countOwnReferences(), 0);
            assert.sameMembers(childScope2.getReferenceNames(), ['a']);
            assert.lengthOf(childScope2.getOwnReferenceNames(), 0);
            assert.equal(childScope1.getReference('a'), 'someValue4');
            assert.equal(childScope1.countReferences(), 1);
            assert.equal(childScope1.countOwnReferences(), 1);
            assert.sameMembers(childScope1.getReferenceNames(), ['a']);
            assert.sameMembers(childScope1.getOwnReferenceNames(), ['a']);
            assert.equal(rootScope.getReference('a'), 'someValue2');
            assert.equal(rootScope.countReferences(), 1);
            assert.equal(rootScope.countOwnReferences(), 1);

            childScope2.setOwnReference('b', 'someOtherValue');
            assert.isTrue(childScope2.hasReference('b'));
            assert.isTrue(childScope2.hasOwnReference('b'));
            assert.equal(childScope2.getReference('b'), 'someOtherValue');
            assert.equal(childScope2.getOwnReference('b'), 'someOtherValue');
            assert.equal(childScope2.countReferences(), 2);
            assert.equal(childScope2.countOwnReferences(), 1);
            assert.sameMembers(childScope2.getReferenceNames(), ['a', 'b']);
            assert.sameMembers(childScope2.getOwnReferenceNames(), ['b']);
            assert.isNull(childScope1.getReference('b'));
            assert.equal(childScope1.countReferences(), 1);
            assert.equal(childScope1.countOwnReferences(), 1);
            assert.isNull(rootScope.getReference('b'));
            assert.equal(rootScope.countReferences(), 1);
            assert.equal(rootScope.countOwnReferences(), 1);

            childScope2.removeOwnReference('b');
            assert.equal(childScope2.countReferences(), 1);
            assert.equal(childScope2.countOwnReferences(), 0);
            assert.sameMembers(childScope2.getReferenceNames(), ['a']);
            assert.lengthOf(childScope2.getOwnReferenceNames(), 0);
            assert.equal(childScope1.countReferences(), 1);
            assert.equal(childScope1.countOwnReferences(), 1);
            assert.equal(rootScope.countReferences(), 1);
            assert.equal(rootScope.countOwnReferences(), 1);

            childScope1.removeOwnReference('a');
            assert.equal(childScope2.countReferences(), 1);
            assert.equal(childScope2.countOwnReferences(), 0);
            assert.sameMembers(childScope2.getReferenceNames(), ['a']);
            assert.lengthOf(childScope2.getOwnReferenceNames(), 0);
            assert.equal(childScope1.countReferences(), 1);
            assert.equal(childScope1.countOwnReferences(), 0);
            assert.sameMembers(childScope1.getReferenceNames(), ['a']);
            assert.lengthOf(childScope1.getOwnReferenceNames(), 0);
            assert.equal(rootScope.countReferences(), 1);
            assert.equal(rootScope.countOwnReferences(), 1);
            assert.sameMembers(rootScope.getReferenceNames(), ['a']);
            assert.sameMembers(rootScope.getOwnReferenceNames(), ['a']);

            rootScope.removeOwnReference('a');
            assert.equal(childScope2.countReferences(), 0);
            assert.equal(childScope2.countOwnReferences(), 0);
            assert.lengthOf(childScope2.getReferenceNames(), 0);
            assert.lengthOf(childScope2.getOwnReferenceNames(), 0);
            assert.equal(childScope1.countReferences(), 0);
            assert.equal(childScope1.countOwnReferences(), 0);
            assert.lengthOf(childScope2.getReferenceNames(), 0);
            assert.lengthOf(childScope2.getOwnReferenceNames(), 0);
            assert.equal(rootScope.countReferences(), 0);
            assert.equal(rootScope.countOwnReferences(), 0);
            assert.lengthOf(childScope2.getReferenceNames(), 0);
            assert.lengthOf(childScope2.getOwnReferenceNames(), 0);

            rootScope.setOwnReference('a', 'someValue');
            rootScope.setOwnReference('b', 'someValue');
            childScope1.setOwnReference('a', 'someValue2');
            childScope1.setOwnReference('b', 'someValue3');
            childScope2.setOwnReference('a', 'someValue4');
            childScope2.setOwnReference('b', 'someValue4');
            childScope2.removeOwnReference('a');
            assert.equal(childScope2.countReferences(), 2);
            assert.equal(childScope2.countOwnReferences(), 1);
            assert.equal(childScope1.countReferences(), 2);
            assert.equal(childScope1.countOwnReferences(), 2);
            assert.equal(rootScope.countReferences(), 2);
            assert.equal(rootScope.countOwnReferences(), 2);

            childScope2.removeNearReference('a');
            assert.equal(childScope2.countReferences(), 2);
            assert.equal(childScope2.countOwnReferences(), 1);
            assert.equal(childScope1.countReferences(), 2);
            assert.equal(childScope1.countOwnReferences(), 1);
            assert.equal(rootScope.countReferences(), 2);
            assert.equal(rootScope.countOwnReferences(), 2);

            childScope2.removeNearReference('a');
            assert.equal(childScope2.countReferences(), 1);
            assert.equal(childScope2.countOwnReferences(), 1);
            assert.equal(childScope1.countReferences(), 1);
            assert.equal(childScope1.countOwnReferences(), 1);
            assert.equal(rootScope.countReferences(), 1);
            assert.equal(rootScope.countOwnReferences(), 1);

            childScope2.removeReference('b');
            assert.equal(childScope2.countReferences(), 0);
            assert.equal(childScope2.countOwnReferences(), 0);
            assert.equal(childScope1.countReferences(), 0);
            assert.equal(childScope1.countOwnReferences(), 0);
            assert.equal(rootScope.countReferences(), 0);
            assert.equal(rootScope.countOwnReferences(), 0);
        });
    });
});
