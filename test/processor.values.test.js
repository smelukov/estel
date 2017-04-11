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

        describe('binary expression', function() {
            it('assignment from binary expression - literal', function() {
                var code = '\
                    var a = 2 + 3;\
                    var b = 2 - 3;\
                    var c = 2 * 3;\
                    var d = 2 / 3;\
                    var e = 2 % 3;\
                    var f = 2 ** 3;\
                    var g = 2 << 3;\
                    var h = 2 >> 3;\
                    var i = 2 >>> 3;\
                    var j = 2 & 3;\
                    var k = 2 | 3;\
                    var l = 2 ^ 3;\
                ';
                var ast = esprima.parse(code);

                processNames(ast, rootScope);
                processValues(ast);

                assert.strictEqual(rootScope.getReference('a').value, 2 + 3);
                assert.strictEqual(rootScope.getReference('b').value, 2 - 3);
                assert.strictEqual(rootScope.getReference('c').value, 2 * 3);
                assert.strictEqual(rootScope.getReference('d').value, 2 / 3);
                assert.strictEqual(rootScope.getReference('e').value, 2 % 3);
                assert.strictEqual(rootScope.getReference('f').value, Math.pow(2, 3));
                assert.strictEqual(rootScope.getReference('g').value, 2 << 3);
                assert.strictEqual(rootScope.getReference('h').value, 2 >> 3);
                assert.strictEqual(rootScope.getReference('i').value, 2 >>> 3);
                assert.strictEqual(rootScope.getReference('j').value, 2 & 3);
                assert.strictEqual(rootScope.getReference('k').value, 2 | 3);
                assert.strictEqual(rootScope.getReference('l').value, 2 ^ 3);
            });

            it('assignment from binary expression - identifier', function() {
                var code = '\
                    var left = 2;\
                    var right = 3;\
                    var a = left + right;\
                    var b = left - right;\
                    var c = left * right;\
                    var d = left / right;\
                    var e = left % right;\
                    var f = left ** right;\
                    var g = left << right;\
                    var h = left >> right;\
                    var i = left >>> right;\
                    var j = left & right;\
                    var k = left | right;\
                    var l = left ^ right;\
                ';
                var ast = esprima.parse(code);

                processNames(ast, rootScope);
                processValues(ast);

                assert.strictEqual(rootScope.getReference('a').value, 2 + 3);
                assert.strictEqual(rootScope.getReference('b').value, 2 - 3);
                assert.strictEqual(rootScope.getReference('c').value, 2 * 3);
                assert.strictEqual(rootScope.getReference('d').value, 2 / 3);
                assert.strictEqual(rootScope.getReference('e').value, 2 % 3);
                assert.strictEqual(rootScope.getReference('f').value, Math.pow(2, 3));
                assert.strictEqual(rootScope.getReference('g').value, 2 << 3);
                assert.strictEqual(rootScope.getReference('h').value, 2 >> 3);
                assert.strictEqual(rootScope.getReference('i').value, 2 >>> 3);
                assert.strictEqual(rootScope.getReference('j').value, 2 & 3);
                assert.strictEqual(rootScope.getReference('k').value, 2 | 3);
                assert.strictEqual(rootScope.getReference('l').value, 2 ^ 3);
            });

            it('assignment from binary expression - member expression', function() {
                var code = '\
                    var obj = { a: { b: { c: { d: 2 } } } };\
                    var right = 3;\
                    var a = obj.a.b.c.d + right;\
                    var b = obj.a.b.c.d - right;\
                    var c = obj.a.b.c.d * right;\
                    var d = obj.a.b.c.d / right;\
                    var e = obj.a.b.c.d % right;\
                    var f = obj.a.b.c.d ** right;\
                    var g = obj.a.b.c.d << right;\
                    var h = obj.a.b.c.d >> right;\
                    var i = obj.a.b.c.d >>> right;\
                    var j = obj.a.b.c.d & right;\
                    var k = obj.a.b.c.d | right;\
                    var l = obj.a.b.c.d ^ right;\
                ';
                var ast = esprima.parse(code);

                processNames(ast, rootScope);
                processValues(ast);

                assert.strictEqual(rootScope.getReference('a').value, 2 + 3);
                assert.strictEqual(rootScope.getReference('b').value, 2 - 3);
                assert.strictEqual(rootScope.getReference('c').value, 2 * 3);
                assert.strictEqual(rootScope.getReference('d').value, 2 / 3);
                assert.strictEqual(rootScope.getReference('e').value, 2 % 3);
                assert.strictEqual(rootScope.getReference('f').value, Math.pow(2, 3));
                assert.strictEqual(rootScope.getReference('g').value, 2 << 3);
                assert.strictEqual(rootScope.getReference('h').value, 2 >> 3);
                assert.strictEqual(rootScope.getReference('i').value, 2 >>> 3);
                assert.strictEqual(rootScope.getReference('j').value, 2 & 3);
                assert.strictEqual(rootScope.getReference('k').value, 2 | 3);
                assert.strictEqual(rootScope.getReference('l').value, 2 ^ 3);
            });

            it('assignment from binary expression - dynamic member expression', function() {
                var code = '\
                    var right = 3;\
                    var a = { a: { b: { c: 2 } } }.a.b.c + right;\
                    var b = { a: { b: { c: 2 } } }.a.b.c - right;\
                    var c = { a: { b: { c: 2 } } }.a.b.c * right;\
                    var d = { a: { b: { c: 2 } } }.a.b.c / right;\
                    var e = { a: { b: { c: 2 } } }.a.b.c % right;\
                    var f = { a: { b: { c: 2 } } }.a.b.c ** right;\
                    var g = { a: { b: { c: 2 } } }.a.b.c << right;\
                    var h = { a: { b: { c: 2 } } }.a.b.c >> right;\
                    var i = { a: { b: { c: 2 } } }.a.b.c >>> right;\
                    var j = { a: { b: { c: 2 } } }.a.b.c & right;\
                    var k = { a: { b: { c: 2 } } }.a.b.c | right;\
                    var l = { a: { b: { c: 2 } } }.a.b.c ^ right;\
                ';
                var ast = esprima.parse(code);

                processNames(ast, rootScope);
                processValues(ast);

                assert.strictEqual(rootScope.getReference('a').value, 2 + 3);
                assert.strictEqual(rootScope.getReference('b').value, 2 - 3);
                assert.strictEqual(rootScope.getReference('c').value, 2 * 3);
                assert.strictEqual(rootScope.getReference('d').value, 2 / 3);
                assert.strictEqual(rootScope.getReference('e').value, 2 % 3);
                assert.strictEqual(rootScope.getReference('f').value, Math.pow(2, 3));
                assert.strictEqual(rootScope.getReference('g').value, 2 << 3);
                assert.strictEqual(rootScope.getReference('h').value, 2 >> 3);
                assert.strictEqual(rootScope.getReference('i').value, 2 >>> 3);
                assert.strictEqual(rootScope.getReference('j').value, 2 & 3);
                assert.strictEqual(rootScope.getReference('k').value, 2 | 3);
                assert.strictEqual(rootScope.getReference('l').value, 2 ^ 3);
            });

            it('assignment from multi binary expression - literal', function() {
                var code = '\
                    var a = (1 + 1) + (2 + 1);\
                    var b = (1 + 1) - (2 + 1);\
                    var c = (1 + 1) * (2 + 1);\
                    var d = (1 + 1) / (2 + 1);\
                    var e = (1 + 1) % (2 + 1);\
                    var f = (1 + 1) ** (2 + 1);\
                    var g = (1 + 1) << (2 + 1);\
                    var h = (1 + 1) >> (2 + 1);\
                    var i = (1 + 1) >>> (2 + 1);\
                    var j = (1 + 1) & (2 + 1);\
                    var k = (1 + 1) | (2 + 1);\
                    var l = (1 + 1) ^ (2 + 1);\
                ';
                var ast = esprima.parse(code);

                processNames(ast, rootScope);
                processValues(ast);

                assert.strictEqual(rootScope.getReference('a').value, 2 + 3);
                assert.strictEqual(rootScope.getReference('b').value, 2 - 3);
                assert.strictEqual(rootScope.getReference('c').value, 2 * 3);
                assert.strictEqual(rootScope.getReference('d').value, 2 / 3);
                assert.strictEqual(rootScope.getReference('e').value, 2 % 3);
                assert.strictEqual(rootScope.getReference('f').value, Math.pow(2, 3));
                assert.strictEqual(rootScope.getReference('g').value, 2 << 3);
                assert.strictEqual(rootScope.getReference('h').value, 2 >> 3);
                assert.strictEqual(rootScope.getReference('i').value, 2 >>> 3);
                assert.strictEqual(rootScope.getReference('j').value, 2 & 3);
                assert.strictEqual(rootScope.getReference('k').value, 2 | 3);
                assert.strictEqual(rootScope.getReference('l').value, 2 ^ 3);
            });

            it('assignment from multi binary expression - identifier', function() {
                var code = '\
                    var one = 1;\
                    var two = 2;\
                    var a = (one + one) + (two + one);\
                    var b = (one + one) - (two + one);\
                    var c = (one + one) * (two + one);\
                    var d = (one + one) / (two + one);\
                    var e = (one + one) % (two + one);\
                    var f = (one + one) ** (two + one);\
                    var g = (one + one) << (two + one);\
                    var h = (one + one) >> (two + one);\
                    var i = (one + one) >>> (two + one);\
                    var j = (one + one) & (two + one);\
                    var k = (one + one) | (two + one);\
                    var l = (one + one) ^ (two + one);\
                ';
                var ast = esprima.parse(code);

                processNames(ast, rootScope);
                processValues(ast);

                assert.strictEqual(rootScope.getReference('a').value, 2 + 3);
                assert.strictEqual(rootScope.getReference('b').value, 2 - 3);
                assert.strictEqual(rootScope.getReference('c').value, 2 * 3);
                assert.strictEqual(rootScope.getReference('d').value, 2 / 3);
                assert.strictEqual(rootScope.getReference('e').value, 2 % 3);
                assert.strictEqual(rootScope.getReference('f').value, Math.pow(2, 3));
                assert.strictEqual(rootScope.getReference('g').value, 2 << 3);
                assert.strictEqual(rootScope.getReference('h').value, 2 >> 3);
                assert.strictEqual(rootScope.getReference('i').value, 2 >>> 3);
                assert.strictEqual(rootScope.getReference('j').value, 2 & 3);
                assert.strictEqual(rootScope.getReference('k').value, 2 | 3);
                assert.strictEqual(rootScope.getReference('l').value, 2 ^ 3);
            });

            it('assignment from multi binary expression - dynamic member expression', function() {
                var code = '\
                    var right = 3;\
                    var a = ({ a: { b: { c: 1 } } }.a.b.c + 1) + right;\
                    var b = ({ a: { b: { c: 1 } } }.a.b.c + 1) - right;\
                    var c = ({ a: { b: { c: 1 } } }.a.b.c + 1) * right;\
                    var d = ({ a: { b: { c: 1 } } }.a.b.c + 1) / right;\
                    var e = ({ a: { b: { c: 1 } } }.a.b.c + 1) % right;\
                    var f = ({ a: { b: { c: 1 } } }.a.b.c + 1) ** right;\
                    var g = ({ a: { b: { c: 1 } } }.a.b.c + 1) << right;\
                    var h = ({ a: { b: { c: 1 } } }.a.b.c + 1) >> right;\
                    var i = ({ a: { b: { c: 1 } } }.a.b.c + 1) >>> right;\
                    var j = ({ a: { b: { c: 1 } } }.a.b.c + 1) & right;\
                    var k = ({ a: { b: { c: 1 } } }.a.b.c + 1) | right;\
                    var l = ({ a: { b: { c: 1 } } }.a.b.c + 1) ^ right;\
                ';
                var ast = esprima.parse(code);

                processNames(ast, rootScope);
                processValues(ast);

                assert.strictEqual(rootScope.getReference('a').value, 2 + 3);
                assert.strictEqual(rootScope.getReference('b').value, 2 - 3);
                assert.strictEqual(rootScope.getReference('c').value, 2 * 3);
                assert.strictEqual(rootScope.getReference('d').value, 2 / 3);
                assert.strictEqual(rootScope.getReference('e').value, 2 % 3);
                assert.strictEqual(rootScope.getReference('f').value, Math.pow(2, 3));
                assert.strictEqual(rootScope.getReference('g').value, 2 << 3);
                assert.strictEqual(rootScope.getReference('h').value, 2 >> 3);
                assert.strictEqual(rootScope.getReference('i').value, 2 >>> 3);
                assert.strictEqual(rootScope.getReference('j').value, 2 & 3);
                assert.strictEqual(rootScope.getReference('k').value, 2 | 3);
                assert.strictEqual(rootScope.getReference('l').value, 2 ^ 3);
            });
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
