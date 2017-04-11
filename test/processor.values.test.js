var esprima = require('esprima');
var Syntax = require('esprima').Syntax;
var assert = require('chai').assert;
var Scope = require('../lib/scope');
var processNames = require('../lib/namesProcessor');
var processValues = require('../lib/valuesProcessor');
var resolver = require('../lib/valueResolver');

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

        it('assignment form member expression', function() {
            var code = 'var a = { b: 1, c: { d: 1, e: 2 } }; var b = a.c.d';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('b').token.type, Syntax.MemberExpression);
        });

        it('assignment form object', function() {
            var code = 'var a = { b: 1, c: { d: 1, e: 2 } }, b = a, c = b.c.d';
            var ast = esprima.parse(code);
            var result;

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('b').token.type, Syntax.ObjectExpression);
            assert.deepEqual(rootScope.getReference('b').token.obj, { b: 1, c: { d: 1, e: 2 } });

            assert.equal(rootScope.getReference('c').token.type, Syntax.MemberExpression);
            result = resolver.resolveToken(rootScope.getReference('c').token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 1);
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

        it('assignment literal to member expression', function() {
            var code = 'var a = { b: 1, c: { d: 1, e: 2 } }; a.c.d = 20; var b = a.c.d;';
            var ast = esprima.parse(code);
            var result;

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('a').token.obj, { b: 1, c: { d: 20, e: 2 } });
            result = resolver.resolveToken(rootScope.getReference('b').token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 20);
        });

        it('assignment literal to computed (literal) member expression', function() {
            var code = 'var a = { b: 1, 1: { d: 1, e: 2 } }; a[1].d = 20; var b = a[1].d;';
            var ast = esprima.parse(code);
            var result;

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('a').token.obj, { b: 1, 1: { d: 20, e: 2 } });
            result = resolver.resolveToken(rootScope.getReference('b').token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 20);
        });

        it('assignment literal to computed (literal - last) member expression', function() {
            var code = 'var a = { b: 1, c: { 1: 1, e: 2 } }; a.c[1] = 20; var b = a.c[1];';
            var ast = esprima.parse(code);
            var result;

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('a').token.obj, { b: 1, c: { 1: 20, e: 2 } });
            result = resolver.resolveToken(rootScope.getReference('b').token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 20);
        });

        it('assignment identifier to member expression', function() {
            var code = 'var a = { b: 1, c: { d: 1, e: 2 } }, newValue = 20; a.c.d = newValue; var b = a.c.d;';
            var ast = esprima.parse(code);
            var result;

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('a').token.obj, { b: 1, c: { d: 20, e: 2 } });
            result = resolver.resolveToken(rootScope.getReference('b').token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 20);
        });

        it('assignment identifier to undefined member expression', function() {
            var code = 'var a = { b: 1, c: { d: 1, e: 2 } }, newValue = 20; a.e.d = newValue; var b = a.e.d;';
            var ast = esprima.parse(code);
            var result;

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('a').token.obj, { b: 1, c: { d: 1, e: 2 } });
            result = resolver.resolveToken(rootScope.getReference('b').token);
            assert.isFalse(result.resolved);
        });

        it('assignment identifier to computed (identifier) member expression', function() {
            var code = 'var a = { b: 1, c: { d: 1, e: 2 } },\
                prop = \'c\';\
                newValue = 20;\
                a[prop].d = newValue;\
                var b = a[prop].d;';
            var ast = esprima.parse(code);
            var result;

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('a').token.obj, { b: 1, c: { d: 20, e: 2 } });
            result = resolver.resolveToken(rootScope.getReference('b').token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 20);
        });

        it('assignment identifier to computed (identifier - last) member expression', function() {
            var code = 'var a = { b: 1, c: { d: 1, e: 2 } },\
                prop = \'d\';\
                newValue = 20;\
                a.c[prop] = newValue;\
                var b = a.c[prop];';
            var ast = esprima.parse(code);
            var result;

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('a').token.obj, { b: 1, c: { d: 20, e: 2 } });
            result = resolver.resolveToken(rootScope.getReference('b').token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 20);
        });

        it('assignment object (literal) to member expression', function() {
            var code = '\
                var a = { b: 1, c: { d: 2 } };\
                a.c.d = { e: 20, f: 30 };\
                var b = a.c.d,\
                    c = a.c.d.e';
            var ast = esprima.parse(code);
            var result;

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('a').token.obj, { b: 1, c: { d: { e: 20, f: 30 } } });
            result = resolver.resolveToken(rootScope.getReference('b').token);
            assert.isTrue(result.resolved);
            assert.deepEqual(result.value, { e: 20, f: 30 });
            result = resolver.resolveToken(rootScope.getReference('c').token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 20);
        });

        it('assignment object (identifier) to member expression', function() {
            var code = '\
                var a = { b: 1, c: { d: 2 } },\
                newValue = { e: 20, f: 30 };\
                a.c.d = newValue;\
                var b = a.c.d,\
                    c = a.c.d.e';
            var ast = esprima.parse(code);
            var result;

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('a').token.obj, { b: 1, c: { d: { e: 20, f: 30 } } });
            result = resolver.resolveToken(rootScope.getReference('b').token);
            assert.isTrue(result.resolved);
            assert.deepEqual(result.value, { e: 20, f: 30 });
            result = resolver.resolveToken(rootScope.getReference('c').token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 20);
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
            var result;

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('obj1').token.obj, { b: 10, c: { d: 20 } });
            assert.deepEqual(rootScope.getReference('obj2').token.obj, { e: { d: 20 }, f: { g: 20, h: 100 } });
            result = resolver.resolveToken(rootScope.getReference('a').token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 20);
            result = resolver.resolveToken(rootScope.getReference('b').token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 20);
            result = resolver.resolveToken(rootScope.getReference('c').token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 100);
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

        it('multi assignment - literal;', function() {
            var code = 'a = b = c = 1';
            var ast = esprima.parse(code);
            var result;

            processNames(ast, rootScope);
            processValues(ast);

            result = resolver.resolveToken(rootScope.getReference('a').token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 1);

            result = resolver.resolveToken(rootScope.getReference('b').token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 1);

            result = resolver.resolveToken(rootScope.getReference('c').token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 1);
        });

        it('multi assignment - identifier;', function() {
            var code = 'a = 1; b = c = d = a';
            var ast = esprima.parse(code);
            var result;

            processNames(ast, rootScope);
            processValues(ast);

            result = resolver.resolveToken(rootScope.getReference('a').token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 1);

            result = resolver.resolveToken(rootScope.getReference('b').token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 1);

            result = resolver.resolveToken(rootScope.getReference('c').token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 1);

            result = resolver.resolveToken(rootScope.getReference('d').token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 1);
        });

        it('multi assignment - member expression', function() {
            var code = 'var obj = { a: { b: 1 } }; a = b = obj.a.b = c = 10; d = obj.a.b';
            var ast = esprima.parse(code);
            var result;

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('obj').token.obj, { a: { b: 10 } });

            result = resolver.resolveToken(rootScope.getReference('a').token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 10);

            result = resolver.resolveToken(rootScope.getReference('b').token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 10);

            result = resolver.resolveToken(rootScope.getReference('c').token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 10);

            result = resolver.resolveToken(rootScope.getReference('d').token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 10);
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

    describe('value resolver', function() {
        it('resolve literal', function() {
            var code = 'var a = 1';
            var ast = esprima.parse(code);
            var token;
            var result;

            processNames(ast, rootScope);
            processValues(ast);

            token = rootScope.getReference('a').token;
            result = resolver.resolveToken(token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 1);
        });

        it('resolve identifier', function() {
            var code = 'var a = 1, b = a, c = b;';
            var ast = esprima.parse(code);
            var token;
            var result;

            processNames(ast, rootScope);
            processValues(ast);

            token = rootScope.getReference('c').token;
            result = resolver.resolveToken(token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 1);
        });

        it('resolve undefined identifier', function() {
            var code = 'var a = b;';
            var ast = esprima.parse(code);
            var token;
            var result;

            processNames(ast, rootScope);
            processValues(ast);

            token = rootScope.getReference('a').token;
            result = resolver.resolveToken(token);
            assert.isFalse(result.resolved);
            assert.isUndefined(result.value);
        });

        it('resolve member expression', function() {
            var code = 'var a = { b: 1, c: { d: 2, e: 3 } }, b = a.c.e, c = a.c;';
            var ast = esprima.parse(code);
            var token;
            var result;

            processNames(ast, rootScope);
            processValues(ast);

            token = rootScope.getReference('b').token;
            result = resolver.resolveToken(token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 3);

            token = rootScope.getReference('c').token;
            result = resolver.resolveToken(token);
            assert.isTrue(result.resolved);
            assert.deepEqual(result.value, { d: 2, e: 3 });
        });

        it('resolve computed member expression - literal', function() {
            var code = 'var obj = { 0: 1, 1: { a: 2, b: 3 } }, a = obj[0], b = obj[\'1\'], c = obj[1].b';
            var ast = esprima.parse(code);
            var token;
            var result;

            processNames(ast, rootScope);
            processValues(ast);

            token = rootScope.getReference('a').token;
            result = resolver.resolveToken(token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 1);

            token = rootScope.getReference('b').token;
            result = resolver.resolveToken(token);
            assert.isTrue(result.resolved);
            assert.deepEqual(result.value, { a: 2, b: 3 });

            token = rootScope.getReference('c').token;
            result = resolver.resolveToken(token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 3);
        });

        it('resolve computed member expression - identifier', function() {
            var code = '\
                var obj = { 0: 1, 1: { a: 2, b: 3 } },\
                    prop0 = 0,\
                    prop1 = 1,\
                    a = obj[prop0],\
                    b = obj[prop1],\
                    c = obj[prop1].b';
            var ast = esprima.parse(code);
            var token;
            var result;

            processNames(ast, rootScope);
            processValues(ast);

            token = rootScope.getReference('a').token;
            result = resolver.resolveToken(token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 1);

            token = rootScope.getReference('b').token;
            result = resolver.resolveToken(token);
            assert.isTrue(result.resolved);
            assert.deepEqual(result.value, { a: 2, b: 3 });

            token = rootScope.getReference('c').token;
            result = resolver.resolveToken(token);
            assert.isTrue(result.resolved);
            assert.strictEqual(result.value, 3);
        });

        it('resolve undefined key in member expression', function() {
            var code = 'var a = { b: 1 }, b = a.c.e, c = a.c;';
            var ast = esprima.parse(code);
            var token;
            var result;

            processNames(ast, rootScope);
            processValues(ast);

            token = rootScope.getReference('b').token;
            result = resolver.resolveToken(token);
            assert.isFalse(result.resolved);

            token = rootScope.getReference('c').token;
            result = resolver.resolveToken(token);
            assert.isFalse(result.resolved);
        });

        it('resolve undefined member expression', function() {
            var code = 'var a = b.c.d;';
            var ast = esprima.parse(code);
            var token;
            var result;

            processNames(ast, rootScope);
            processValues(ast);

            token = rootScope.getReference('a').token;
            result = resolver.resolveToken(token);
            assert.isFalse(result.resolved);
        });
    });
});
