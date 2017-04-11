var esprima = require('esprima');
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

            assert.isUndefined(rootScope.getReference('a').value);
            assert.isUndefined(rootScope.getReference('b').value);
        });

        it('assignment literal', function() {
            var code = 'var a = 10; var b = 20';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').value, 10);
            assert.equal(rootScope.getReference('b').value, 20);
        });

        it('assignment identifier', function() {
            var code = 'var a = 10; var b = a';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').value, 10);
            assert.equal(rootScope.getReference('b').value, 10);
        });

        it('assignment form member expression', function() {
            var code = 'var a = { b: 1, c: { d: 1, e: 2 } }; var b = a.c.d';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('b').value, 1);
        });

        it('assignment form object', function() {
            var code = 'var a = { b: 1, c: { d: 1, e: 2 } }, b = a, c = b.c.d';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('b').value, { b: 1, c: { d: 1, e: 2 } });
            assert.strictEqual(rootScope.getReference('c').value, 1);
        });
    });

    describe('assignment', function() {
        it('assignment literal', function() {
            var code = 'var a = 10; var b; b = 20';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').value, 10);
            assert.equal(rootScope.getReference('b').value, 20);
        });

        it('assignment identifier', function() {
            var code = 'var a = 10; var b; b = a';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').value, 10);
            assert.equal(rootScope.getReference('b').value, 10);
        });

        it('assignment literal to member expression', function() {
            var code = 'var a = { b: 1, c: { d: 1, e: 2 } }; a.c.d = 20; var b = a.c.d;';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('a').value, { b: 1, c: { d: 20, e: 2 } });
            assert.strictEqual(rootScope.getReference('b').value, 20);
        });

        it('assignment literal to computed (literal) member expression', function() {
            var code = 'var a = { b: 1, 1: { d: 1, e: 2 } }; a[1].d = 20; var b = a[1].d;';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('a').value, { b: 1, 1: { d: 20, e: 2 } });
            assert.strictEqual(rootScope.getReference('b').value, 20);
        });

        it('assignment literal to computed (literal - last) member expression', function() {
            var code = 'var a = { b: 1, c: { 1: 1, e: 2 } }; a.c[1] = 20; var b = a.c[1];';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('a').value, { b: 1, c: { 1: 20, e: 2 } });
            assert.strictEqual(rootScope.getReference('b').value, 20);
        });

        it('assignment identifier to member expression', function() {
            var code = 'var a = { b: 1, c: { d: 1, e: 2 } }, newValue = 20; a.c.d = newValue; var b = a.c.d;';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('a').value, { b: 1, c: { d: 20, e: 2 } });
            assert.strictEqual(rootScope.getReference('b').value, 20);
        });

        it('assignment identifier to undefined member expression', function() {
            var code = 'var a = { b: 1, c: { d: 1, e: 2 } }, newValue = 20; a.e.d = newValue; var b = a.e.d;';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('a').value, { b: 1, c: { d: 1, e: 2 } });
            assert.isUndefined(rootScope.getReference('b').value);
        });

        it('assignment identifier to undefined identifier with member expression', function() {
            var code = 'var newValue = 20; a.e.d = newValue; var b = a.e.d;';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.isFalse(rootScope.hasReference('a'));
            assert.isUndefined(rootScope.getReference('b').value);
        });

        it('assignment identifier to computed (identifier) member expression', function() {
            var code = 'var a = { b: 1, c: { d: 1, e: 2 } },\
                prop = \'c\';\
                newValue = 20;\
                a[prop].d = newValue;\
                var b = a[prop].d;';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('a').value, { b: 1, c: { d: 20, e: 2 } });
            assert.strictEqual(rootScope.getReference('b').value, 20);
        });

        it('assignment identifier to computed (identifier - last) member expression', function() {
            var code = 'var a = { b: 1, c: { d: 1, e: 2 } },\
                prop = \'d\';\
                newValue = 20;\
                a.c[prop] = newValue;\
                var b = a.c[prop];';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('a').value, { b: 1, c: { d: 20, e: 2 } });
            assert.strictEqual(rootScope.getReference('b').value, 20);
        });

        it('assignment object (literal) to member expression', function() {
            var code = '\
                var a = { b: 1, c: { d: 2 } };\
                a.c.d = { e: 20, f: 30 };\
                var b = a.c.d,\
                    c = a.c.d.e';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('a').value, { b: 1, c: { d: { e: 20, f: 30 } } });
            assert.deepEqual(rootScope.getReference('b').value, { e: 20, f: 30 });
            assert.strictEqual(rootScope.getReference('c').value, 20);
        });

        it('assignment object (identifier) to member expression', function() {
            var code = '\
                var a = { b: 1, c: { d: 2 } },\
                newValue = { e: 20, f: 30 };\
                a.c.d = newValue;\
                var b = a.c.d,\
                    c = a.c.d.e';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('a').value, { b: 1, c: { d: { e: 20, f: 30 } } });
            assert.deepEqual(rootScope.getReference('b').value, { e: 20, f: 30 });
            assert.strictEqual(rootScope.getReference('c').value, 20);
        });

        it('assignment member expression to member expression', function() {
            var code = '\
                var obj1 = { b: 1, c: { d: 2 } };\
                var obj2 = { e: 3, f: { g: 4 } };\
                obj1.b = 10;\
                obj1.c.d = 20;\
                obj2.e = obj1.c;\
                obj2.f.g = obj1.c.d;\
                obj2.f.h = 100;\
                var a = obj1.c.d;\
                var b = obj2.f.g;\
                var c = obj2.f.h';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('obj1').value, { b: 10, c: { d: 20 } });
            assert.deepEqual(rootScope.getReference('obj2').value, { e: { d: 20 }, f: { g: 20, h: 100 } });
            assert.strictEqual(rootScope.getReference('a').value, 20);
            assert.strictEqual(rootScope.getReference('b').value, 20);
            assert.strictEqual(rootScope.getReference('c').value, 100);
        });

        it('auto create left reference', function() {
            var code = 'a = 10';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').value, 10);
        });

        it('assignment from undefined reference', function() {
            var code = 'var a = b';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.isFalse(rootScope.hasReference('b'));
            assert.isUndefined(rootScope.getReference('a').value);
        });

        it('multi assignment - literal;', function() {
            var code = 'a = b = c = 1';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, 1);
            assert.strictEqual(rootScope.getReference('b').value, 1);
            assert.strictEqual(rootScope.getReference('c').value, 1);
        });

        it('multi assignment - identifier;', function() {
            var code = 'a = 1; b = c = d = a';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, 1);
            assert.strictEqual(rootScope.getReference('b').value, 1);
            assert.strictEqual(rootScope.getReference('c').value, 1);
            assert.strictEqual(rootScope.getReference('d').value, 1);
        });

        it('multi assignment - member expression', function() {
            var code = 'var obj = { a: { b: 1 } }; a = b = obj.a.b = c = 10; d = obj.a.b';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('obj').value, { a: { b: 10 } });

            assert.strictEqual(rootScope.getReference('a').value, 10);
            assert.strictEqual(rootScope.getReference('b').value, 10);
            assert.strictEqual(rootScope.getReference('c').value, 10);
            assert.strictEqual(rootScope.getReference('d').value, 10);
        });
    });

    describe('object expression', function() {
        it('creation', function() {
            var code = 'var obj = { }';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.isObject(rootScope.getReference('obj').value);
        });

        it('key - literal, value - literal', function() {
            var code = 'var obj = { 0: 10, 1: 20 }';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('obj').value, { 0: 10, 1: 20 });
        });

        it('key - identifier, value - literal', function() {
            var code = 'var obj = { a: 10, b: 20 }';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('obj').value, { a: 10, b: 20 });
        });

        it('key - identifier, value - identifier', function() {
            var code = 'var a = 10, b = 20; var obj = { a: a, b }';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('obj').value, { a: 10, b: 20 });
        });

        it('key - computed, value - identifier', function() {
            var code = 'var a = 10, b = 20; var obj = { [a]: a, b }';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('obj').value, { 10: 10, b: 20 });
        });

        it('key - identifier, value - object expression', function() {
            var code = 'var a = 10, b = 20; var obj = { a: { a, b } }';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('obj').value, { a: { a: 10, b: 20 } });
        });

        it('key - undefined identifier, value - undefined identifier', function() {
            var code = 'var obj = { [a]: a, b }';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('obj').value, { undefined: undefined, b: undefined });
        });
    });
});
