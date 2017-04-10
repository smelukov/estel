var esprima = require('esprima');
var Syntax = require('esprima').Syntax;
var assert = require('chai').assert;
var Scope = require('../lib/scope');
var processNames = require('../lib/namesProcessor');
var processValues = require('../lib/valuesProcessor');

describe('Processor.values', function() {
    var rootScope;

    beforeEach(function() {
        rootScope = new Scope();
    });

    describe('var declaration', function() {
        it('empty declaration', function() {
            var code = 'var a; var b';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').token.type, Syntax.Identifier);
            assert.equal(rootScope.getReference('a').token.name, 'undefined');
            assert.equal(rootScope.getReference('b').token.type, Syntax.Identifier);
            assert.equal(rootScope.getReference('b').token.name, 'undefined');
        });

        it('assignment literal', function() {
            var code = 'var a = 10; var b = 20';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').token.value, 10);
            assert.equal(rootScope.getReference('b').token.value, 20);
        });

        it('assignment identifier', function() {
            var code = 'var a = 10; var b = a';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').token.value, 10);
            assert.equal(rootScope.getReference('b').token.value, 10);
        });
    });

    describe('assignment', function() {
        it('assignment literal', function() {
            var code = 'var a = 10; var b; b = 20';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').token.value, 10);
            assert.equal(rootScope.getReference('b').token.value, 20);
        });

        it('assignment identifier', function() {
            var code = 'var a = 10; var b; b = a';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').token.value, 10);
            assert.equal(rootScope.getReference('b').token.value, 10);
        });

        it('auto create left reference', function() {
            var code = 'a = 10';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').token.value, 10);
        });

        it('assignment from undefined reference', function() {
            var code = 'var a = b';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.isFalse(rootScope.hasReference('b'));
            assert.equal(rootScope.getReference('a').token.type, Syntax.Identifier);
            assert.equal(rootScope.getReference('a').token.name, 'undefined');
        });
    });

    describe('object expression', function() {
        it('creation', function() {
            var code = 'var obj = { }';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.property(rootScope.getReference('obj').token, 'obj');
            assert.isObject(rootScope.getReference('obj').token.obj);
        });

        it('key - literal, value - literal', function() {
            var code = 'var obj = { 0: 10, 1: 20 }';
            var ast = esprima.parse(code);
            var obj;

            processNames(ast, rootScope);
            processValues(ast);

            obj = rootScope.getReference('obj').token.obj;

            assert.deepEqual(obj, { 0: 10, 1: 20 });
        });

        it('key - identifier, value - literal', function() {
            var code = 'var obj = { a: 10, b: 20 }';
            var ast = esprima.parse(code);
            var obj;

            processNames(ast, rootScope);
            processValues(ast);

            obj = rootScope.getReference('obj').token.obj;

            assert.deepEqual(obj, { a: 10, b: 20 });
        });

        it('key - identifier, value - identifier', function() {
            var code = 'var a = 10, b = 20; var obj = { a: a, b }';
            var ast = esprima.parse(code);
            var obj;

            processNames(ast, rootScope);
            processValues(ast);

            obj = rootScope.getReference('obj').token.obj;

            assert.deepEqual(obj, { a: 10, b: 20 });
        });

        it('key - computed, value - identifier', function() {
            var code = 'var a = 10, b = 20; var obj = { [a]: a, b }';
            var ast = esprima.parse(code);
            var obj;

            processNames(ast, rootScope);
            processValues(ast);

            obj = rootScope.getReference('obj').token.obj;

            assert.deepEqual(obj, { 10: 10, b: 20 });
        });

        it('key - identifier, value - object expression', function() {
            var code = 'var a = 10, b = 20; var obj = { a: { a, b } }';
            var ast = esprima.parse(code);
            var obj;

            processNames(ast, rootScope);
            processValues(ast);

            obj = rootScope.getReference('obj').token.obj;

            assert.deepEqual(obj, { a: { a: 10, b: 20 } });
        });

        it('key - undefined identifier, value - undefined identifier', function() {
            var code = 'var obj = { [a]: a, b }';
            var ast = esprima.parse(code);
            var obj;

            processNames(ast, rootScope);
            processValues(ast);

            obj = rootScope.getReference('obj').token.obj;

            assert.deepEqual(obj, { undefined: undefined, b: undefined });
        });
    });
});
