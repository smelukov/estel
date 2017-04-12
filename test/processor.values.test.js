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

    describe('binary expression', function() {
        it('literal', function() {
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
                    var m = 2 == 3;\
                    var n = 2 != 3;\
                    var o = 2 === 3;\
                    var p = 2 !== 3;\
                    var q = 2 < 3;\
                    var r = 2 <= 3;\
                    var s = 2 > 3;\
                    var t = 2 >= 3;\
                    var u = 2 in { 2: 3 };\
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
            assert.strictEqual(rootScope.getReference('m').value, 2 == 3);
            assert.strictEqual(rootScope.getReference('n').value, 2 != 3);
            assert.strictEqual(rootScope.getReference('o').value, 2 === 3);
            assert.strictEqual(rootScope.getReference('p').value, 2 !== 3);
            assert.strictEqual(rootScope.getReference('q').value, 2 < 3);
            assert.strictEqual(rootScope.getReference('r').value, 2 <= 3);
            assert.strictEqual(rootScope.getReference('s').value, 2 > 3);
            assert.strictEqual(rootScope.getReference('t').value, 2 >= 3);
            assert.strictEqual(rootScope.getReference('u').value, 2 in { 2: 3 });
        });

        it('identifier', function() {
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
                    var m = left == right;\
                    var n = left != right;\
                    var o = left === right;\
                    var p = left !== right;\
                    var q = left < right;\
                    var r = left <= right;\
                    var s = left > right;\
                    var t = left >= right;\
                    var u = left in { [left]: right };\
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
            assert.strictEqual(rootScope.getReference('m').value, 2 == 3);
            assert.strictEqual(rootScope.getReference('n').value, 2 != 3);
            assert.strictEqual(rootScope.getReference('o').value, 2 === 3);
            assert.strictEqual(rootScope.getReference('p').value, 2 !== 3);
            assert.strictEqual(rootScope.getReference('q').value, 2 < 3);
            assert.strictEqual(rootScope.getReference('r').value, 2 <= 3);
            assert.strictEqual(rootScope.getReference('s').value, 2 > 3);
            assert.strictEqual(rootScope.getReference('t').value, 2 >= 3);
            assert.strictEqual(rootScope.getReference('u').value, 2 in { 2: 3 });
        });

        it('member expression', function() {
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
                    var m = obj.a.b.c.d == right;\
                    var n = obj.a.b.c.d != right;\
                    var o = obj.a.b.c.d === right;\
                    var p = obj.a.b.c.d !== right;\
                    var q = obj.a.b.c.d < right;\
                    var r = obj.a.b.c.d <= right;\
                    var s = obj.a.b.c.d > right;\
                    var t = obj.a.b.c.d >= right;\
                    var u = obj.a.b.c.d in { 2: right };\
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
            assert.strictEqual(rootScope.getReference('m').value, 2 == 3);
            assert.strictEqual(rootScope.getReference('n').value, 2 != 3);
            assert.strictEqual(rootScope.getReference('o').value, 2 === 3);
            assert.strictEqual(rootScope.getReference('p').value, 2 !== 3);
            assert.strictEqual(rootScope.getReference('q').value, 2 < 3);
            assert.strictEqual(rootScope.getReference('r').value, 2 <= 3);
            assert.strictEqual(rootScope.getReference('s').value, 2 > 3);
            assert.strictEqual(rootScope.getReference('t').value, 2 >= 3);
            assert.strictEqual(rootScope.getReference('u').value, 2 in { 2: 3 });
        });

        it('computed member expression', function() {
            var code = '\
                    var prop = \'d\';\
                    var obj = { a: { b: { c: { d: 2 } } } };\
                    var right = 3;\
                    var a = obj.a.b.c[prop] + right;\
                    var b = obj.a.b.c[prop] - right;\
                    var c = obj.a.b.c[prop] * right;\
                    var d = obj.a.b.c[prop] / right;\
                    var e = obj.a.b.c[prop] % right;\
                    var f = obj.a.b.c[prop] ** right;\
                    var g = obj.a.b.c[prop] << right;\
                    var h = obj.a.b.c[prop] >> right;\
                    var i = obj.a.b.c[prop] >>> right;\
                    var j = obj.a.b.c[prop] & right;\
                    var k = obj.a.b.c[prop] | right;\
                    var l = obj.a.b.c[prop] ^ right;\
                    var m = obj.a.b.c[prop] == right;\
                    var n = obj.a.b.c[prop] != right;\
                    var o = obj.a.b.c[prop] === right;\
                    var p = obj.a.b.c[prop] !== right;\
                    var q = obj.a.b.c[prop] < right;\
                    var r = obj.a.b.c[prop] <= right;\
                    var s = obj.a.b.c[prop] > right;\
                    var t = obj.a.b.c[prop] >= right;\
                    var u = obj.a.b.c[prop] in { 2: right };\
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
            assert.strictEqual(rootScope.getReference('m').value, 2 == 3);
            assert.strictEqual(rootScope.getReference('n').value, 2 != 3);
            assert.strictEqual(rootScope.getReference('o').value, 2 === 3);
            assert.strictEqual(rootScope.getReference('p').value, 2 !== 3);
            assert.strictEqual(rootScope.getReference('q').value, 2 < 3);
            assert.strictEqual(rootScope.getReference('r').value, 2 <= 3);
            assert.strictEqual(rootScope.getReference('s').value, 2 > 3);
            assert.strictEqual(rootScope.getReference('t').value, 2 >= 3);
            assert.strictEqual(rootScope.getReference('u').value, 2 in { 2: 3 });
        });

        it('object + member expression', function() {
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
                    var m = { a: { b: { c: 2 } } }.a.b.c == right;\
                    var n = { a: { b: { c: 2 } } }.a.b.c != right;\
                    var o = { a: { b: { c: 2 } } }.a.b.c === right;\
                    var p = { a: { b: { c: 2 } } }.a.b.c !== right;\
                    var q = { a: { b: { c: 2 } } }.a.b.c < right;\
                    var r = { a: { b: { c: 2 } } }.a.b.c <= right;\
                    var s = { a: { b: { c: 2 } } }.a.b.c > right;\
                    var t = { a: { b: { c: 2 } } }.a.b.c >= right;\
                    var u = { a: { b: { c: 2 } } }.a.b.c in { 2: right };\
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
            assert.strictEqual(rootScope.getReference('m').value, 2 == 3);
            assert.strictEqual(rootScope.getReference('n').value, 2 != 3);
            assert.strictEqual(rootScope.getReference('o').value, 2 === 3);
            assert.strictEqual(rootScope.getReference('p').value, 2 !== 3);
            assert.strictEqual(rootScope.getReference('q').value, 2 < 3);
            assert.strictEqual(rootScope.getReference('r').value, 2 <= 3);
            assert.strictEqual(rootScope.getReference('s').value, 2 > 3);
            assert.strictEqual(rootScope.getReference('t').value, 2 >= 3);
            assert.strictEqual(rootScope.getReference('u').value, 2 in { 2: 3 });
        });

        it('multi binary expression - literal', function() {
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
                    var m = (1 + 1) == (2 + 1);\
                    var n = (1 + 1) != (2 + 1);\
                    var o = (1 + 1) === (2 + 1);\
                    var p = (1 + 1) !== (2 + 1);\
                    var q = (1 + 1) < (2 + 1);\
                    var r = (1 + 1) <= (2 + 1);\
                    var s = (1 + 1) > (2 + 1);\
                    var t = (1 + 1) >= (2 + 1);\
                    var u = (1 + 1) in { 2: 3 };\
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
            assert.strictEqual(rootScope.getReference('m').value, 2 == 3);
            assert.strictEqual(rootScope.getReference('n').value, 2 != 3);
            assert.strictEqual(rootScope.getReference('o').value, 2 === 3);
            assert.strictEqual(rootScope.getReference('p').value, 2 !== 3);
            assert.strictEqual(rootScope.getReference('q').value, 2 < 3);
            assert.strictEqual(rootScope.getReference('r').value, 2 <= 3);
            assert.strictEqual(rootScope.getReference('s').value, 2 > 3);
            assert.strictEqual(rootScope.getReference('t').value, 2 >= 3);
            assert.strictEqual(rootScope.getReference('u').value, 2 in { 2: 3 });
        });

        it('multi binary expression - identifier', function() {
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
                    var m = (one + one) == (two + one);\
                    var n = (one + one) != (two + one);\
                    var o = (one + one) === (two + one);\
                    var p = (one + one) !== (two + one);\
                    var q = (one + one) < (two + one);\
                    var r = (one + one) <= (two + one);\
                    var s = (one + one) > (two + one);\
                    var t = (one + one) >= (two + one);\
                    var u = (one + one) in { [one + one]: two + one };\
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
            assert.strictEqual(rootScope.getReference('m').value, 2 == 3);
            assert.strictEqual(rootScope.getReference('n').value, 2 != 3);
            assert.strictEqual(rootScope.getReference('o').value, 2 === 3);
            assert.strictEqual(rootScope.getReference('p').value, 2 !== 3);
            assert.strictEqual(rootScope.getReference('q').value, 2 < 3);
            assert.strictEqual(rootScope.getReference('r').value, 2 <= 3);
            assert.strictEqual(rootScope.getReference('s').value, 2 > 3);
            assert.strictEqual(rootScope.getReference('t').value, 2 >= 3);
            assert.strictEqual(rootScope.getReference('u').value, 2 in { 2: 3 });
        });

        it('multi binary expression - object + member expression', function() {
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
                    var m = ({ a: { b: { c: 1 } } }.a.b.c + 1) == right;\
                    var n = ({ a: { b: { c: 1 } } }.a.b.c + 1) != right;\
                    var o = ({ a: { b: { c: 1 } } }.a.b.c + 1) === right;\
                    var p = ({ a: { b: { c: 1 } } }.a.b.c + 1) !== right;\
                    var q = ({ a: { b: { c: 1 } } }.a.b.c + 1) < right;\
                    var r = ({ a: { b: { c: 1 } } }.a.b.c + 1) <= right;\
                    var s = ({ a: { b: { c: 1 } } }.a.b.c + 1) > right;\
                    var t = ({ a: { b: { c: 1 } } }.a.b.c + 1) >= right;\
                    var u = ({ a: { b: { c: 1 } } }.a.b.c + 1) in { 2: right };\
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
            assert.strictEqual(rootScope.getReference('m').value, 2 == 3);
            assert.strictEqual(rootScope.getReference('n').value, 2 != 3);
            assert.strictEqual(rootScope.getReference('o').value, 2 === 3);
            assert.strictEqual(rootScope.getReference('p').value, 2 !== 3);
            assert.strictEqual(rootScope.getReference('q').value, 2 < 3);
            assert.strictEqual(rootScope.getReference('r').value, 2 <= 3);
            assert.strictEqual(rootScope.getReference('s').value, 2 > 3);
            assert.strictEqual(rootScope.getReference('t').value, 2 >= 3);
            assert.strictEqual(rootScope.getReference('u').value, 2 in { 2: 3 });
        });

        it('undefined binary expression', function() {
            var code = '\
                    var right = 3;\
                    var a = (some1 + some2) + right;\
                    var b = (some1 + some2) - right;\
                    var c = (some1 + some2) * right;\
                    var d = (some1 + some2) / right;\
                    var e = (some1 + some2) % right;\
                    var f = (some1 + some2) ** right;\
                    var g = (some1 + some2) << right;\
                    var h = (some1 + some2) >> right;\
                    var i = (some1 + some2) >>> right;\
                    var j = (some1 + some2) & right;\
                    var k = (some1 + some2) | right;\
                    var l = (some1 + some2) ^ right;\
                    var m = (some1 + some2) == right;\
                    var n = (some1 + some2) != right;\
                    var o = (some1 + some2) === right;\
                    var p = (some1 + some2) !== right;\
                    var q = (some1 + some2) < right;\
                    var r = (some1 + some2) <= right;\
                    var s = (some1 + some2) > right;\
                    var t = (some1 + some2) >= right;\
                    var u = (some1 + some2) in { 2: right };\
                ';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.isUndefined(rootScope.getReference('a').value);
            assert.isUndefined(rootScope.getReference('b').value);
            assert.isUndefined(rootScope.getReference('c').value);
            assert.isUndefined(rootScope.getReference('d').value);
            assert.isUndefined(rootScope.getReference('e').value);
            assert.isUndefined(rootScope.getReference('f').value);
            assert.isUndefined(rootScope.getReference('g').value);
            assert.isUndefined(rootScope.getReference('h').value);
            assert.isUndefined(rootScope.getReference('i').value);
            assert.isUndefined(rootScope.getReference('j').value);
            assert.isUndefined(rootScope.getReference('k').value);
            assert.isUndefined(rootScope.getReference('l').value);
            assert.isUndefined(rootScope.getReference('m').value);
            assert.isUndefined(rootScope.getReference('n').value);
            assert.isUndefined(rootScope.getReference('o').value);
            assert.isUndefined(rootScope.getReference('p').value);
            assert.isUndefined(rootScope.getReference('q').value);
            assert.isUndefined(rootScope.getReference('r').value);
            assert.isUndefined(rootScope.getReference('s').value);
            assert.isUndefined(rootScope.getReference('t').value);
            assert.isUndefined(rootScope.getReference('u').value);
        });

        describe('in', function() {
            it('true for object', function() {
                var code = '\
                    var a = 1 in { 1: 1 };\
                ';
                var ast = esprima.parse(code);

                processNames(ast, rootScope);
                processValues(ast);

                assert.isTrue(rootScope.getReference('a').value);
            });

            it('true for functions', function() {
                var code = '\
                    function fn1(){};\
                    var fn2 = function(){};\
                    var fn3 = ()=>{};\
                    class class1 {};\
                    var class2 = class {};\
                    fn1.prop = 1;\
                    fn2.prop = 2;\
                    fn3.prop = 3;\
                    class1.prop = 4;\
                    class2.prop = 5;\
                    var a = \'prop\' in fn1;\
                    var b = \'prop\' in fn2;\
                    var c = \'prop\' in fn3;\
                    var d = \'prop\' in class1;\
                    var e = \'prop\' in class2;\
                ';
                var ast = esprima.parse(code);

                processNames(ast, rootScope);
                processValues(ast);

                assert.isTrue(rootScope.getReference('a').value);
                assert.isTrue(rootScope.getReference('b').value);
                assert.isTrue(rootScope.getReference('c').value);
                assert.isTrue(rootScope.getReference('d').value);
                assert.isTrue(rootScope.getReference('e').value);
            });

            it('false for null', function() {
                var code = '\
                    var a = 1 in null;\
                ';
                var ast = esprima.parse(code);

                processNames(ast, rootScope);
                processValues(ast);

                assert.isFalse(rootScope.getReference('a').value);
            });
        });
    });

    describe('unary expression', function() {
        it('literal', function() {
            var code = '\
                    var a = -1;\
                    var b = -(-1);\
                    var c = +1;\
                    var d = +-1;\
                    var e = !1;\
                    var f = !!1;\
                    var g = ~1;\
                    var h = typeof 1;\
                    var i = void 1;\
                ';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, -1);
            assert.strictEqual(rootScope.getReference('b').value, -(-1));
            assert.strictEqual(rootScope.getReference('c').value, +1);
            assert.strictEqual(rootScope.getReference('d').value, +-1);
            assert.strictEqual(rootScope.getReference('e').value, !1);
            assert.strictEqual(rootScope.getReference('f').value, !!1);
            assert.strictEqual(rootScope.getReference('g').value, ~1);
            assert.strictEqual(rootScope.getReference('h').value, typeof 1);
            assert.strictEqual(rootScope.getReference('i').value, void 1);
        });

        it('identifier', function() {
            var code = '\
                    var one = 1;\
                    var a = -one;\
                    var b = -(-one);\
                    var c = +one;\
                    var d = +-one;\
                    var e = !one;\
                    var f = !!one;\
                    var g = ~one;\
                    var h = typeof one;\
                    var i = void one;\
                ';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, -1);
            assert.strictEqual(rootScope.getReference('b').value, -(-1));
            assert.strictEqual(rootScope.getReference('c').value, +1);
            assert.strictEqual(rootScope.getReference('d').value, +-1);
            assert.strictEqual(rootScope.getReference('e').value, !1);
            assert.strictEqual(rootScope.getReference('f').value, !!1);
            assert.strictEqual(rootScope.getReference('g').value, ~1);
            assert.strictEqual(rootScope.getReference('h').value, typeof 1);
            assert.strictEqual(rootScope.getReference('i').value, void 1);
        });

        it('member expression', function() {
            var code = '\
                    var obj = { a: { b: { c: 1 } } };\
                    var a = -obj.a.b.c;\
                    var b = -(-obj.a.b.c);\
                    var c = +obj.a.b.c;\
                    var d = +-obj.a.b.c;\
                    var e = !obj.a.b.c;\
                    var f = !!obj.a.b.c;\
                    var g = ~obj.a.b.c;\
                    var h = typeof obj.a.b.c;\
                    var i = void obj.a.b.c;\
                ';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, -1);
            assert.strictEqual(rootScope.getReference('b').value, -(-1));
            assert.strictEqual(rootScope.getReference('c').value, +1);
            assert.strictEqual(rootScope.getReference('d').value, +-1);
            assert.strictEqual(rootScope.getReference('e').value, !1);
            assert.strictEqual(rootScope.getReference('f').value, !!1);
            assert.strictEqual(rootScope.getReference('g').value, ~1);
            assert.strictEqual(rootScope.getReference('h').value, typeof 1);
            assert.strictEqual(rootScope.getReference('i').value, void 1);
        });

        it('computed member expression', function() {
            var code = '\
                    var prop = \'c\';\
                    var obj = { a: { b: { c: 1 } } };\
                    var a = -obj.a.b[prop];\
                    var b = -(-obj.a.b[prop]);\
                    var c = +obj.a.b[prop];\
                    var d = +-obj.a.b[prop];\
                    var e = !obj.a.b[prop];\
                    var f = !!obj.a.b[prop];\
                    var g = ~obj.a.b[prop];\
                    var h = typeof obj.a.b[prop];\
                    var i = void obj.a.b[prop];\
                ';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, -1);
            assert.strictEqual(rootScope.getReference('b').value, -(-1));
            assert.strictEqual(rootScope.getReference('c').value, +1);
            assert.strictEqual(rootScope.getReference('d').value, +-1);
            assert.strictEqual(rootScope.getReference('e').value, !1);
            assert.strictEqual(rootScope.getReference('f').value, !!1);
            assert.strictEqual(rootScope.getReference('g').value, ~1);
            assert.strictEqual(rootScope.getReference('h').value, typeof 1);
            assert.strictEqual(rootScope.getReference('i').value, void 1);
        });

        it('object + member expression', function() {
            var code = '\
                    var a = -{ a: { b: { c: 1 } } }.a.b.c;\
                    var b = -(-{ a: { b: { c: 1 } } }.a.b.c);\
                    var c = +{ a: { b: { c: 1 } } }.a.b.c;\
                    var d = +-{ a: { b: { c: 1 } } }.a.b.c;\
                    var e = !{ a: { b: { c: 1 } } }.a.b.c;\
                    var f = !!{ a: { b: { c: 1 } } }.a.b.c;\
                    var g = ~{ a: { b: { c: 1 } } }.a.b.c;\
                    var h = typeof { a: { b: { c: 1 } } }.a.b.c;\
                    var i = void { a: { b: { c: 1 } } }.a.b.c;\
                ';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, -1);
            assert.strictEqual(rootScope.getReference('b').value, -(-1));
            assert.strictEqual(rootScope.getReference('c').value, +1);
            assert.strictEqual(rootScope.getReference('d').value, +-1);
            assert.strictEqual(rootScope.getReference('e').value, !1);
            assert.strictEqual(rootScope.getReference('f').value, !!1);
            assert.strictEqual(rootScope.getReference('g').value, ~1);
            assert.strictEqual(rootScope.getReference('h').value, typeof 1);
            assert.strictEqual(rootScope.getReference('i').value, void 1);
        });

        describe('delete', function() {
            it('literal', function() {
                var code = '\
                        var a = delete 1\
                    ';
                var ast = esprima.parse(code);

                processNames(ast, rootScope);
                processValues(ast);

                assert.isTrue(rootScope.getReference('a').value);
            });

            it('identifier', function() {
                var code = '\
                        var prop = 1;\
                        var a = delete prop\
                    ';
                var ast = esprima.parse(code);

                processNames(ast, rootScope);
                processValues(ast);

                assert.isTrue(rootScope.getReference('a').value);
            });

            it('member expression', function() {
                var code = '\
                        var obj = { a: { b: { c: 1 } } };\
                        var a = delete obj.a.b.c;\
                        var b = obj.a.b.c;\
                    ';
                var ast = esprima.parse(code);

                processNames(ast, rootScope);
                processValues(ast);

                assert.isTrue(rootScope.getReference('a').value);
                assert.isUndefined(rootScope.getReference('b').value);
            });

            it('computed member expression', function() {
                var code = '\
                        var prop = \'c\';\
                        var obj = { a: { b: { c: 1 } } };\
                        var a = delete obj.a.b[prop];\
                        var b = obj.a.b.c;\
                    ';
                var ast = esprima.parse(code);

                processNames(ast, rootScope);
                processValues(ast);

                assert.isTrue(rootScope.getReference('a').value);
                assert.isUndefined(rootScope.getReference('b').value);
            });

            it('undefined member expression', function() {
                var code = '\
                        var obj = { a: { b: { c: 1 } } };\
                        var a = delete obj.a.b.d;\
                    ';
                var ast = esprima.parse(code);

                processNames(ast, rootScope);
                processValues(ast);

                assert.isTrue(rootScope.getReference('a').value);
            });

            it('undefined identifier', function() {
                var code = '\
                        var a = delete obj.a.b.d;\
                    ';
                var ast = esprima.parse(code);

                processNames(ast, rootScope);
                processValues(ast);

                assert.isTrue(rootScope.getReference('a').value);
            });
        });
    });

    describe('update expression', function() {
        it('identifier', function() {
            var code = '\
                    var a = 1;\
                    var b = ++a;\
                    var c = a++;\
                    var d = --a;\
                    var e = a--;\
                ';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, 1);
            assert.strictEqual(rootScope.getReference('b').value, 2);
            assert.strictEqual(rootScope.getReference('c').value, 2);
            assert.strictEqual(rootScope.getReference('d').value, 2);
            assert.strictEqual(rootScope.getReference('e').value, 2);
        });

        it('member expression', function() {
            var code = '\
                    var obj = { a: { b: { c: 1 } } };\
                    var b = ++obj.a.b.c;\
                    var c = obj.a.b.c++;\
                    var d = --obj.a.b.c;\
                    var e = obj.a.b.c--;\
                    var a = obj.a.b.c\
                ';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, 1);
            assert.strictEqual(rootScope.getReference('b').value, 2);
            assert.strictEqual(rootScope.getReference('c').value, 2);
            assert.strictEqual(rootScope.getReference('d').value, 2);
            assert.strictEqual(rootScope.getReference('e').value, 2);
        });

        it('computed member expression', function() {
            var code = '\
                    var prop = \'c\';\
                    var obj = { a: { b: { c: 1 } } };\
                    var b = ++obj.a.b[prop];\
                    var c = obj.a.b[prop]++;\
                    var d = --obj.a.b[prop];\
                    var e = obj.a.b[prop]--;\
                    var a = obj.a.b[prop]\
                ';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, 1);
            assert.strictEqual(rootScope.getReference('b').value, 2);
            assert.strictEqual(rootScope.getReference('c').value, 2);
            assert.strictEqual(rootScope.getReference('d').value, 2);
            assert.strictEqual(rootScope.getReference('e').value, 2);
        });

        it('undefined identifier', function() {
            var code = '\
                    var b = ++a;\
                    var c = a++;\
                    var d = --a;\
                    var e = a--;\
                ';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.isUndefined(rootScope.getReference('b').value);
            assert.isUndefined(rootScope.getReference('c').value);
            assert.isUndefined(rootScope.getReference('d').value);
            assert.isUndefined(rootScope.getReference('e').value);
        });

        it('undefined member expression', function() {
            var code = '\
                    var obj = { a: { b: {} } };\
                    var b = ++obj.a.b.c;\
                    var c = obj.a.b.c++;\
                    var d = --obj.a.b.c;\
                    var e = obj.a.b.c--;\
                ';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.typeOf(rootScope.getReference('b').value, 'number');
            assert.isNaN(rootScope.getReference('b').value);
            assert.typeOf(rootScope.getReference('c').value, 'number');
            assert.isNaN(rootScope.getReference('c').value);
            assert.typeOf(rootScope.getReference('d').value, 'number');
            assert.isNaN(rootScope.getReference('d').value);
            assert.typeOf(rootScope.getReference('e').value, 'number');
            assert.isNaN(rootScope.getReference('e').value);
        });

        it('undefined object in member expression', function() {
            var code = '\
                    var b = ++obj.a.b.c;\
                    var c = obj.a.b.c++;\
                    var d = --obj.a.b.c;\
                    var e = obj.a.b.c--;\
                ';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.isUndefined(rootScope.getReference('b').value);
            assert.isUndefined(rootScope.getReference('c').value);
            assert.isUndefined(rootScope.getReference('d').value);
            assert.isUndefined(rootScope.getReference('e').value);
        });
    });

    describe('logical expression', function() {
        it('literal', function() {
            var code = '\
                    var a = 1 && 1;\
                    var b = 0 && 1;\
                    var c = 1 || 1;\
                    var d = 0 || 1;\
                ';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, 1);
            assert.strictEqual(rootScope.getReference('b').value, 0);
            assert.strictEqual(rootScope.getReference('c').value, 1);
            assert.strictEqual(rootScope.getReference('d').value, 1);
        });

        it('identifier', function() {
            var code = '\
                    var one = 1;\
                    var zero = 0;\
                    var a = one && one;\
                    var b = zero && one;\
                    var c = one || one;\
                    var d = zero || one;\
                ';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, 1);
            assert.strictEqual(rootScope.getReference('b').value, 0);
            assert.strictEqual(rootScope.getReference('c').value, 1);
            assert.strictEqual(rootScope.getReference('d').value, 1);
        });

        it('member expression', function() {
            var code = '\
                    var obj = { a: { b: { c: { d: 1, e: 0 } } } };\
                    var one = 1;\
                    var zero = 0;\
                    var a = obj.a.b.c.d && one;\
                    var b = obj.a.b.c.e && zero;\
                    var c = obj.a.b.c.d || one;\
                    var d = obj.a.b.c.e || one;\
                ';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, 1);
            assert.strictEqual(rootScope.getReference('b').value, 0);
            assert.strictEqual(rootScope.getReference('c').value, 1);
            assert.strictEqual(rootScope.getReference('d').value, 1);
        });

        it('computed member expression', function() {
            var code = '\
                    var propD = \'d\';\
                    var propE = \'e\';\
                    var obj = { a: { b: { c: { d: 1, e: 0 } } } };\
                    var one = 1;\
                    var zero = 0;\
                    var a = obj.a.b.c[propD] && one;\
                    var b = obj.a.b.c[propE] && zero;\
                    var c = obj.a.b.c[propD] || one;\
                    var d = obj.a.b.c[propE] || one;\
                ';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, 1);
            assert.strictEqual(rootScope.getReference('b').value, 0);
            assert.strictEqual(rootScope.getReference('c').value, 1);
            assert.strictEqual(rootScope.getReference('d').value, 1);
        });

        it('object + member expression', function() {
            var code = '\
                    var one = 1;\
                    var zero = 0;\
                    var a = { a: { b: { c: 1 } } }.a.b.c && one;\
                    var b = { a: { b: { c: 0 } } }.a.b.c && zero;\
                    var c = { a: { b: { c: 1 } } }.a.b.c || one;\
                    var d = { a: { b: { c: 0 } } }.a.b.c || one;\
                ';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, 1);
            assert.strictEqual(rootScope.getReference('b').value, 0);
            assert.strictEqual(rootScope.getReference('c').value, 1);
            assert.strictEqual(rootScope.getReference('d').value, 1);
        });

        it('multi logical expression - literal', function() {
            var code = '\
                    var a = (1 || 0) && (0 || 1);\
                    var b = (0 && 1) && (0 || 0);\
                    var c = (1 || 1) || (1 && 1);\
                    var d = (0 || 0) || (1 || 1);\
                ';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, 1);
            assert.strictEqual(rootScope.getReference('b').value, 0);
            assert.strictEqual(rootScope.getReference('c').value, 1);
            assert.strictEqual(rootScope.getReference('d').value, 1);
        });

        it('multi logical expression - identifier', function() {
            var code = '\
                    var one = 1;\
                    var zero = 0;\
                    var a = (one || zero) && (zero || one);\
                    var b = (zero && one) && (zero || zero);\
                    var c = (one || one) || (one && one);\
                    var d = (zero || zero) || (one || one);\
                ';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, 1);
            assert.strictEqual(rootScope.getReference('b').value, 0);
            assert.strictEqual(rootScope.getReference('c').value, 1);
            assert.strictEqual(rootScope.getReference('d').value, 1);
        });

        it('multi logical expression - object + member expression', function() {
            var code = '\
                    var one = 1;\
                    var zero = 0;\
                    var a = ({ a: { b: { c: 1 } } }.a.b.c || 0) && one;\
                    var b = ({ a: { b: { c: 0 } } }.a.b.c && 1) && zero;\
                    var c = ({ a: { b: { c: 1 } } }.a.b.c || 1) || one;\
                    var d = ({ a: { b: { c: 0 } } }.a.b.c || 0) || one;\
                ';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, 1);
            assert.strictEqual(rootScope.getReference('b').value, 0);
            assert.strictEqual(rootScope.getReference('c').value, 1);
            assert.strictEqual(rootScope.getReference('d').value, 1);
        });

        it('undefined logical expression', function() {
            var code = '\
                    var one = 1;\
                    var zero = 0;\
                    var a = (some1 || some2) && one;\
                    var b = (some1 || some2) && zero;\
                    var c = (some1 || some2) || one;\
                    var d = (some1 || some2) || one;\
                ';
            var ast = esprima.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.isUndefined(rootScope.getReference('a').value);
            assert.isUndefined(rootScope.getReference('b').value);
            assert.isUndefined(rootScope.getReference('c').value);
            assert.isUndefined(rootScope.getReference('d').value);
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
