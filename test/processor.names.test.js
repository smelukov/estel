var parser = require('../lib/parser');
var assert = require('chai').assert;
var Scope = require('../lib/scope');
var process = require('../lib/namesProcessor');

describe('Processor.names', function() {
    var rootScope;

    beforeEach(function() {
        rootScope = new Scope();
    });

    describe('var', function() {
        it('simple case', function() {
            process(parser.parse('var a = 10, b = 20, c; var d = 30;'), rootScope);
            assert.equal(rootScope.countReferences(), 4);
            assert.equal(rootScope.scopes.length, 0);

            assert.isTrue(rootScope.hasOwnReference('a'));
            assert.isTrue(rootScope.hasOwnReference('b'));
            assert.isTrue(rootScope.hasOwnReference('c'));
            assert.isTrue(rootScope.hasOwnReference('d'));
        });

        it('inside if', function() {
            process(parser.parse('var a = 10; if (1) { var a = 20; var b = 30; }'), rootScope);
            assert.equal(rootScope.countReferences(), 2);
            assert.equal(rootScope.countOwnReferences(), 2);
            assert.equal(rootScope.scopes.length, 1);

            assert.isTrue(rootScope.hasOwnReference('a'));
            assert.isTrue(rootScope.hasOwnReference('b'));

            var childScope = rootScope.scopes[0];

            assert.equal(childScope.countReferences(), 2);
            assert.equal(childScope.countOwnReferences(), 0);
            assert.equal(childScope.scopes.length, 0);
        });

        it('inside for', function() {
            process(parser.parse('var a = 10; for(var i = 0; i < 2; i++){ var b = 20; }'), rootScope);
            assert.equal(rootScope.countReferences(), 3);
            assert.equal(rootScope.countOwnReferences(), 3);
            assert.equal(rootScope.scopes.length, 1);

            assert.isTrue(rootScope.hasOwnReference('a'));
            assert.isTrue(rootScope.hasOwnReference('b'));
            assert.isTrue(rootScope.hasOwnReference('i'));

            var forScope = rootScope.scopes[0];

            assert.equal(forScope.countReferences(), 3);
            assert.equal(forScope.countOwnReferences(), 0);
            assert.equal(forScope.scopes.length, 1);

            var forBodyScope = forScope.scopes[0];

            assert.equal(forBodyScope.countReferences(), 3);
            assert.equal(forBodyScope.countOwnReferences(), 0);
            assert.equal(forBodyScope.scopes.length, 0);
        });

        it('inside while', function() {
            process(parser.parse('var a = 10; while(1){ var b = 20; }'), rootScope);
            assert.equal(rootScope.countReferences(), 2);
            assert.equal(rootScope.scopes.length, 1);

            assert.isTrue(rootScope.hasOwnReference('a'));
            assert.isTrue(rootScope.hasOwnReference('b'));

            var whileBodyScope = rootScope.scopes[0];

            assert.equal(whileBodyScope.countReferences(), 2);
            assert.equal(whileBodyScope.countOwnReferences(), 0);
            assert.equal(whileBodyScope.scopes.length, 0);
        });

        it('inside switch', function() {
            process(parser.parse('switch(1){ case 1: var a = 10; case 2: var b = 20; }'), rootScope);
            assert.equal(rootScope.countReferences(), 2);
            assert.equal(rootScope.scopes.length, 1);

            assert.isTrue(rootScope.hasOwnReference('a'));
            assert.isTrue(rootScope.hasOwnReference('b'));

            var switchScope = rootScope.scopes[0];

            assert.equal(switchScope.countReferences(), 2);
            assert.equal(switchScope.countOwnReferences(), 0);
            assert.equal(switchScope.scopes.length, 0);
        });
    });

    describe('let/const', function() {
        it('simple case', function() {
            process(parser.parse('let a = 10, b; const c = 20, d = 30;'), rootScope);
            assert.equal(rootScope.countReferences(), 4);
            assert.equal(rootScope.scopes.length, 0);

            assert.isTrue(rootScope.hasOwnReference('a'));
            assert.isTrue(rootScope.hasOwnReference('b'));
            assert.isTrue(rootScope.hasOwnReference('c'));
            assert.isTrue(rootScope.hasOwnReference('d'));
        });

        it('inside if', function() {
            process(parser.parse('var a = 10; if (1) { let a = 20; const b = 30; var c = 40; }'), rootScope);
            assert.equal(rootScope.countReferences(), 2);
            assert.equal(rootScope.countOwnReferences(), 2);
            assert.equal(rootScope.scopes.length, 1);

            assert.isTrue(rootScope.hasOwnReference('a'));
            assert.isTrue(rootScope.hasOwnReference('c'));

            var childScope = rootScope.scopes[0];

            assert.equal(childScope.countReferences(), 3);
            assert.equal(childScope.countOwnReferences(), 2);
            assert.equal(childScope.scopes.length, 0);

            assert.isTrue(childScope.hasOwnReference('a'));
            assert.isTrue(childScope.hasOwnReference('b'));
        });

        it('inside for', function() {
            process(parser.parse('for(let i = 0; i < 2; i++){ let b = 20; const c = 30 }'), rootScope);
            assert.equal(rootScope.countReferences(), 0);
            assert.equal(rootScope.scopes.length, 1);

            var forScope = rootScope.scopes[0];

            assert.equal(forScope.countReferences(), 1);
            assert.equal(forScope.countOwnReferences(), 1);
            assert.equal(forScope.scopes.length, 1);

            assert.isTrue(forScope.hasOwnReference('i'));

            var forBodyScope = forScope.scopes[0];

            assert.equal(forBodyScope.countReferences(), 3);
            assert.equal(forBodyScope.countOwnReferences(), 2);
            assert.equal(forBodyScope.scopes.length, 0);

            assert.equal(forBodyScope.countReferences(), 3);
            assert.equal(forBodyScope.countOwnReferences(), 2);
            assert.equal(forBodyScope.scopes.length, 0);

            assert.isTrue(forBodyScope.hasOwnReference('b'));
            assert.isTrue(forBodyScope.hasOwnReference('c'));
        });

        it('inside while', function() {
            process(parser.parse('while(1){ let a = 10; const b = 20; var c = 30; }'), rootScope);
            assert.equal(rootScope.countReferences(), 1);
            assert.equal(rootScope.scopes.length, 1);

            assert.isTrue(rootScope.hasOwnReference('c'));

            var whileBodyScope = rootScope.scopes[0];

            assert.equal(whileBodyScope.countReferences(), 3);
            assert.equal(whileBodyScope.countOwnReferences(), 2);
            assert.equal(whileBodyScope.scopes.length, 0);

            assert.isTrue(whileBodyScope.hasOwnReference('a'));
            assert.isTrue(whileBodyScope.hasOwnReference('b'));
        });

        it('inside catch', function() {
            process(parser.parse('try { var a = 10; let b = 20; } catch(e) { var c = 30; let d = 40; }'), rootScope);
            assert.equal(rootScope.countReferences(), 2);
            assert.equal(rootScope.scopes.length, 2);

            assert.isTrue(rootScope.hasOwnReference('a'));
            assert.isTrue(rootScope.hasOwnReference('c'));

            var tryScope = rootScope.scopes[0];

            assert.equal(tryScope.countReferences(), 3);
            assert.equal(tryScope.countOwnReferences(), 1);
            assert.equal(tryScope.scopes.length, 0);

            assert.isTrue(tryScope.hasOwnReference('b'));

            var catchScope = rootScope.scopes[1];

            assert.equal(catchScope.countReferences(), 4);
            assert.equal(catchScope.countOwnReferences(), 2);
            assert.equal(catchScope.scopes.length, 0);

            assert.isTrue(catchScope.hasOwnReference('d'));
            assert.isTrue(catchScope.hasOwnReference('e'));
        });

        describe('inside switch', function() {
            it('without block', function() {
                process(parser.parse('switch(1){ case 1: var a = 10; let b = 20; case 2: const c = 30; }'), rootScope);
                assert.equal(rootScope.countReferences(), 1);
                assert.equal(rootScope.scopes.length, 1);

                assert.isTrue(rootScope.hasOwnReference('a'));

                var switchBodyScope = rootScope.scopes[0];

                assert.equal(switchBodyScope.countReferences(), 3);
                assert.equal(switchBodyScope.countOwnReferences(), 2);
                assert.equal(switchBodyScope.scopes.length, 0);

                assert.isTrue(switchBodyScope.hasOwnReference('b'));
                assert.isTrue(switchBodyScope.hasOwnReference('c'));
            });

            it('with block', function() {
                var code = '\
                    switch(1) {\
                        case 1: { var a = 10; let b = 20; }\
                        case 2: const c = 30;\
                    }';

                process(parser.parse(code), rootScope);
                assert.equal(rootScope.countReferences(), 1);
                assert.equal(rootScope.countOwnReferences(), 1);
                assert.equal(rootScope.scopes.length, 1);

                assert.isTrue(rootScope.hasOwnReference('a'));

                var switchBodyScope = rootScope.scopes[0];

                assert.equal(switchBodyScope.countReferences(), 2);
                assert.equal(switchBodyScope.countOwnReferences(), 1);
                assert.equal(switchBodyScope.scopes.length, 1);

                assert.isTrue(switchBodyScope.hasOwnReference('c'));

                var case1BodyScope = switchBodyScope.scopes[0];

                assert.equal(case1BodyScope.countReferences(), 3);
                assert.equal(case1BodyScope.countOwnReferences(), 1);
                assert.equal(case1BodyScope.scopes.length, 0);

                assert.isTrue(case1BodyScope.hasOwnReference('b'));
            });
        });
    });

    describe('function', function() {
        it('declaration', function() {
            var code = '\
                var a = 10;\
                function F1() { }\
                function F3() { }\
                ';

            process(parser.parse(code), rootScope);
            assert.equal(rootScope.countReferences(), 3);
            assert.equal(rootScope.countOwnReferences(), 3);
            assert.equal(rootScope.scopes.length, 0);

            assert.isTrue(rootScope.hasOwnReference('a'));

            assert.isTrue(rootScope.hasOwnReference('F1'));
            assert.isTrue(rootScope.hasOwnReference('F3'));
        });

        it('expression', function() {
            var code = '\
                var a = 10;\
                var F1 = function () { };\
                var F3 = function F3Private() { }\
                ';

            process(parser.parse(code), rootScope);
            assert.equal(rootScope.countReferences(), 3);
            assert.equal(rootScope.countOwnReferences(), 3);
            assert.equal(rootScope.scopes.length, 0);

            assert.isTrue(rootScope.hasOwnReference('a'));
            assert.isTrue(rootScope.hasOwnReference('F1'));
            assert.isTrue(rootScope.hasOwnReference('F3'));
        });

        it('iife', function() {
            var code = '\
                (function F1() {\
                    var a = 10;\
                    function F2() { }\
                    var F3 = function F3Private() { }\
                })()\
                ';

            process(parser.parse(code), rootScope);
            assert.equal(rootScope.countReferences(), 0);
            assert.equal(rootScope.countOwnReferences(), 0);
            assert.equal(rootScope.scopes.length, 0);
        });

        it('arrow function', function() {
            var code = '\
                var a = 10;\
                var F2 = () => { };\
                var F3 = () => { }\
                ';

            process(parser.parse(code), rootScope);
            assert.equal(rootScope.countReferences(), 3);
            assert.equal(rootScope.countOwnReferences(), 3);
            assert.equal(rootScope.scopes.length, 0);
        });

    });

    describe('class', function() {
        it('declaration', function() {
            var code = '\
                var a = 10;\
                class C1 { }\
                ';

            process(parser.parse(code), rootScope);
            assert.equal(rootScope.countReferences(), 2);
            assert.equal(rootScope.countOwnReferences(), 2);
            assert.equal(rootScope.scopes.length, 1);

            assert.isTrue(rootScope.hasOwnReference('a'));
            assert.isTrue(rootScope.hasOwnReference('C1'));
        });

        it('expression', function() {
            var code = '\
                var a = 10;\
                var C1 = class C1Private { }\
                ';

            process(parser.parse(code), rootScope);
            assert.equal(rootScope.countReferences(), 2);
            assert.equal(rootScope.countOwnReferences(), 2);
            assert.equal(rootScope.scopes.length, 1);

            assert.isTrue(rootScope.hasOwnReference('a'));
            assert.isTrue(rootScope.hasOwnReference('C1'));
            assert.isTrue(rootScope.scopes[0].hasOwnReference('C1Private'));
        });

        it('hoisting', function() {
            var code = '\
                if(1) {\
                    class C1 { }\
                }\
                ';

            process(parser.parse(code), rootScope);
            assert.equal(rootScope.countReferences(), 0);
            assert.equal(rootScope.countOwnReferences(), 0);
            assert.equal(rootScope.scopes.length, 1);

            var ifScope = rootScope.scopes[0];

            assert.equal(ifScope.countReferences(), 1);
            assert.equal(ifScope.countOwnReferences(), 1);
            assert.equal(ifScope.scopes.length, 1);
        });
    });

    describe('import', function() {
        it('ImportSpecifier', function() {
            var code = 'import {a, b, c as d} from \'some\'';

            process(parser.parse(code, { sourceType: 'module' }), rootScope);
            assert.equal(rootScope.countReferences(), 3);
            assert.equal(rootScope.countOwnReferences(), 3);

            assert.isTrue(rootScope.hasOwnReference('a'));
            assert.isTrue(rootScope.hasOwnReference('b'));
            assert.isTrue(rootScope.hasOwnReference('d'));
        });

        it('ImportDefaultSpecifier', function() {
            var code = 'import a from \'some\'';

            process(parser.parse(code, { sourceType: 'module' }), rootScope);
            assert.equal(rootScope.countReferences(), 1);
            assert.equal(rootScope.countOwnReferences(), 1);

            assert.isTrue(rootScope.hasOwnReference('a'));
        });

        it('ImportNamespaceSpecifier', function() {
            var code = 'import * as a from \'some\'';

            process(parser.parse(code, { sourceType: 'module' }), rootScope);
            assert.equal(rootScope.countReferences(), 1);
            assert.equal(rootScope.countOwnReferences(), 1);

            assert.isTrue(rootScope.hasOwnReference('a'));
        });
    });
});
