var esprima = require('esprima');
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
            process(esprima.parse('var a = 10, b = 20, c; var d = 30;'), rootScope);
            assert.equal(rootScope.countReferences(), 4);
            assert.equal(rootScope.scopes.length, 0);

            assert.isTrue(rootScope.hasOwnReference('a'));
            assert.isTrue(rootScope.hasOwnReference('b'));
            assert.isTrue(rootScope.hasOwnReference('c'));
            assert.isTrue(rootScope.hasOwnReference('d'));
        });

        it('inside if', function() {
            process(esprima.parse('var a = 10; if (1) { var a = 20; var b = 30; }'), rootScope);
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
            process(esprima.parse('var a = 10; for(var i = 0; i < 2; i++){ var b = 20; }'), rootScope);
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
            process(esprima.parse('var a = 10; while(1){ var b = 20; }'), rootScope);
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
            process(esprima.parse('switch(1){ case 1: var a = 10; case 2: var b = 20; }'), rootScope);
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
            process(esprima.parse('let a = 10, b; const c = 20, d = 30;'), rootScope);
            assert.equal(rootScope.countReferences(), 4);
            assert.equal(rootScope.scopes.length, 0);

            assert.isTrue(rootScope.hasOwnReference('a'));
            assert.isTrue(rootScope.hasOwnReference('b'));
            assert.isTrue(rootScope.hasOwnReference('c'));
            assert.isTrue(rootScope.hasOwnReference('d'));
        });

        it('inside if', function() {
            process(esprima.parse('var a = 10; if (1) { let a = 20; const b = 30; var c = 40; }'), rootScope);
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
            process(esprima.parse('for(let i = 0; i < 2; i++){ let b = 20; const c = 30 }'), rootScope);
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
            process(esprima.parse('while(1){ let a = 10; const b = 20; var c = 30; }'), rootScope);
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
            process(esprima.parse('try { var a = 10; let b = 20; } catch(e) { var c = 30; let d = 40; }'), rootScope);
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
                process(esprima.parse('switch(1){ case 1: var a = 10; let b = 20; case 2: const c = 30; }'), rootScope);
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

                process(esprima.parse(code), rootScope);
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
                function F1(b, c) { var d = 20; let e = 30; function F2(f, g) { var h = 40, i = 50; } }\
                function F3(j, k) { var l = 60; if (1) { var m = 70; let n = 80; let a = 90 } }\
                ';

            process(esprima.parse(code), rootScope);
            assert.equal(rootScope.countReferences(), 3);
            assert.equal(rootScope.countOwnReferences(), 3);
            assert.equal(rootScope.scopes.length, 2);

            assert.isTrue(rootScope.hasOwnReference('a'));

            assert.isTrue(rootScope.hasOwnReference('F1'));
            assert.isTrue(rootScope.hasOwnReference('F3'));

            var f1BodyScope = rootScope.scopes[0];

            assert.equal(f1BodyScope.countReferences(), 9);
            assert.equal(f1BodyScope.countOwnReferences(), 6);
            assert.equal(f1BodyScope.scopes.length, 1);

            assert.isTrue(f1BodyScope.hasOwnReference('arguments'));

            assert.isTrue(f1BodyScope.hasOwnReference('b'));
            assert.isTrue(f1BodyScope.getOwnReference('b').isArg);
            assert.equal(f1BodyScope.getOwnReference('b').argIndex, 0);

            assert.isTrue(f1BodyScope.hasOwnReference('c'));
            assert.isTrue(f1BodyScope.getOwnReference('c').isArg);
            assert.equal(f1BodyScope.getOwnReference('c').argIndex, 1);

            assert.isTrue(f1BodyScope.hasOwnReference('d'));
            assert.isTrue(f1BodyScope.hasOwnReference('e'));

            var f2BodyScope = f1BodyScope.scopes[0];

            assert.equal(f2BodyScope.countReferences(), 13);
            assert.equal(f2BodyScope.countOwnReferences(), 5);
            assert.equal(f2BodyScope.scopes.length, 0);

            assert.isTrue(f2BodyScope.hasOwnReference('arguments'));

            assert.isTrue(f2BodyScope.hasOwnReference('f'));
            assert.isTrue(f2BodyScope.getOwnReference('f').isArg);
            assert.equal(f2BodyScope.getOwnReference('f').argIndex, 0);

            assert.isTrue(f2BodyScope.hasOwnReference('g'));
            assert.isTrue(f2BodyScope.getOwnReference('g').isArg);
            assert.equal(f2BodyScope.getOwnReference('g').argIndex, 1);

            assert.isTrue(f2BodyScope.hasOwnReference('h'));
            assert.isTrue(f2BodyScope.hasOwnReference('i'));

            var f3BodyScope = rootScope.scopes[1];

            assert.equal(f3BodyScope.countReferences(), 8);
            assert.equal(f3BodyScope.countOwnReferences(), 5);
            assert.equal(f3BodyScope.scopes.length, 1);

            assert.isTrue(f3BodyScope.hasOwnReference('arguments'));

            assert.isTrue(f3BodyScope.hasOwnReference('j'));
            assert.isTrue(f3BodyScope.getOwnReference('j').isArg);
            assert.equal(f3BodyScope.getOwnReference('j').argIndex, 0);

            assert.isTrue(f3BodyScope.hasOwnReference('k'));
            assert.isTrue(f3BodyScope.getOwnReference('k').isArg);
            assert.equal(f3BodyScope.getOwnReference('k').argIndex, 1);

            assert.isTrue(f3BodyScope.hasOwnReference('l'));
            assert.isTrue(f3BodyScope.hasOwnReference('m'));

            var f3IfBodyScope = f3BodyScope.scopes[0];

            assert.equal(f3IfBodyScope.countReferences(), 9);
            assert.equal(f3IfBodyScope.countOwnReferences(), 2);
            assert.equal(f3IfBodyScope.scopes.length, 0);

            assert.isTrue(f3IfBodyScope.hasOwnReference('n'));
            assert.isTrue(f3IfBodyScope.hasOwnReference('a'));
        });

        it('expression', function() {
            var code = '\
                var a = 10;\
                var F1 = function F1Private(b, c) {\
                    var d = 20; let e = 30; var F2 = function F2Private(f, g) { var h = 40, i = 50; }\
                };\
                var F3 = function F3Private(j, k) { var l = 60; if (1) { var m = 70; let n = 80; let a = 90 } }\
                ';

            process(esprima.parse(code), rootScope);
            assert.equal(rootScope.countReferences(), 3);
            assert.equal(rootScope.countOwnReferences(), 3);
            assert.equal(rootScope.scopes.length, 2);

            assert.isTrue(rootScope.hasOwnReference('a'));
            assert.isTrue(rootScope.hasOwnReference('F1'));
            assert.isTrue(rootScope.hasOwnReference('F3'));

            var f1BodyScope = rootScope.scopes[0];

            assert.equal(f1BodyScope.countReferences(), 10);
            assert.equal(f1BodyScope.countOwnReferences(), 7);
            assert.equal(f1BodyScope.scopes.length, 1);

            assert.isTrue(f1BodyScope.hasOwnReference('F1Private'));
            assert.isTrue(f1BodyScope.hasOwnReference('arguments'));

            assert.isTrue(f1BodyScope.hasOwnReference('b'));
            assert.isTrue(f1BodyScope.getOwnReference('b').isArg);
            assert.equal(f1BodyScope.getOwnReference('b').argIndex, 0);

            assert.isTrue(f1BodyScope.hasOwnReference('c'));
            assert.isTrue(f1BodyScope.getOwnReference('c').isArg);
            assert.equal(f1BodyScope.getOwnReference('c').argIndex, 1);

            assert.isTrue(f1BodyScope.hasOwnReference('d'));
            assert.isTrue(f1BodyScope.hasOwnReference('e'));

            var f2BodyScope = f1BodyScope.scopes[0];

            assert.equal(f2BodyScope.countReferences(), 15);
            assert.equal(f2BodyScope.countOwnReferences(), 6);
            assert.equal(f2BodyScope.scopes.length, 0);

            assert.isTrue(f2BodyScope.hasOwnReference('F2Private'));
            assert.isTrue(f2BodyScope.hasReference('F1Private'));
            assert.isTrue(f2BodyScope.hasOwnReference('arguments'));

            assert.isTrue(f2BodyScope.hasOwnReference('f'));
            assert.isTrue(f2BodyScope.getOwnReference('f').isArg);
            assert.equal(f2BodyScope.getOwnReference('f').argIndex, 0);

            assert.isTrue(f2BodyScope.hasOwnReference('g'));
            assert.isTrue(f2BodyScope.getOwnReference('g').isArg);
            assert.equal(f2BodyScope.getOwnReference('g').argIndex, 1);

            assert.isTrue(f2BodyScope.hasOwnReference('h'));
            assert.isTrue(f2BodyScope.hasOwnReference('i'));

            var f3BodyScope = rootScope.scopes[1];

            assert.equal(f3BodyScope.countReferences(), 9);
            assert.equal(f3BodyScope.countOwnReferences(), 6);
            assert.equal(f3BodyScope.scopes.length, 1);

            assert.isTrue(f3BodyScope.hasOwnReference('F3Private'));
            assert.isTrue(f3BodyScope.hasOwnReference('arguments'));

            assert.isTrue(f3BodyScope.hasOwnReference('j'));
            assert.isTrue(f3BodyScope.getOwnReference('j').isArg);
            assert.equal(f3BodyScope.getOwnReference('j').argIndex, 0);

            assert.isTrue(f3BodyScope.hasOwnReference('k'));
            assert.isTrue(f3BodyScope.getOwnReference('k').isArg);
            assert.equal(f3BodyScope.getOwnReference('k').argIndex, 1);

            assert.isTrue(f3BodyScope.hasOwnReference('l'));
            assert.isTrue(f3BodyScope.hasOwnReference('m'));

            var f3IfBodyScope = f3BodyScope.scopes[0];

            assert.equal(f3IfBodyScope.countReferences(), 10);
            assert.equal(f3IfBodyScope.countOwnReferences(), 2);
            assert.equal(f3IfBodyScope.scopes.length, 0);

            assert.isTrue(f3IfBodyScope.hasOwnReference('n'));
            assert.isTrue(f3IfBodyScope.hasOwnReference('a'));
        });

        it('iife', function() {
            var code = '\
                (function F1() {\
                    var a = 10;\
                    function F2() { }\
                    var F3 = function F3Private(j, k) { var l = 60; if (1) { var m = 70; let n = 80; let a = 90 } }\
                })()\
                ';

            process(esprima.parse(code), rootScope);
            assert.equal(rootScope.countReferences(), 0);
            assert.equal(rootScope.countOwnReferences(), 0);
            assert.equal(rootScope.scopes.length, 1);

            var f1BodyScope = rootScope.scopes[0];

            assert.equal(f1BodyScope.countReferences(), 5);
            assert.equal(f1BodyScope.countOwnReferences(), 5);
            assert.equal(f1BodyScope.scopes.length, 2);

            assert.isTrue(f1BodyScope.hasOwnReference('F1'));
            assert.isTrue(f1BodyScope.hasOwnReference('F2'));
            assert.isTrue(f1BodyScope.hasOwnReference('F3'));
            assert.isTrue(f1BodyScope.hasOwnReference('arguments'));
            assert.isTrue(f1BodyScope.hasOwnReference('a'));

            var f2BodyScope = f1BodyScope.scopes[0];

            assert.equal(f2BodyScope.countReferences(), 5);
            assert.equal(f2BodyScope.countOwnReferences(), 1);
            assert.equal(f2BodyScope.scopes.length, 0);

            var f3BodyScope = f1BodyScope.scopes[1];

            assert.equal(f3BodyScope.countReferences(), 10);
            assert.equal(f3BodyScope.countOwnReferences(), 6);
            assert.equal(f3BodyScope.scopes.length, 1);

            assert.isTrue(f3BodyScope.hasOwnReference('F3Private'));
            assert.isTrue(f3BodyScope.hasOwnReference('arguments'));

            assert.isTrue(f3BodyScope.hasOwnReference('j'));
            assert.isTrue(f3BodyScope.getOwnReference('j').isArg);
            assert.equal(f3BodyScope.getOwnReference('j').argIndex, 0);

            assert.isTrue(f3BodyScope.hasOwnReference('k'));
            assert.isTrue(f3BodyScope.getOwnReference('k').isArg);
            assert.equal(f3BodyScope.getOwnReference('k').argIndex, 1);

            assert.isTrue(f3BodyScope.hasOwnReference('l'));
            assert.isTrue(f3BodyScope.hasOwnReference('m'));

            var f3IfBodyScope = f3BodyScope.scopes[0];

            assert.equal(f3IfBodyScope.countReferences(), 11);
            assert.equal(f3IfBodyScope.countOwnReferences(), 2);
            assert.equal(f3IfBodyScope.scopes.length, 0);

            assert.isTrue(f3IfBodyScope.hasOwnReference('n'));
            assert.isTrue(f3IfBodyScope.hasOwnReference('a'));
        });

        it('arrow function', function() {
            var code = '\
                (function F1() {\
                    var a = 10;\
                    var F2 = () => { };\
                    var F3 = (j, k) => { var l = 60; if (1) { var m = 70; let n = 80; let a = 90 } }\
                })()\
                ';

            process(esprima.parse(code), rootScope);
            assert.equal(rootScope.countReferences(), 0);
            assert.equal(rootScope.countOwnReferences(), 0);
            assert.equal(rootScope.scopes.length, 1);

            var f1BodyScope = rootScope.scopes[0];

            assert.equal(f1BodyScope.countReferences(), 5);
            assert.equal(f1BodyScope.countOwnReferences(), 5);
            assert.equal(f1BodyScope.scopes.length, 2);

            assert.isTrue(f1BodyScope.hasOwnReference('F1'));
            assert.isTrue(f1BodyScope.hasOwnReference('F2'));
            assert.isTrue(f1BodyScope.hasOwnReference('F3'));
            assert.isTrue(f1BodyScope.hasOwnReference('arguments'));

            assert.isTrue(f1BodyScope.hasOwnReference('a'));

            var f2BodyScope = f1BodyScope.scopes[0];

            assert.equal(f2BodyScope.countReferences(), 5);
            assert.equal(f2BodyScope.countOwnReferences(), 0);
            assert.strictEqual(f2BodyScope.getReference('arguments'), f1BodyScope.getOwnReference('arguments'));
            assert.equal(f2BodyScope.scopes.length, 0);

            var f3BodyScope = f1BodyScope.scopes[1];

            assert.equal(f3BodyScope.countReferences(), 9);
            assert.equal(f3BodyScope.countOwnReferences(), 4);
            assert.equal(f3BodyScope.scopes.length, 1);

            assert.strictEqual(f2BodyScope.getReference('arguments'), f1BodyScope.getOwnReference('arguments'));

            assert.isTrue(f3BodyScope.hasOwnReference('j'));
            assert.isTrue(f3BodyScope.getOwnReference('j').isArg);
            assert.equal(f3BodyScope.getOwnReference('j').argIndex, 0);

            assert.isTrue(f3BodyScope.hasOwnReference('k'));
            assert.isTrue(f3BodyScope.getOwnReference('k').isArg);
            assert.equal(f3BodyScope.getOwnReference('k').argIndex, 1);

            assert.isTrue(f3BodyScope.hasOwnReference('l'));
            assert.isTrue(f3BodyScope.hasOwnReference('m'));

            var f3IfBodyScope = f3BodyScope.scopes[0];

            assert.equal(f3IfBodyScope.countReferences(), 10);
            assert.equal(f3IfBodyScope.countOwnReferences(), 2);
            assert.equal(f3IfBodyScope.scopes.length, 0);

            assert.isTrue(f3IfBodyScope.hasOwnReference('n'));
            assert.isTrue(f3IfBodyScope.hasOwnReference('a'));
        });

    });

    describe('class', function() {
        it('declaration', function() {
            var code = '\
                var a = 10;\
                class C1 { m1() { var b = 20; } m2() { var c = 30; } }\
                ';

            process(esprima.parse(code), rootScope);
            assert.equal(rootScope.countReferences(), 2);
            assert.equal(rootScope.countOwnReferences(), 2);
            assert.equal(rootScope.scopes.length, 1);

            assert.isTrue(rootScope.hasOwnReference('a'));
            assert.isTrue(rootScope.hasOwnReference('C1'));

            var classScope = rootScope.scopes[0];

            assert.equal(classScope.countReferences(), 2);
            assert.equal(classScope.countOwnReferences(), 0);
            assert.equal(classScope.scopes.length, 2);

            var m1Scope = classScope.scopes[0];

            assert.equal(m1Scope.countReferences(), 4);
            assert.equal(m1Scope.countOwnReferences(), 2);
            assert.equal(m1Scope.scopes.length, 0);

            assert.isTrue(m1Scope.hasOwnReference('arguments'));
            assert.isTrue(m1Scope.hasOwnReference('b'));

            var m2Scope = classScope.scopes[1];

            assert.equal(m2Scope.countReferences(), 4);
            assert.equal(m2Scope.countOwnReferences(), 2);
            assert.equal(m2Scope.scopes.length, 0);

            assert.isTrue(m2Scope.hasOwnReference('arguments'));
            assert.isTrue(m2Scope.hasOwnReference('c'));
        });

        it('expression', function() {
            var code = '\
                var a = 10;\
                var C1 = class C1Private { m1() { var b = 20; } m2() { var c = 30; } }\
                ';

            process(esprima.parse(code), rootScope);
            assert.equal(rootScope.countReferences(), 2);
            assert.equal(rootScope.countOwnReferences(), 2);
            assert.equal(rootScope.scopes.length, 1);

            assert.isTrue(rootScope.hasOwnReference('a'));
            assert.isTrue(rootScope.hasOwnReference('C1'));

            var classScope = rootScope.scopes[0];

            assert.equal(classScope.countReferences(), 3);
            assert.equal(classScope.countOwnReferences(), 1);
            assert.equal(classScope.scopes.length, 2);
            assert.isTrue(classScope.hasOwnReference('C1Private'));

            var m1Scope = classScope.scopes[0];

            assert.equal(m1Scope.countReferences(), 5);
            assert.equal(m1Scope.countOwnReferences(), 2);
            assert.equal(m1Scope.scopes.length, 0);

            assert.isTrue(m1Scope.hasOwnReference('arguments'));
            assert.isTrue(m1Scope.hasOwnReference('b'));

            var m2Scope = classScope.scopes[1];

            assert.equal(m2Scope.countReferences(), 5);
            assert.equal(m2Scope.countOwnReferences(), 2);
            assert.equal(m2Scope.scopes.length, 0);

            assert.isTrue(m2Scope.hasOwnReference('arguments'));
            assert.isTrue(m2Scope.hasOwnReference('c'));
        });

        it('hoisting', function() {
            var code = '\
                if(1) {\
                    class C1 { m1() { var b = 20; } m2() { var c = 30; } }\
                }\
                ';

            process(esprima.parse(code), rootScope);
            assert.equal(rootScope.countReferences(), 0);
            assert.equal(rootScope.countOwnReferences(), 0);
            assert.equal(rootScope.scopes.length, 1);

            var ifScope = rootScope.scopes[0];

            assert.equal(ifScope.countReferences(), 1);
            assert.equal(ifScope.countOwnReferences(), 1);
            assert.equal(ifScope.scopes.length, 1);

            var classScope = ifScope.scopes[0];

            assert.equal(classScope.countReferences(), 1);
            assert.equal(classScope.countOwnReferences(), 0);
            assert.equal(classScope.scopes.length, 2);

            var m1Scope = classScope.scopes[0];

            assert.equal(m1Scope.countReferences(), 3);
            assert.equal(m1Scope.countOwnReferences(), 2);
            assert.equal(m1Scope.scopes.length, 0);

            assert.isTrue(m1Scope.hasOwnReference('arguments'));
            assert.isTrue(m1Scope.hasOwnReference('b'));
        });
    });

    describe('import', function() {
        // ImportSpecifier
        // ImportDefaultSpecifier
        // ImportNamespaceSpecifier
        it('ImportSpecifier', function() {
            var code = 'import {a, b, c} from \'some\'';

            process(esprima.parse(code), rootScope);
            assert.equal(rootScope.countReferences(), 3);
            assert.equal(rootScope.countOwnReferences(), 3);

            assert.isTrue(rootScope.hasOwnReference('a'));
            assert.isTrue(rootScope.hasOwnReference('b'));
            assert.isTrue(rootScope.hasOwnReference('c'));
        });

        it('ImportDefaultSpecifier', function() {
            var code = 'import a from \'some\'';

            process(esprima.parse(code), rootScope);
            assert.equal(rootScope.countReferences(), 3);
            assert.equal(rootScope.countOwnReferences(), 3);

            assert.isTrue(rootScope.hasOwnReference('a'));
            assert.isTrue(rootScope.hasOwnReference('b'));
            assert.isTrue(rootScope.hasOwnReference('c'));
        });

        it('ImportNamespaceSpecifier', function() {
            var code = 'import * as d from \'some\'';

            process(esprima.parse(code), rootScope);
            assert.equal(rootScope.countReferences(), 3);
            assert.equal(rootScope.countOwnReferences(), 3);

            assert.isTrue(rootScope.hasOwnReference('a'));
            assert.isTrue(rootScope.hasOwnReference('b'));
            assert.isTrue(rootScope.hasOwnReference('c'));
        });
    });
});
