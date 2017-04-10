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
});
