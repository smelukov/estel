var parser = require('esprima');
var assert = require('chai').assert;
var Scope = require('../lib/scope');
var processNames = require('../lib/namesProcessor');
var processValues = require('../lib/valuesProcessor');
var createRunner = require('../lib/valueResolver').createRunner;

describe('Processor.values', function() {
    var rootScope;

    beforeEach(function() {
        rootScope = new Scope();
    });

    describe('var declaration', function() {
        it('empty declaration', function() {
            var code = 'var a; var b';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.isUndefined(rootScope.getReference('a').value);
            assert.isUndefined(rootScope.getReference('b').value);
        });

        it('assignment literal', function() {
            var code = 'var a = 10; var b = 20';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').value, 10);
            assert.equal(rootScope.getReference('b').value, 20);
        });

        it('assignment identifier', function() {
            var code = 'var a = 10; var b = a';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').value, 10);
            assert.equal(rootScope.getReference('b').value, 10);
        });

        it('assignment form member expression', function() {
            var code = 'var a = { b: 1, c: { d: 1, e: 2 } }; var b = a.c.d';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('b').value, 1);
        });

        it('assignment form object', function() {
            var code = 'var a = { b: 1, c: { d: 1, e: 2 } }, b = a, c = b.c.d';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('b').value, { b: 1, c: { d: 1, e: 2 } });
            assert.strictEqual(rootScope.getReference('c').value, 1);
        });

        it('assignment form array', function() {
            var code = '\
                var a = [1, 2, [3, 4], { a: { b: { c: [5, 6, 7] } } }],\
                    b = a[0], c = a[2][1], d = a[3].a.b.c[1];\
                a[3].a.b.c[1] = 2;\
                a[3].a.b.c[3] = 10;\
                var e = a[3].a.b.c[1], f = a[3].a.b.c[3], g = a[3].a.b.c[10];';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('a').value, [1, 2, [3, 4], { a: { b: { c: [5, 2, 7, 10] } } }]);
            assert.strictEqual(rootScope.getReference('b').value, 1);
            assert.strictEqual(rootScope.getReference('c').value, 4);
            assert.strictEqual(rootScope.getReference('d').value, 6);
            assert.strictEqual(rootScope.getReference('e').value, 2);
            assert.strictEqual(rootScope.getReference('f').value, 10);
            assert.isUndefined(rootScope.getReference('g').value);
        });
    });

    describe('assignment', function() {
        it('literal', function() {
            var code = '\
                a = 10;\
                b = a;\
                b += 10;\
                c = a;\
                c -= 10;\
                d = a;\
                d *= 10;\
                e = a;\
                e /= 10;\
                f = a;\
                f %= 10;\
                g = a;\
                g <<= 10;\
                h = a;\
                h >>= 10;\
                i = a;\
                i >>>= 10;\
                j = a;\
                j |= 10;\
                k = a;\
                k ^= 10;\
                l = a;\
                l &= 10;\
                m &= 10;\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').value, 10);
            assert.equal(rootScope.getReference('b').value, 10 + 10);
            assert.equal(rootScope.getReference('c').value, 10 - 10);
            assert.equal(rootScope.getReference('d').value, 10 * 10);
            assert.equal(rootScope.getReference('e').value, 10 / 10);
            assert.equal(rootScope.getReference('f').value, 10 % 10);
            assert.equal(rootScope.getReference('g').value, 10 << 10);
            assert.equal(rootScope.getReference('h').value, 10 >> 10);
            assert.equal(rootScope.getReference('i').value, 10 >>> 10);
            assert.equal(rootScope.getReference('j').value, 10 | 10);
            assert.equal(rootScope.getReference('k').value, 10 ^ 10);
            assert.equal(rootScope.getReference('l').value, 10 & 10);
            assert.isFalse(rootScope.hasReference('m'));
        });

        it('identifier', function() {
            var code = '\
                a = 10;\
                b = a;\
                b += a;\
                c = a;\
                c -= a;\
                d = a;\
                d *= a;\
                e = a;\
                e /= a;\
                f = a;\
                f %= a;\
                g = a;\
                g <<= a;\
                h = a;\
                h >>= a;\
                i = a;\
                i >>>= a;\
                j = a;\
                j |= a;\
                k = a;\
                k ^= a;\
                l = a;\
                l &= a;\
                m = some;\
                n &= some;\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').value, 10);
            assert.equal(rootScope.getReference('b').value, 10 + 10);
            assert.equal(rootScope.getReference('c').value, 10 - 10);
            assert.equal(rootScope.getReference('d').value, 10 * 10);
            assert.equal(rootScope.getReference('e').value, 10 / 10);
            assert.equal(rootScope.getReference('f').value, 10 % 10);
            assert.equal(rootScope.getReference('g').value, 10 << 10);
            assert.equal(rootScope.getReference('h').value, 10 >> 10);
            assert.equal(rootScope.getReference('i').value, 10 >>> 10);
            assert.equal(rootScope.getReference('j').value, 10 | 10);
            assert.equal(rootScope.getReference('k').value, 10 ^ 10);
            assert.equal(rootScope.getReference('l').value, 10 & 10);
            assert.isUndefined(rootScope.getReference('m').value);
            assert.isFalse(rootScope.hasReference('n'));
        });

        it('literal to member expression', function() {
            var code = '\
                obj = { a: { b: { c: 1 } } };\
                obj.a.b.c = 10;\
                a = obj.a.b.c;\
                obj.a.b.c = 10;\
                obj.a.b.c += 10;\
                b = obj.a.b.c;\
                obj.a.b.c = 10;\
                obj.a.b.c -= 10;\
                c = obj.a.b.c;\
                obj.a.b.c = 10;\
                obj.a.b.c *= 10;\
                d = obj.a.b.c;\
                obj.a.b.c = 10;\
                obj.a.b.c /= 10;\
                e = obj.a.b.c;\
                obj.a.b.c = 10;\
                obj.a.b.c %= 10;\
                f = obj.a.b.c;\
                obj.a.b.c = 10;\
                obj.a.b.c <<= 10;\
                g = obj.a.b.c;\
                obj.a.b.c = 10;\
                obj.a.b.c >>= 10;\
                h = obj.a.b.c;\
                obj.a.b.c = 10;\
                obj.a.b.c >>>= 10;\
                i = obj.a.b.c;\
                obj.a.b.c = 10;\
                obj.a.b.c |= 10;\
                j = obj.a.b.c;\
                obj.a.b.c = 10;\
                obj.a.b.c ^= 10;\
                k = obj.a.b.c;\
                obj.a.b.c = 10;\
                obj.a.b.c &= 10;\
                l = obj.a.b.c;\
                obj.a.b.d = 10;\
                m = obj.a.b.d;\
                obj.a.b.e &= 10;\
                n = obj.a.b.e;\
                o = someObj.a.b.e;\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').value, 10);
            assert.equal(rootScope.getReference('b').value, 10 + 10);
            assert.equal(rootScope.getReference('c').value, 10 - 10);
            assert.equal(rootScope.getReference('d').value, 10 * 10);
            assert.equal(rootScope.getReference('e').value, 10 / 10);
            assert.equal(rootScope.getReference('f').value, 10 % 10);
            assert.equal(rootScope.getReference('g').value, 10 << 10);
            assert.equal(rootScope.getReference('h').value, 10 >> 10);
            assert.equal(rootScope.getReference('i').value, 10 >>> 10);
            assert.equal(rootScope.getReference('j').value, 10 | 10);
            assert.equal(rootScope.getReference('k').value, 10 ^ 10);
            assert.equal(rootScope.getReference('l').value, 10 & 10);
            assert.equal(rootScope.getReference('m').value, 10);
            assert.equal(rootScope.getReference('n').value, undefined & 10);
            assert.isUndefined(rootScope.hasReference('o').value);
        });

        it('literal to computed member expression - literal', function() {
            var code = '\
                obj = { a: { b: { c: 1 } } };\
                obj.a[\'b\'].c = 10;\
                a = obj.a[\'b\'].c;\
                obj.a[\'b\'].c = 10;\
                obj.a[\'b\'].c += 10;\
                b = obj.a[\'b\'].c;\
                obj.a[\'b\'].c = 10;\
                obj.a[\'b\'].c -= 10;\
                c = obj.a[\'b\'].c;\
                obj.a[\'b\'].c = 10;\
                obj.a[\'b\'].c *= 10;\
                d = obj.a[\'b\'].c;\
                obj.a[\'b\'].c = 10;\
                obj.a[\'b\'].c /= 10;\
                e = obj.a[\'b\'].c;\
                obj.a[\'b\'].c = 10;\
                obj.a[\'b\'].c %= 10;\
                f = obj.a[\'b\'].c;\
                obj.a[\'b\'].c = 10;\
                obj.a[\'b\'].c <<= 10;\
                g = obj.a[\'b\'].c;\
                obj.a[\'b\'].c = 10;\
                obj.a[\'b\'].c >>= 10;\
                h = obj.a[\'b\'].c;\
                obj.a[\'b\'].c = 10;\
                obj.a[\'b\'].c >>>= 10;\
                i = obj.a[\'b\'].c;\
                obj.a[\'b\'].c = 10;\
                obj.a[\'b\'].c |= 10;\
                j = obj.a[\'b\'].c;\
                obj.a[\'b\'].c = 10;\
                obj.a[\'b\'].c ^= 10;\
                k = obj.a[\'b\'].c;\
                obj.a[\'b\'].c = 10;\
                obj.a[\'b\'].c &= 10;\
                l = obj.a[\'b\'].c;\
                obj.a[\'b\'].d = 10;\
                m = obj.a[\'b\'].d;\
                obj.a[\'b\'].e &= 10;\
                n = obj.a[\'b\'].e;\
                o = someObj.a[\'b\'].e;\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').value, 10);
            assert.equal(rootScope.getReference('b').value, 10 + 10);
            assert.equal(rootScope.getReference('c').value, 10 - 10);
            assert.equal(rootScope.getReference('d').value, 10 * 10);
            assert.equal(rootScope.getReference('e').value, 10 / 10);
            assert.equal(rootScope.getReference('f').value, 10 % 10);
            assert.equal(rootScope.getReference('g').value, 10 << 10);
            assert.equal(rootScope.getReference('h').value, 10 >> 10);
            assert.equal(rootScope.getReference('i').value, 10 >>> 10);
            assert.equal(rootScope.getReference('j').value, 10 | 10);
            assert.equal(rootScope.getReference('k').value, 10 ^ 10);
            assert.equal(rootScope.getReference('l').value, 10 & 10);
            assert.equal(rootScope.getReference('m').value, 10);
            assert.equal(rootScope.getReference('n').value, undefined & 10);
            assert.isUndefined(rootScope.hasReference('o').value);
        });

        it('literal to computed member expression - identifier', function() {
            var code = '\
                prop = \'b\';\
                obj = { a: { b: { c: 1 } } };\
                obj.a[prop].c = 10;\
                a = obj.a[prop].c;\
                obj.a[prop].c = 10;\
                obj.a[prop].c += 10;\
                b = obj.a[prop].c;\
                obj.a[prop].c = 10;\
                obj.a[prop].c -= 10;\
                c = obj.a[prop].c;\
                obj.a[prop].c = 10;\
                obj.a[prop].c *= 10;\
                d = obj.a[prop].c;\
                obj.a[prop].c = 10;\
                obj.a[prop].c /= 10;\
                e = obj.a[prop].c;\
                obj.a[prop].c = 10;\
                obj.a[prop].c %= 10;\
                f = obj.a[prop].c;\
                obj.a[prop].c = 10;\
                obj.a[prop].c <<= 10;\
                g = obj.a[prop].c;\
                obj.a[prop].c = 10;\
                obj.a[prop].c >>= 10;\
                h = obj.a[prop].c;\
                obj.a[prop].c = 10;\
                obj.a[prop].c >>>= 10;\
                i = obj.a[prop].c;\
                obj.a[prop].c = 10;\
                obj.a[prop].c |= 10;\
                j = obj.a[prop].c;\
                obj.a[prop].c = 10;\
                obj.a[prop].c ^= 10;\
                k = obj.a[prop].c;\
                obj.a[prop].c = 10;\
                obj.a[prop].c &= 10;\
                l = obj.a[prop].c;\
                obj.a[prop].d = 10;\
                m = obj.a[prop].d;\
                obj.a[prop].e &= 10;\
                n = obj.a[prop].e;\
                o = someObj.a[prop].e;\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').value, 10);
            assert.equal(rootScope.getReference('b').value, 10 + 10);
            assert.equal(rootScope.getReference('c').value, 10 - 10);
            assert.equal(rootScope.getReference('d').value, 10 * 10);
            assert.equal(rootScope.getReference('e').value, 10 / 10);
            assert.equal(rootScope.getReference('f').value, 10 % 10);
            assert.equal(rootScope.getReference('g').value, 10 << 10);
            assert.equal(rootScope.getReference('h').value, 10 >> 10);
            assert.equal(rootScope.getReference('i').value, 10 >>> 10);
            assert.equal(rootScope.getReference('j').value, 10 | 10);
            assert.equal(rootScope.getReference('k').value, 10 ^ 10);
            assert.equal(rootScope.getReference('l').value, 10 & 10);
            assert.equal(rootScope.getReference('m').value, 10);
            assert.equal(rootScope.getReference('n').value, undefined & 10);
            assert.isUndefined(rootScope.hasReference('o').value);
        });

        it('literal to computed member expression - literal last', function() {
            var code = '\
                obj = { a: { b: { c: 1 } } };\
                obj.a.b[\'c\'] = 10;\
                a = obj.a.b[\'c\'];\
                obj.a.b[\'c\'] = 10;\
                obj.a.b[\'c\'] += 10;\
                b = obj.a.b[\'c\'];\
                obj.a.b[\'c\'] = 10;\
                obj.a.b[\'c\'] -= 10;\
                c = obj.a.b[\'c\'];\
                obj.a.b[\'c\'] = 10;\
                obj.a.b[\'c\'] *= 10;\
                d = obj.a.b[\'c\'];\
                obj.a.b[\'c\'] = 10;\
                obj.a.b[\'c\'] /= 10;\
                e = obj.a.b[\'c\'];\
                obj.a.b[\'c\'] = 10;\
                obj.a.b[\'c\'] %= 10;\
                f = obj.a.b[\'c\'];\
                obj.a.b[\'c\'] = 10;\
                obj.a.b[\'c\'] <<= 10;\
                g = obj.a.b[\'c\'];\
                obj.a.b[\'c\'] = 10;\
                obj.a.b[\'c\'] >>= 10;\
                h = obj.a.b[\'c\'];\
                obj.a.b[\'c\'] = 10;\
                obj.a.b[\'c\'] >>>= 10;\
                i = obj.a.b[\'c\'];\
                obj.a.b[\'c\'] = 10;\
                obj.a.b[\'c\'] |= 10;\
                j = obj.a.b[\'c\'];\
                obj.a.b[\'c\'] = 10;\
                obj.a.b[\'c\'] ^= 10;\
                k = obj.a.b[\'c\'];\
                obj.a.b[\'c\'] = 10;\
                obj.a.b[\'c\'] &= 10;\
                l = obj.a.b[\'c\'];\
                obj.a.b[\'d\'] = 10;\
                m = obj.a.b[\'d\'];\
                obj.a.b[\'e\'] &= 10;\
                n = obj.a.b[\'e\'];\
                o = someObj.a.b[\'e\'];\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').value, 10);
            assert.equal(rootScope.getReference('b').value, 10 + 10);
            assert.equal(rootScope.getReference('c').value, 10 - 10);
            assert.equal(rootScope.getReference('d').value, 10 * 10);
            assert.equal(rootScope.getReference('e').value, 10 / 10);
            assert.equal(rootScope.getReference('f').value, 10 % 10);
            assert.equal(rootScope.getReference('g').value, 10 << 10);
            assert.equal(rootScope.getReference('h').value, 10 >> 10);
            assert.equal(rootScope.getReference('i').value, 10 >>> 10);
            assert.equal(rootScope.getReference('j').value, 10 | 10);
            assert.equal(rootScope.getReference('k').value, 10 ^ 10);
            assert.equal(rootScope.getReference('l').value, 10 & 10);
            assert.equal(rootScope.getReference('m').value, 10);
            assert.equal(rootScope.getReference('n').value, undefined & 10);
            assert.isUndefined(rootScope.hasReference('o').value);
        });

        it('literal to computed member expression - identifier last', function() {
            var code = '\
                prop = \'c\';\
                propD = \'d\';\
                propE = \'e\';\
                obj = { a: { b: { c: 1 } } };\
                obj.a.b[prop] = 10;\
                a = obj.a.b[prop];\
                obj.a.b[prop] = 10;\
                obj.a.b[prop] += 10;\
                b = obj.a.b[prop];\
                obj.a.b[prop] = 10;\
                obj.a.b[prop] -= 10;\
                c = obj.a.b[prop];\
                obj.a.b[prop] = 10;\
                obj.a.b[prop] *= 10;\
                d = obj.a.b[prop];\
                obj.a.b[prop] = 10;\
                obj.a.b[prop] /= 10;\
                e = obj.a.b[prop];\
                obj.a.b[prop] = 10;\
                obj.a.b[prop] %= 10;\
                f = obj.a.b[prop];\
                obj.a.b[prop] = 10;\
                obj.a.b[prop] <<= 10;\
                g = obj.a.b[prop];\
                obj.a.b[prop] = 10;\
                obj.a.b[prop] >>= 10;\
                h = obj.a.b[prop];\
                obj.a.b[prop] = 10;\
                obj.a.b[prop] >>>= 10;\
                i = obj.a.b[prop];\
                obj.a.b[prop] = 10;\
                obj.a.b[prop] |= 10;\
                j = obj.a.b[prop];\
                obj.a.b[prop] = 10;\
                obj.a.b[prop] ^= 10;\
                k = obj.a.b[prop];\
                obj.a.b[prop] = 10;\
                obj.a.b[prop] &= 10;\
                l = obj.a.b[prop];\
                obj.a.b[propD] = 10;\
                m = obj.a.b[propD];\
                obj.a.b[propE] &= 10;\
                n = obj.a.b[propE];\
                o = someObj.a.b[propE];\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').value, 10);
            assert.equal(rootScope.getReference('b').value, 10 + 10);
            assert.equal(rootScope.getReference('c').value, 10 - 10);
            assert.equal(rootScope.getReference('d').value, 10 * 10);
            assert.equal(rootScope.getReference('e').value, 10 / 10);
            assert.equal(rootScope.getReference('f').value, 10 % 10);
            assert.equal(rootScope.getReference('g').value, 10 << 10);
            assert.equal(rootScope.getReference('h').value, 10 >> 10);
            assert.equal(rootScope.getReference('i').value, 10 >>> 10);
            assert.equal(rootScope.getReference('j').value, 10 | 10);
            assert.equal(rootScope.getReference('k').value, 10 ^ 10);
            assert.equal(rootScope.getReference('l').value, 10 & 10);
            assert.equal(rootScope.getReference('m').value, 10);
            assert.equal(rootScope.getReference('n').value, undefined & 10);
            assert.isUndefined(rootScope.hasReference('o').value);
        });

        it('identifier to member expression', function() {
            var code = '\
                value = 10;\
                obj = { a: { b: { c: 1 } } };\
                obj.a.b.c = value;\
                a = obj.a.b.c;\
                obj.a.b.c = value;\
                obj.a.b.c += value;\
                b = obj.a.b.c;\
                obj.a.b.c = value;\
                obj.a.b.c -= value;\
                c = obj.a.b.c;\
                obj.a.b.c = value;\
                obj.a.b.c *= value;\
                d = obj.a.b.c;\
                obj.a.b.c = value;\
                obj.a.b.c /= value;\
                e = obj.a.b.c;\
                obj.a.b.c = value;\
                obj.a.b.c %= value;\
                f = obj.a.b.c;\
                obj.a.b.c = value;\
                obj.a.b.c <<= value;\
                g = obj.a.b.c;\
                obj.a.b.c = value;\
                obj.a.b.c >>= value;\
                h = obj.a.b.c;\
                obj.a.b.c = value;\
                obj.a.b.c >>>= value;\
                i = obj.a.b.c;\
                obj.a.b.c = value;\
                obj.a.b.c |= value;\
                j = obj.a.b.c;\
                obj.a.b.c = value;\
                obj.a.b.c ^= value;\
                k = obj.a.b.c;\
                obj.a.b.c = value;\
                obj.a.b.c &= value;\
                l = obj.a.b.c;\
                obj.a.b.d = value;\
                m = obj.a.b.d;\
                obj.a.b.e &= value;\
                n = obj.a.b.e;\
                o = someObj.a.b.e;\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').value, 10);
            assert.equal(rootScope.getReference('b').value, 10 + 10);
            assert.equal(rootScope.getReference('c').value, 10 - 10);
            assert.equal(rootScope.getReference('d').value, 10 * 10);
            assert.equal(rootScope.getReference('e').value, 10 / 10);
            assert.equal(rootScope.getReference('f').value, 10 % 10);
            assert.equal(rootScope.getReference('g').value, 10 << 10);
            assert.equal(rootScope.getReference('h').value, 10 >> 10);
            assert.equal(rootScope.getReference('i').value, 10 >>> 10);
            assert.equal(rootScope.getReference('j').value, 10 | 10);
            assert.equal(rootScope.getReference('k').value, 10 ^ 10);
            assert.equal(rootScope.getReference('l').value, 10 & 10);
            assert.equal(rootScope.getReference('m').value, 10);
            assert.equal(rootScope.getReference('n').value, undefined & 10);
            assert.isUndefined(rootScope.hasReference('o').value);
        });

        it('identifier to computed member expression - literal', function() {
            var code = '\
                value = 10;\
                obj = { a: { b: { c: 1 } } };\
                obj.a[\'b\'].c = value;\
                a = obj.a[\'b\'].c;\
                obj.a[\'b\'].c = value;\
                obj.a[\'b\'].c += value;\
                b = obj.a[\'b\'].c;\
                obj.a[\'b\'].c = value;\
                obj.a[\'b\'].c -= value;\
                c = obj.a[\'b\'].c;\
                obj.a[\'b\'].c = value;\
                obj.a[\'b\'].c *= value;\
                d = obj.a[\'b\'].c;\
                obj.a[\'b\'].c = value;\
                obj.a[\'b\'].c /= value;\
                e = obj.a[\'b\'].c;\
                obj.a[\'b\'].c = value;\
                obj.a[\'b\'].c %= value;\
                f = obj.a[\'b\'].c;\
                obj.a[\'b\'].c = value;\
                obj.a[\'b\'].c <<= value;\
                g = obj.a[\'b\'].c;\
                obj.a[\'b\'].c = value;\
                obj.a[\'b\'].c >>= value;\
                h = obj.a[\'b\'].c;\
                obj.a[\'b\'].c = value;\
                obj.a[\'b\'].c >>>= value;\
                i = obj.a[\'b\'].c;\
                obj.a[\'b\'].c = value;\
                obj.a[\'b\'].c |= value;\
                j = obj.a[\'b\'].c;\
                obj.a[\'b\'].c = value;\
                obj.a[\'b\'].c ^= value;\
                k = obj.a[\'b\'].c;\
                obj.a[\'b\'].c = value;\
                obj.a[\'b\'].c &= value;\
                l = obj.a[\'b\'].c;\
                obj.a[\'b\'].d = value;\
                m = obj.a[\'b\'].d;\
                obj.a[\'b\'].e &= value;\
                n = obj.a[\'b\'].e;\
                o = someObj.a[\'b\'].e;\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').value, 10);
            assert.equal(rootScope.getReference('b').value, 10 + 10);
            assert.equal(rootScope.getReference('c').value, 10 - 10);
            assert.equal(rootScope.getReference('d').value, 10 * 10);
            assert.equal(rootScope.getReference('e').value, 10 / 10);
            assert.equal(rootScope.getReference('f').value, 10 % 10);
            assert.equal(rootScope.getReference('g').value, 10 << 10);
            assert.equal(rootScope.getReference('h').value, 10 >> 10);
            assert.equal(rootScope.getReference('i').value, 10 >>> 10);
            assert.equal(rootScope.getReference('j').value, 10 | 10);
            assert.equal(rootScope.getReference('k').value, 10 ^ 10);
            assert.equal(rootScope.getReference('l').value, 10 & 10);
            assert.equal(rootScope.getReference('m').value, 10);
            assert.equal(rootScope.getReference('n').value, undefined & 10);
            assert.isUndefined(rootScope.hasReference('o').value);
        });

        it('identifier to computed member expression - identifier', function() {
            var code = '\
                value = 10;\
                prop = \'b\';\
                obj = { a: { b: { c: 1 } } };\
                obj.a[prop].c = value;\
                a = obj.a[prop].c;\
                obj.a[prop].c = value;\
                obj.a[prop].c += value;\
                b = obj.a[prop].c;\
                obj.a[prop].c = value;\
                obj.a[prop].c -= value;\
                c = obj.a[prop].c;\
                obj.a[prop].c = value;\
                obj.a[prop].c *= value;\
                d = obj.a[prop].c;\
                obj.a[prop].c = value;\
                obj.a[prop].c /= value;\
                e = obj.a[prop].c;\
                obj.a[prop].c = value;\
                obj.a[prop].c %= value;\
                f = obj.a[prop].c;\
                obj.a[prop].c = value;\
                obj.a[prop].c <<= value;\
                g = obj.a[prop].c;\
                obj.a[prop].c = value;\
                obj.a[prop].c >>= value;\
                h = obj.a[prop].c;\
                obj.a[prop].c = value;\
                obj.a[prop].c >>>= value;\
                i = obj.a[prop].c;\
                obj.a[prop].c = value;\
                obj.a[prop].c |= value;\
                j = obj.a[prop].c;\
                obj.a[prop].c = value;\
                obj.a[prop].c ^= value;\
                k = obj.a[prop].c;\
                obj.a[prop].c = value;\
                obj.a[prop].c &= value;\
                l = obj.a[prop].c;\
                obj.a[prop].d = value;\
                m = obj.a[prop].d;\
                obj.a[prop].e &= value;\
                n = obj.a[prop].e;\
                o = someObj.a[prop].e;\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').value, 10);
            assert.equal(rootScope.getReference('b').value, 10 + 10);
            assert.equal(rootScope.getReference('c').value, 10 - 10);
            assert.equal(rootScope.getReference('d').value, 10 * 10);
            assert.equal(rootScope.getReference('e').value, 10 / 10);
            assert.equal(rootScope.getReference('f').value, 10 % 10);
            assert.equal(rootScope.getReference('g').value, 10 << 10);
            assert.equal(rootScope.getReference('h').value, 10 >> 10);
            assert.equal(rootScope.getReference('i').value, 10 >>> 10);
            assert.equal(rootScope.getReference('j').value, 10 | 10);
            assert.equal(rootScope.getReference('k').value, 10 ^ 10);
            assert.equal(rootScope.getReference('l').value, 10 & 10);
            assert.equal(rootScope.getReference('m').value, 10);
            assert.equal(rootScope.getReference('n').value, undefined & 10);
            assert.isUndefined(rootScope.hasReference('o').value);
        });

        it('identifier to computed member expression - literal last', function() {
            var code = '\
                obj = { a: { b: { c: 1 } } };\
                obj.a.b[\'c\'] = 10;\
                a = obj.a.b[\'c\'];\
                obj.a.b[\'c\'] = 10;\
                obj.a.b[\'c\'] += 10;\
                b = obj.a.b[\'c\'];\
                obj.a.b[\'c\'] = 10;\
                obj.a.b[\'c\'] -= 10;\
                c = obj.a.b[\'c\'];\
                obj.a.b[\'c\'] = 10;\
                obj.a.b[\'c\'] *= 10;\
                d = obj.a.b[\'c\'];\
                obj.a.b[\'c\'] = 10;\
                obj.a.b[\'c\'] /= 10;\
                e = obj.a.b[\'c\'];\
                obj.a.b[\'c\'] = 10;\
                obj.a.b[\'c\'] %= 10;\
                f = obj.a.b[\'c\'];\
                obj.a.b[\'c\'] = 10;\
                obj.a.b[\'c\'] <<= 10;\
                g = obj.a.b[\'c\'];\
                obj.a.b[\'c\'] = 10;\
                obj.a.b[\'c\'] >>= 10;\
                h = obj.a.b[\'c\'];\
                obj.a.b[\'c\'] = 10;\
                obj.a.b[\'c\'] >>>= 10;\
                i = obj.a.b[\'c\'];\
                obj.a.b[\'c\'] = 10;\
                obj.a.b[\'c\'] |= 10;\
                j = obj.a.b[\'c\'];\
                obj.a.b[\'c\'] = 10;\
                obj.a.b[\'c\'] ^= 10;\
                k = obj.a.b[\'c\'];\
                obj.a.b[\'c\'] = 10;\
                obj.a.b[\'c\'] &= 10;\
                l = obj.a.b[\'c\'];\
                obj.a.b[\'d\'] = 10;\
                m = obj.a.b[\'d\'];\
                obj.a.b[\'e\'] &= 10;\
                n = obj.a.b[\'e\'];\
                o = someObj.a.b[\'e\'];\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').value, 10);
            assert.equal(rootScope.getReference('b').value, 10 + 10);
            assert.equal(rootScope.getReference('c').value, 10 - 10);
            assert.equal(rootScope.getReference('d').value, 10 * 10);
            assert.equal(rootScope.getReference('e').value, 10 / 10);
            assert.equal(rootScope.getReference('f').value, 10 % 10);
            assert.equal(rootScope.getReference('g').value, 10 << 10);
            assert.equal(rootScope.getReference('h').value, 10 >> 10);
            assert.equal(rootScope.getReference('i').value, 10 >>> 10);
            assert.equal(rootScope.getReference('j').value, 10 | 10);
            assert.equal(rootScope.getReference('k').value, 10 ^ 10);
            assert.equal(rootScope.getReference('l').value, 10 & 10);
            assert.equal(rootScope.getReference('m').value, 10);
            assert.equal(rootScope.getReference('n').value, undefined & 10);
            assert.isUndefined(rootScope.hasReference('o').value);
        });

        it('identifier to computed member expression - identifier last', function() {
            var code = '\
                value = 10;\
                prop = \'c\';\
                propD = \'d\';\
                propE = \'e\';\
                obj = { a: { b: { c: 1 } } };\
                obj.a.b[prop] = value;\
                a = obj.a.b[prop];\
                obj.a.b[prop] = value;\
                obj.a.b[prop] += value;\
                b = obj.a.b[prop];\
                obj.a.b[prop] = value;\
                obj.a.b[prop] -= value;\
                c = obj.a.b[prop];\
                obj.a.b[prop] = value;\
                obj.a.b[prop] *= value;\
                d = obj.a.b[prop];\
                obj.a.b[prop] = value;\
                obj.a.b[prop] /= value;\
                e = obj.a.b[prop];\
                obj.a.b[prop] = value;\
                obj.a.b[prop] %= value;\
                f = obj.a.b[prop];\
                obj.a.b[prop] = value;\
                obj.a.b[prop] <<= value;\
                g = obj.a.b[prop];\
                obj.a.b[prop] = value;\
                obj.a.b[prop] >>= value;\
                h = obj.a.b[prop];\
                obj.a.b[prop] = value;\
                obj.a.b[prop] >>>= value;\
                i = obj.a.b[prop];\
                obj.a.b[prop] = value;\
                obj.a.b[prop] |= value;\
                j = obj.a.b[prop];\
                obj.a.b[prop] = value;\
                obj.a.b[prop] ^= value;\
                k = obj.a.b[prop];\
                obj.a.b[prop] = value;\
                obj.a.b[prop] &= value;\
                l = obj.a.b[prop];\
                obj.a.b[propD] = value;\
                m = obj.a.b[propD];\
                obj.a.b[propE] &= value;\
                n = obj.a.b[propE];\
                o = someObj.a.b[propE];\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').value, 10);
            assert.equal(rootScope.getReference('b').value, 10 + 10);
            assert.equal(rootScope.getReference('c').value, 10 - 10);
            assert.equal(rootScope.getReference('d').value, 10 * 10);
            assert.equal(rootScope.getReference('e').value, 10 / 10);
            assert.equal(rootScope.getReference('f').value, 10 % 10);
            assert.equal(rootScope.getReference('g').value, 10 << 10);
            assert.equal(rootScope.getReference('h').value, 10 >> 10);
            assert.equal(rootScope.getReference('i').value, 10 >>> 10);
            assert.equal(rootScope.getReference('j').value, 10 | 10);
            assert.equal(rootScope.getReference('k').value, 10 ^ 10);
            assert.equal(rootScope.getReference('l').value, 10 & 10);
            assert.equal(rootScope.getReference('m').value, 10);
            assert.equal(rootScope.getReference('n').value, undefined & 10);
            assert.isUndefined(rootScope.hasReference('o').value);
        });

        it('object (literal) to member expression', function() {
            var code = '\
                var a = { b: 1, c: { d: 2 } };\
                a.c.d = { e: 20, f: 30 };\
                var b = a.c.d,\
                c = a.c.d.e';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('a').value, { b: 1, c: { d: { e: 20, f: 30 } } });
            assert.deepEqual(rootScope.getReference('b').value, { e: 20, f: 30 });
            assert.strictEqual(rootScope.getReference('c').value, 20);
        });

        it('object (identifier) to member expression', function() {
            var code = '\
                var a = { b: 1, c: { d: 2 } },\
                newValue = { e: 20, f: 30 };\
                a.c.d = newValue;\
                var b = a.c.d,\
                c = a.c.d.e';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('a').value, { b: 1, c: { d: { e: 20, f: 30 } } });
            assert.deepEqual(rootScope.getReference('b').value, { e: 20, f: 30 });
            assert.strictEqual(rootScope.getReference('c').value, 20);
        });

        it('member expression to member expression', function() {
            var code = '\
                value = 10;\
                obj1 = { a: { b: { c: 1 } } };\
                obj2 = { a: { b: { c: 1 } } };\
                obj1.a.b.c = value;\
                obj2.a.b.c = obj1.a.b.c;\
                a = obj2.a.b.c;\
                obj1.a.b.c = value;\
                obj2.a.b.c = value;\
                obj2.a.b.c += obj1.a.b.c;\
                b = obj2.a.b.c;\
                obj1.a.b.c = value;\
                obj2.a.b.c = value;\
                obj2.a.b.c -= obj1.a.b.c;\
                c = obj2.a.b.c;\
                obj1.a.b.c = value;\
                obj2.a.b.c = value;\
                obj2.a.b.c *= obj1.a.b.c;\
                d = obj2.a.b.c;\
                obj1.a.b.c = value;\
                obj2.a.b.c = value;\
                obj2.a.b.c /= obj1.a.b.c;\
                e = obj2.a.b.c;\
                obj1.a.b.c = value;\
                obj2.a.b.c = value;\
                obj2.a.b.c %= obj1.a.b.c;\
                f = obj2.a.b.c;\
                obj1.a.b.c = value;\
                obj2.a.b.c = value;\
                obj2.a.b.c <<= obj1.a.b.c;\
                g = obj2.a.b.c;\
                obj1.a.b.c = value;\
                obj2.a.b.c = value;\
                obj2.a.b.c >>= obj1.a.b.c;\
                h = obj2.a.b.c;\
                obj1.a.b.c = value;\
                obj2.a.b.c = value;\
                obj2.a.b.c >>>= obj1.a.b.c;\
                i = obj2.a.b.c;\
                obj1.a.b.c = value;\
                obj2.a.b.c = value;\
                obj2.a.b.c |= obj1.a.b.c;\
                j = obj2.a.b.c;\
                obj1.a.b.c = value;\
                obj2.a.b.c = value;\
                obj2.a.b.c ^= obj1.a.b.c;\
                k = obj2.a.b.c;\
                obj1.a.b.c = value;\
                obj2.a.b.c = value;\
                obj2.a.b.c &= obj1.a.b.c;\
                l = obj2.a.b.c;\
                obj1.a.b.d = value;\
                obj2.a.b.d = value;\
                m = obj2.a.b.d;\
                obj2.a.b.e &= obj1.a.b.e;\
                n = obj2.a.b.e;\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').value, 10);
            assert.equal(rootScope.getReference('b').value, 10 + 10);
            assert.equal(rootScope.getReference('c').value, 10 - 10);
            assert.equal(rootScope.getReference('d').value, 10 * 10);
            assert.equal(rootScope.getReference('e').value, 10 / 10);
            assert.equal(rootScope.getReference('f').value, 10 % 10);
            assert.equal(rootScope.getReference('g').value, 10 << 10);
            assert.equal(rootScope.getReference('h').value, 10 >> 10);
            assert.equal(rootScope.getReference('i').value, 10 >>> 10);
            assert.equal(rootScope.getReference('j').value, 10 | 10);
            assert.equal(rootScope.getReference('k').value, 10 ^ 10);
            assert.equal(rootScope.getReference('l').value, 10 & 10);
            assert.equal(rootScope.getReference('m').value, 10);
            assert.equal(rootScope.getReference('n').value, undefined & undefined);
        });

        it('computed member expression to computed member expression', function() {
            var code = '\
                value = 10;\
                obj1 = { a: { b: { c: 1 } } };\
                obj2 = { a: { b: { c: 1 } } };\
                obj1.a.b.c = value;\
                obj2.a.b.c = obj1.a.b.c;\
                a = obj2.a.b.c;\
                obj1.a.b.c = value;\
                obj2.a.b.c = value;\
                obj2.a.b.c += obj1.a.b.c;\
                b = obj2.a.b.c;\
                obj1.a.b.c = value;\
                obj2.a.b.c = value;\
                obj2.a.b.c -= obj1.a.b.c;\
                c = obj2.a.b.c;\
                obj1.a.b.c = value;\
                obj2.a.b.c = value;\
                obj2.a.b.c *= obj1.a.b.c;\
                d = obj2.a.b.c;\
                obj1.a.b.c = value;\
                obj2.a.b.c = value;\
                obj2.a.b.c /= obj1.a.b.c;\
                e = obj2.a.b.c;\
                obj1.a.b.c = value;\
                obj2.a.b.c = value;\
                obj2.a.b.c %= obj1.a.b.c;\
                f = obj2.a.b.c;\
                obj1.a.b.c = value;\
                obj2.a.b.c = value;\
                obj2.a.b.c <<= obj1.a.b.c;\
                g = obj2.a.b.c;\
                obj1.a.b.c = value;\
                obj2.a.b.c = value;\
                obj2.a.b.c >>= obj1.a.b.c;\
                h = obj2.a.b.c;\
                obj1.a.b.c = value;\
                obj2.a.b.c = value;\
                obj2.a.b.c >>>= obj1.a.b.c;\
                i = obj2.a.b.c;\
                obj1.a.b.c = value;\
                obj2.a.b.c = value;\
                obj2.a.b.c |= obj1.a.b.c;\
                j = obj2.a.b.c;\
                obj1.a.b.c = value;\
                obj2.a.b.c = value;\
                obj2.a.b.c ^= obj1.a.b.c;\
                k = obj2.a.b.c;\
                obj1.a.b.c = value;\
                obj2.a.b.c = value;\
                obj2.a.b.c &= obj1.a.b.c;\
                l = obj2.a.b.c;\
                obj1.a.b.d = value;\
                obj2.a.b.d = value;\
                m = obj2.a.b.d;\
                obj2.a.b.e &= obj1.a.b.e;\
                n = obj2.a.b.e;\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').value, 10);
            assert.equal(rootScope.getReference('b').value, 10 + 10);
            assert.equal(rootScope.getReference('c').value, 10 - 10);
            assert.equal(rootScope.getReference('d').value, 10 * 10);
            assert.equal(rootScope.getReference('e').value, 10 / 10);
            assert.equal(rootScope.getReference('f').value, 10 % 10);
            assert.equal(rootScope.getReference('g').value, 10 << 10);
            assert.equal(rootScope.getReference('h').value, 10 >> 10);
            assert.equal(rootScope.getReference('i').value, 10 >>> 10);
            assert.equal(rootScope.getReference('j').value, 10 | 10);
            assert.equal(rootScope.getReference('k').value, 10 ^ 10);
            assert.equal(rootScope.getReference('l').value, 10 & 10);
            assert.equal(rootScope.getReference('m').value, 10);
            assert.equal(rootScope.getReference('n').value, undefined & undefined);
        });

        it('multi assignment', function() {
            var code = '\
                var a = 10, b = 10, c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0;\
                c += a += b += b += a += a;\
                a = 10;\
                b = 10;\
                d -= a -= b -= b -= a -= a;\
                a = 10;\
                b = 10;\
                e *= a *= b *= b *= a *= a;\
                a = 10;\
                b = 10;\
                f /= a /= b /= b /= a /= a;\
                a = 10;\
                b = 10;\
                g %= a %= b %= b %= a %= a;\
                a = 10;\
                b = 10;\
                h <<= a <<= b <<= b <<= a <<= a;\
                a = 10;\
                b = 10;\
                i >>= a >>= b >>= b >>= a >>= a;\
                a = 10;\
                b = 10;\
                j >>>= a >>>= b >>>= b >>>= a >>>= a;\
                a = 10;\
                b = 10;\
                k |= a |= b |= b |= a |= a;\
                a = 10;\
                b = 10;\
                l ^= a ^= b ^= b ^= a ^= a;\
                a = 10;\
                b = 10;\
                m &= a &= b &= b &= a &= a;\
            ';
            var ast = parser.parse(code);
            var a = 10;
            var b = 10;
            var c = 0;

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('c').value, c += a += b += b += a += a);
            a = b = 10;
            c = 0;
            assert.equal(rootScope.getReference('d').value, c -= a -= b -= b -= a -= a);
            c = 0;
            a = b = 10;
            assert.equal(rootScope.getReference('e').value, c *= a *= b *= b *= a *= a);
            c = 0;
            a = b = 10;
            assert.equal(rootScope.getReference('f').value, c /= a /= b /= b /= a /= a);
            c = 0;
            a = b = 10;
            assert.isNaN(rootScope.getReference('g').value);
            assert.equal(rootScope.getReference('h').value, c <<= a <<= b <<= b <<= a <<= a);
            c = 0;
            a = b = 10;
            assert.equal(rootScope.getReference('i').value, c >>= a >>= b >>= b >>= a >>= a);
            c = 0;
            a = b = 10;
            assert.equal(rootScope.getReference('j').value, c >>>= a >>>= b >>>= b >>>= a >>>= a);
            c = 0;
            a = b = 10;
            assert.equal(rootScope.getReference('k').value, c |= a |= b |= b |= a |= a);
            c = 0;
            a = b = 10;
            assert.equal(rootScope.getReference('l').value, c ^= a ^= b ^= b ^= a ^= a);
            c = 0;
            a = b = 10;
            assert.equal(rootScope.getReference('m').value, c &= a &= b &= b &= a &= a);
            c = 0;
            a = b = 10;
        });

        it('multi assignment - member expressions;', function() {
            var code = '\
                propB = \'b\';\
                propC = \'c\';\
                propD = \'d\';\
                propE = \'e\';\
                value = 10;\
                obj = { a: { b: { c: 1 } } };\
                obj.a[\'b\'][propC] = value = value;\
                a = obj.a[\'b\'][propC];\
                obj.a[\'b\'][propC] = value;\
                obj.a[\'b\'][propC] += obj.a[\'b\'][propC] += obj.a[\'b\'][propC];\
                b = obj.a[\'b\'][propC];\
                obj.a[\'b\'][propC] = value;\
                obj.a[\'b\'][propC] -= obj.a[\'b\'][propC] -= obj.a[\'b\'][propC];\
                c = obj.a[\'b\'][propC];\
                obj.a[\'b\'][propC] = value;\
                obj.a[\'b\'][propC] *= obj.a[\'b\'][propC] *= obj.a[\'b\'][propC];\
                d = obj.a[\'b\'][propC];\
                obj.a[\'b\'][propC] = value;\
                obj.a[\'b\'][propC] /= obj.a[\'b\'][propC] /= obj.a[\'b\'][propC];\
                e = obj.a[\'b\'][propC];\
                obj.a[\'b\'][propC] = value;\
                obj.a[\'b\'][propC] %= obj.a[\'b\'][propC] %= obj.a[\'b\'][propC];\
                f = obj.a[\'b\'][propC];\
                obj.a[\'b\'][propC] = value;\
                obj.a[\'b\'][propC] <<= obj.a[\'b\'][propC] <<= obj.a[\'b\'][propC];\
                g = obj.a[\'b\'][propC];\
                obj.a[\'b\'][propC] = value;\
                obj.a[\'b\'][propC] >>= obj.a[\'b\'][propC] >>= obj.a[\'b\'][propC];\
                h = obj.a[\'b\'][propC];\
                obj.a[\'b\'][propC] = value;\
                obj.a[\'b\'][propC] >>>= obj.a[\'b\'][propC] >>>= obj.a[\'b\'][propC];\
                i = obj.a[\'b\'][propC];\
                obj.a[\'b\'][propC] = value;\
                obj.a[\'b\'][propC] |= obj.a[\'b\'][propC] |= obj.a[\'b\'][propC];\
                j = obj.a[\'b\'][propC];\
                obj.a[\'b\'][propC] = value;\
                obj.a[\'b\'][propC] ^= obj.a[\'b\'][propC] ^= obj.a[\'b\'][propC];\
                k = obj.a[\'b\'][propC];\
                obj.a[\'b\'][propC] = value;\
                obj.a[\'b\'][propC] &= obj.a[\'b\'][propC] &= obj.a[\'b\'][propC];\
                l = obj.a[\'b\'][propC];\
                obj.a[\'b\'][propD] = value;\
                m = obj.a[\'b\'][propD];\
                obj.a[\'b\'][propE] &= obj.a[\'b\'][propE] &= value;\
                n = obj.a[\'b\'][propE];\
                o = someObj.a[\'b\'][propE] &= someObj.a[\'b\'][propE] &= someObj.a[\'b\'][propE];\
            ';
            var ast = parser.parse(code);
            var a = 10;

            processNames(ast, rootScope);
            processValues(ast);

            assert.equal(rootScope.getReference('a').value, a);
            assert.equal(rootScope.getReference('b').value, a += a += a);
            a = 10;
            assert.equal(rootScope.getReference('c').value, a -= a -= a);
            a = 10;
            assert.equal(rootScope.getReference('d').value, a *= a *= a);
            a = 10;
            assert.equal(rootScope.getReference('e').value, a /= a /= a);
            a = 10;
            assert.isNaN(rootScope.getReference('f').value);
            a = 10;
            assert.equal(rootScope.getReference('g').value, a <<= a <<= a);
            a = 10;
            assert.equal(rootScope.getReference('h').value, a >>= a >>= a);
            a = 10;
            assert.equal(rootScope.getReference('i').value, a >>>= a >>>= a);
            a = 10;
            assert.equal(rootScope.getReference('j').value, a |= a |= a);
            a = 10;
            assert.equal(rootScope.getReference('k').value, a ^= a ^= a);
            a = 10;
            assert.equal(rootScope.getReference('l').value, a &= a &= a);
            a = 10;
            assert.equal(rootScope.getReference('m').value, a);
            assert.equal(rootScope.getReference('n').value, undefined & undefined & a);
            assert.isUndefined(rootScope.hasReference('o').value);
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
            var ast = parser.parse(code);

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
                    var v = 0;\
                    1 * function(){ v++ }();\
                    1 == function(){ v++ }();\
                ';
            var ast = parser.parse(code);

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
            assert.strictEqual(rootScope.getReference('v').value, 2);
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
            var ast = parser.parse(code);

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
            var ast = parser.parse(code);

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
            var ast = parser.parse(code);

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
            var ast = parser.parse(code);

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
            var ast = parser.parse(code);

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
            var ast = parser.parse(code);

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
            var ast = parser.parse(code);

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
                var ast = parser.parse(code);

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
                var ast = parser.parse(code);

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
                var ast = parser.parse(code);

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
            var ast = parser.parse(code);

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
                    var j = 0;\
                    function fn() { j++ }\
                    !fn();\
                    !!fn();\
                    +fn();\
                    -fn();\
                ';
            var ast = parser.parse(code);

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
            assert.strictEqual(rootScope.getReference('j').value, 4);
        });

        it('member expression', function() {
            var code = '\
                    var obj = { a: { b: { c: 1, fn() { j++ } } } };\
                    var a = -obj.a.b.c;\
                    var b = -(-obj.a.b.c);\
                    var c = +obj.a.b.c;\
                    var d = +-obj.a.b.c;\
                    var e = !obj.a.b.c;\
                    var f = !!obj.a.b.c;\
                    var g = ~obj.a.b.c;\
                    var h = typeof obj.a.b.c;\
                    var i = void obj.a.b.c;\
                    var j = 0;\
                    !obj.a.b.fn();\
                    !!obj.a.b.fn();\
                    +obj.a.b.fn();\
                    -obj.a.b.fn();\
                ';
            var ast = parser.parse(code);

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
            assert.strictEqual(rootScope.getReference('j').value, 4);
        });

        it('computed member expression', function() {
            var code = '\
                    var prop = \'c\';\
                    var propFn = \'fn\';\
                    var obj = { a: { b: { c: 1, fn() { j++ } } } };\
                    var a = -obj.a.b[prop];\
                    var b = -(-obj.a.b[prop]);\
                    var c = +obj.a.b[prop];\
                    var d = +-obj.a.b[prop];\
                    var e = !obj.a.b[prop];\
                    var f = !!obj.a.b[prop];\
                    var g = ~obj.a.b[prop];\
                    var h = typeof obj.a.b[prop];\
                    var i = void obj.a.b[prop];\
                    var j = 0;\
                    !obj.a.b[propFn]();\
                    !!obj.a.b[propFn]();\
                    +obj.a.b[propFn]();\
                    -obj.a.b[propFn]();\
                ';
            var ast = parser.parse(code);

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
            assert.strictEqual(rootScope.getReference('j').value, 4);
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
                    var i = void { a: { b: { fn() { j++ } } } }.a.b.c;\
                    var j = 0;\
                    !{ a: { b: { fn() { j++ }} } }.a.b.fn();\
                    !!{ a: { b: { fn() { j++ } } } }.a.b.fn();\
                    +{ a: { b: { fn() { j++ } } } }.a.b.fn();\
                    -{ a: { b: { fn() { j++ } } } }.a.b.fn();\
                ';
            var ast = parser.parse(code);

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
            assert.strictEqual(rootScope.getReference('j').value, 4);
        });

        describe('delete', function() {
            it('literal', function() {
                var code = '\
                        var a = delete 1\
                    ';
                var ast = parser.parse(code);

                processNames(ast, rootScope);
                processValues(ast);

                assert.isTrue(rootScope.getReference('a').value);
            });

            it('identifier', function() {
                var code = '\
                        var prop = 1;\
                        var a = delete prop\
                    ';
                var ast = parser.parse(code);

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
                var ast = parser.parse(code);

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
                var ast = parser.parse(code);

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
                var ast = parser.parse(code);

                processNames(ast, rootScope);
                processValues(ast);

                assert.isTrue(rootScope.getReference('a').value);
            });

            it('undefined identifier', function() {
                var code = '\
                        var a = delete obj.a.b.d;\
                    ';
                var ast = parser.parse(code);

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
                    var f = 0;\
                    f++;\
                    f++;\
                ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, 1);
            assert.strictEqual(rootScope.getReference('b').value, 2);
            assert.strictEqual(rootScope.getReference('c').value, 2);
            assert.strictEqual(rootScope.getReference('d').value, 2);
            assert.strictEqual(rootScope.getReference('e').value, 2);
            assert.strictEqual(rootScope.getReference('f').value, 2);
        });

        it('member expression', function() {
            var code = '\
                    var obj = { a: { b: { c: 1 } } };\
                    var c = ++obj.a.b.c;\
                    var d = obj.a.b.c++;\
                    var e = --obj.a.b.c;\
                    var f = obj.a.b.c--;\
                    var a = obj.a.b.c;\
                    obj.a.b.c++;\
                    obj.a.b.c++;\
                    var b = obj.a.b.c;\
                ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, 1);
            assert.strictEqual(rootScope.getReference('b').value, 3);
            assert.strictEqual(rootScope.getReference('c').value, 2);
            assert.strictEqual(rootScope.getReference('d').value, 2);
            assert.strictEqual(rootScope.getReference('e').value, 2);
            assert.strictEqual(rootScope.getReference('f').value, 2);
        });

        it('computed member expression', function() {
            var code = '\
                    var prop = \'c\';\
                    var obj = { a: { b: { c: 1 } } };\
                    var c = ++obj.a.b[prop];\
                    var d = obj.a.b[prop]++;\
                    var e = --obj.a.b[prop];\
                    var f = obj.a.b[prop]--;\
                    var a = obj.a.b[prop];\
                    obj.a.b[prop]++;\
                    obj.a.b[prop]++;\
                    var b = obj.a.b[prop];\
                ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, 1);
            assert.strictEqual(rootScope.getReference('b').value, 3);
            assert.strictEqual(rootScope.getReference('c').value, 2);
            assert.strictEqual(rootScope.getReference('d').value, 2);
            assert.strictEqual(rootScope.getReference('e').value, 2);
            assert.strictEqual(rootScope.getReference('f').value, 2);
        });

        it('undefined identifier', function() {
            var code = '\
                    var b = ++a;\
                    var c = a++;\
                    var d = --a;\
                    var e = a--;\
                    a--\
                ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.isFalse(rootScope.hasReference('a'));
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
            var ast = parser.parse(code);

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
                    obj.a.b.c--;\
                ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.isFalse(rootScope.hasReference('obj'));
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
                    var e = 0;\
                    function fn(){ e++ }\
                    0 || fn();\
                    1 || fn();\
                    1 && fn();\
                    0 && fn();\
                ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, 1);
            assert.strictEqual(rootScope.getReference('b').value, 0);
            assert.strictEqual(rootScope.getReference('c').value, 1);
            assert.strictEqual(rootScope.getReference('d').value, 1);
            assert.strictEqual(rootScope.getReference('e').value, 2);
        });

        it('identifier', function() {
            var code = '\
                    var one = 1;\
                    var zero = 0;\
                    var a = one && one;\
                    var b = zero && one;\
                    var c = one || one;\
                    var d = zero || one;\
                    var e = zero;\
                    function fn(){ e++ }\
                    zero || fn();\
                    one || fn();\
                    one && fn();\
                    zero && fn();\
                ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, 1);
            assert.strictEqual(rootScope.getReference('b').value, 0);
            assert.strictEqual(rootScope.getReference('c').value, 1);
            assert.strictEqual(rootScope.getReference('d').value, 1);
            assert.strictEqual(rootScope.getReference('e').value, 2);
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
                    var e = zero;\
                    obj.a.b.c.f = function fn(){ e++ };\
                    zero || obj.a.b.c.f();\
                    one || obj.a.b.c.f();\
                    one && obj.a.b.c.f();\
                    zero && obj.a.b.c.f();\
                ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, 1);
            assert.strictEqual(rootScope.getReference('b').value, 0);
            assert.strictEqual(rootScope.getReference('c').value, 1);
            assert.strictEqual(rootScope.getReference('d').value, 1);
            assert.strictEqual(rootScope.getReference('e').value, 2);
        });

        it('computed member expression', function() {
            var code = '\
                    var propD = \'d\';\
                    var propE = \'e\';\
                    var propF = \'f\';\
                    var obj = { a: { b: { c: { d: 1, e: 0 } } } };\
                    var one = 1;\
                    var zero = 0;\
                    var a = obj.a.b.c[propD] && one;\
                    var b = obj.a.b.c[propE] && zero;\
                    var c = obj.a.b.c[propD] || one;\
                    var d = obj.a.b.c[propE] || one;\
                    var e = zero;\
                    obj.a.b.c.f = function fn(){ e++ };\
                    zero || obj.a.b.c[propF]();\
                    one || obj.a.b.c[propF]();\
                    one && obj.a.b.c[propF]();\
                    zero && obj.a.b.c[propF]();\
                ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, 1);
            assert.strictEqual(rootScope.getReference('b').value, 0);
            assert.strictEqual(rootScope.getReference('c').value, 1);
            assert.strictEqual(rootScope.getReference('d').value, 1);
            assert.strictEqual(rootScope.getReference('e').value, 2);
        });

        it('object + member expression', function() {
            var code = '\
                    var one = 1;\
                    var zero = 0;\
                    var a = { a: { b: { c: 1 } } }.a.b.c && one;\
                    var b = { a: { b: { c: 0 } } }.a.b.c && zero;\
                    var c = { a: { b: { c: 1 } } }.a.b.c || one;\
                    var d = { a: { b: { c: 0 } } }.a.b.c || one;\
                    var e = zero;\
                    zero || { a: { b: { c: 1, fn(){ e++ } } } }.a.b.fn();\
                    one || { a: { b: { c: 1, fn(){ e++ } } } }.a.b.fn();\
                    one && { a: { b: { c: 1, fn(){ e++ } } } }.a.b.fn();\
                    zero && { a: { b: { c: 1, fn(){ e++ } } } }.a.b.fn();\
                ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, 1);
            assert.strictEqual(rootScope.getReference('b').value, 0);
            assert.strictEqual(rootScope.getReference('c').value, 1);
            assert.strictEqual(rootScope.getReference('d').value, 1);
            assert.strictEqual(rootScope.getReference('e').value, 2);
        });

        it('multi logical expression - literal', function() {
            var code = '\
                    var a = (1 || 0) && (0 || 1);\
                    var b = (0 && 1) && (0 || 0);\
                    var c = (1 || 1) || (1 && 1);\
                    var d = (0 || 0) || (1 || 1);\
                ';
            var ast = parser.parse(code);

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
            var ast = parser.parse(code);

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
            var ast = parser.parse(code);

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
                    var e = zero || some2;\
                    var f = one && some2;\
                ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.isUndefined(rootScope.getReference('a').value);
            assert.isUndefined(rootScope.getReference('b').value);
            assert.isUndefined(rootScope.getReference('c').value);
            assert.isUndefined(rootScope.getReference('d').value);
            assert.isUndefined(rootScope.getReference('e').value);
            assert.isUndefined(rootScope.getReference('f').value);
        });
    });

    describe('conditional expression', function() {
        it('literal', function() {
            var code = '\
                    var a = 1 ? 2 : 3;\
                    var b = 0 ? 2 : 3;\
                    var c = 0;\
                    var d = 0;\
                    function fn1(){ c++ }\
                    function fn2(){ c+=10 }\
                    0 ? fn1() : fn2();\
                    1 ? fn1() : fn2();\
                    1 ? function() { d ? d = 10 : d = 1 }() : null;\
                ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, 2);
            assert.strictEqual(rootScope.getReference('b').value, 3);
            assert.strictEqual(rootScope.getReference('c').value, 11);
            assert.strictEqual(rootScope.getReference('d').value, 1);
        });

        it('identifier', function() {
            var code = '\
                var one = 1;\
                var zero = 0;\
                var two = 2;\
                var three = 3;\
                var a = one ? two : three;\
                var b = zero ? two : three;\
                var c = zero;\
                function fn1(){ c++ }\
                function fn2(){ c+=10 }\
                zero ? fn1() : fn2();\
                one ? fn1() : fn2();\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, 2);
            assert.strictEqual(rootScope.getReference('b').value, 3);
            assert.strictEqual(rootScope.getReference('c').value, 11);
        });

        it('member expression', function() {
            var code = '\
                var obj = { a: { zero: 0, one: 1, two: 2, three: 3 } };\
                var a = obj.a.one ? obj.a.two : obj.a.three;\
                var b = obj.a.zero ? obj.a.two : obj.a.three;\
                var c = obj.a.zero;\
                function fn1(){ c++ }\
                function fn2(){ c+=10 }\
                obj.a.zero ? fn1() : fn2();\
                obj.a.one ? fn1() : fn2();\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, 2);
            assert.strictEqual(rootScope.getReference('b').value, 3);
            assert.strictEqual(rootScope.getReference('c').value, 11);
        });

        it('computed member expression', function() {
            var code = '\
                var propZero = \'zero\';\
                var propOne = \'one\';\
                var propTwo = \'two\';\
                var propThree = \'three\';\
                var obj = { a: { zero: 0, one: 1, two: 2, three: 3 } };\
                var a = obj.a[propOne] ? obj.a[propTwo] : obj.a[propThree];\
                var b = obj.a[propZero] ? obj.a[propTwo] : obj.a[propThree];\
                var c = obj.a[propZero];\
                function fn1(){ c++ }\
                function fn2(){ c+=10 }\
                obj.a[propZero] ? fn1() : fn2();\
                obj.a[propOne] ? fn1() : fn2();\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, 2);
            assert.strictEqual(rootScope.getReference('b').value, 3);
            assert.strictEqual(rootScope.getReference('c').value, 11);
        });

        it('undefined logical expression', function() {
            var code = '\
                var a = one ? two : three;\
                var b = zero ? two : three;\
                var c = zero;\
                function fn1(){ c++ }\
                function fn2(){ c+=10 }\
                zero ? fn1() : fn2();\
                one ? fn1() : fn2();\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.isUndefined(rootScope.getReference('a').value);
            assert.isUndefined(rootScope.getReference('b').value);
            assert.isUndefined(rootScope.getReference('c').value);
        });
    });

    describe('object expression', function() {
        it('creation', function() {
            var code = 'var obj = { }';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.isObject(rootScope.getReference('obj').value);
        });

        it('key - literal, value - literal', function() {
            var code = 'var obj = { 0: 10, 1: 20 }';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('obj').value, { 0: 10, 1: 20 });
        });

        it('key - identifier, value - literal', function() {
            var code = 'var obj = { a: 10, b: 20 }';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('obj').value, { a: 10, b: 20 });
        });

        it('key - identifier, value - identifier', function() {
            var code = 'var a = 10, b = 20; var obj = { a: a, b }';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('obj').value, { a: 10, b: 20 });
        });

        it('key - computed, value - identifier', function() {
            var code = 'var a = 10, b = 20; var obj = { [a]: a, b }';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('obj').value, { 10: 10, b: 20 });
        });

        it('key - identifier, value - object expression', function() {
            var code = 'var a = 10, b = 20; var obj = { a: { a, b } }';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('obj').value, { a: { a: 10, b: 20 } });
        });

        it('key - array, value - array', function() {
            var code = 'var a = [1, 2, 3], obj = { [a]: a }; b = obj[a]';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('obj').value, { '1,2,3': [1, 2, 3] });
            assert.deepEqual(rootScope.getReference('b').value, [1, 2, 3]);
        });

        it('key - undefined identifier, value - undefined identifier', function() {
            var code = 'var obj = { [a]: a, b }';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('obj').value, { undefined: undefined, b: undefined });
        });
    });

    describe('function', function() {
        it('should pass argument to parameter', function() {
            var code = '\
                function fn1(a, b){ return [a, b] };\
                var fn2 = function(a, b){ return [a, b] };\
                var fn3 = (a, b) => [a, b];\
                var result1 = fn1(1, 2);\
                var result2 = fn2(1, 2);\
                var result3 = fn3(1, 2);\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('result1').value, [1, 2]);
            assert.deepEqual(rootScope.getReference('result2').value, [1, 2]);
            assert.deepEqual(rootScope.getReference('result3').value, [1, 2]);
        });

        it('should support arguments variable', function() {
            var code = '\
                function fn1(){ return [arguments[0], arguments[1]] };\
                var fn2 = function(){ return [arguments[0], arguments[1]] };\
                var fn3 = function(){ return (() => [arguments[0], arguments[1]])() };\
                var result1 = fn1(1, 2);\
                var result2 = fn2(1, 2);\
                var result3 = fn3(1, 2);\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('result1').value, [1, 2]);
            assert.deepEqual(rootScope.getReference('result2').value, [1, 2]);
            assert.deepEqual(rootScope.getReference('result3').value, [1, 2]);
        });

        it('should mix arguments variable and parameters', function() {
            var code = '\
                function fn1(a, b){ return [a, b, arguments[2]] };\
                var fn2 = function(a, b){ return [a, b, arguments[2]] };\
                var fn3 = function(a, b){ return ((c) => [arguments[0], arguments[1], c])(arguments[2]) };\
                var result1 = fn1(1, 2, 3);\
                var result2 = fn2(1, 2, 3);\
                var result3 = fn3(1, 2, 3);\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('result1').value, [1, 2, 3]);
            assert.deepEqual(rootScope.getReference('result2').value, [1, 2, 3]);
            assert.deepEqual(rootScope.getReference('result3').value, [1, 2, 3]);
        });

        it('should count arguments', function() {
            var code = '\
                function fn1(a, b){ return arguments.length };\
                var fn2 = function(a, b){ return arguments.length };\
                var fn3 = function(a, b){ return (c => arguments.length)() };\
                var result1 = fn1(10);\
                var result2 = fn2(10, 20);\
                var result3 = fn3(10, 20, 30);\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('result1').value, 1);
            assert.strictEqual(rootScope.getReference('result2').value, 2);
            assert.strictEqual(rootScope.getReference('result3').value, 3);
        });

        it('should return undefined without return', function() {
            var code = '\
                function fn1(){ };\
                var fn2 = function(){ };\
                var fn3 = () => { };\
                var fn4 = function(){ return; };\
                var result1 = fn1();\
                var result2 = fn2();\
                var result3 = fn3();\
                var result4 = fn4();\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.isUndefined(rootScope.getReference('result1').value);
            assert.isUndefined(rootScope.getReference('result2').value);
            assert.isUndefined(rootScope.getReference('result3').value);
            assert.isUndefined(rootScope.getReference('result4').value);
        });

        it('should use parent scope', function() {
            var code = '\
                function fn(){ return ++a }\
                var a = 1;\
                var result1 = fn();\
                var result2 = fn();\
                var result3 = fn();\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, 4);
            assert.strictEqual(rootScope.getReference('result1').value, 2);
            assert.strictEqual(rootScope.getReference('result2').value, 3);
            assert.strictEqual(rootScope.getReference('result3').value, 4);
        });

        it('should save root scope when return function', function() {
            var code = '\
                var a = 10;\
                function fn(){ return ++a; };\
                function fn1(a, b){ return fn };\
                var fn2 = function(a, b){ return fn };\
                var fn3 = function(a, b){ return (c => fn)() };\
                var result1 = fn(1, 2);\
                var result2 = fn(1, 2);\
                var result3 = fn(1, 2);\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('a').value, 13);
            assert.strictEqual(rootScope.getReference('result1').value, 11);
            assert.strictEqual(rootScope.getReference('result2').value, 12);
            assert.strictEqual(rootScope.getReference('result3').value, 13);
        });

        it('should save parent scope when return function', function() {
            var code = '\
                function fn1(a, b){ function fn(){ return ++a; } return fn };\
                var fn2 = function(a, b){ function fn(){ return ++a; } return fn };\
                var fn3 = (a, b) => function fn(){ return ++a; };\
                var wrapper1 = fn1(10);\
                var wrapper2 = fn2(20); wrapper2();\
                var wrapper3 = fn3(30); wrapper3(); wrapper3(); \
                var result1 = wrapper1();\
                var result2 = wrapper2();\
                var result3 = wrapper3();\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('result1').value, 11);
            assert.strictEqual(rootScope.getReference('result2').value, 22);
            assert.strictEqual(rootScope.getReference('result3').value, 33);
        });

        it('should support this', function() {
            var code = '\
                function fn(a,b){ return c => { var d = 1; d += 1; return a + b + this.c + arguments[0] + c + d } }\
                var obj1 = { a: { b: { c: 100 } } };\
                var obj2 = { a: { b: { c: 200 } } };\
                obj1.a.b.fn = fn;\
                obj2.a.b.fn = fn;\
                var result1 = obj1.a.b.fn(1, 1)(10);\
                var result2 = obj2.a.b.fn(2, 2)(20);\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('result1').value, 115);
            assert.strictEqual(rootScope.getReference('result2').value, 228);
        });

        it('complex case with closure and this', function() {
            var code = '\
                function fn(a,b) {\
                    return c => {\
                        function innerFunction(arg){\
                            function someFn() {\
                                +d;\
                                d > d;\
                                d++;\
                                1 || d++;\
                            }\
                            someFn();\
                            return a + b + this.c + arg + c + d;\
                        }\
                        var d = 1;\
                        d += 1;\
                        return innerFunction;\
                    }\
                }\
                var obj1 = { a: { b: { c: 100 } } };\
                var obj2 = { a: { b: { c: 200 } } };\
                obj1.a.b.fn = fn(1, 1)(20);\
                obj2.a.b.fn = fn(1, 1)(30);\
                var result1 = obj1.a.b.fn(40);\
                var result2 = obj2.a.b.fn(50);\
                obj2.a.b.fn = obj1.a.b.fn;\
                var result3 = obj2.a.b.fn(60);\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.strictEqual(rootScope.getReference('result1').value, 165);
            assert.strictEqual(rootScope.getReference('result2').value, 285);
            assert.strictEqual(rootScope.getReference('result3').value, 286);
        });

        it('should set this to undefined when not set', function() {
            var code = '\
                var fn = function(){ return function(){ return this } };\
                var result = fn()();\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.isUndefined(rootScope.getReference('result').value);
        });

        it('hoisting', function() {
            var code = '\
                var result1 = fn(1, 2);\
                function fn(a, b){ return a + b };\
            ';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.deepEqual(rootScope.getReference('result1').value, 3);
        });

        describe('runner', function() {
            it('should run runner', function() {
                var code = '\
                    var result = fn();\
                ';
                var ast = parser.parse(code);

                rootScope.setReference('fn', {
                    value: createRunner(rootScope, function() {
                        return { resolved: true, value: 10 };
                    })
                });
                processNames(ast, rootScope);
                processValues(ast);

                assert.strictEqual(rootScope.getReference('result').value, 10);
            });

            it('should pass arguments', function() {
                var code = '\
                    var result = fn(2, 3);\
                ';
                var ast = parser.parse(code);
                var result;

                rootScope.setReference('fn', {
                    value: createRunner(rootScope, function(args, callExpression, fnExpression, scope) {
                        return {
                            resolved: true,
                            value: [args[0] + args[1], args, callExpression, fnExpression, scope]
                        };
                    })
                });
                processNames(ast, rootScope);
                processValues(ast);
                result = rootScope.getReference('result').value;

                assert.strictEqual(result[0], 5);
                assert.deepEqual(result[1], { 0: 2, 1: 3, length: 2 });
                assert.strictEqual(result[2].type, 'CallExpression');
                assert.strictEqual(result[3].type, 'FunctionExpression');
                assert.typeOf(result[3].runner, 'function');
                assert.strictEqual(result[4].parent, rootScope);
            });
        });
    });

    describe('class', function() {
        it('should define methods', function() {
            var code = '\
                (function(){\
                    var methodName = \'m4\';\
                    class C1 { m1(){ } m2(){ }}\
                    class C2 { m3(){ } [methodName](){ }}\
                    class C3 { [5](){ } 6(){ } [und](){ }}\
                })()';
            var ast = parser.parse(code);

            processNames(ast, rootScope);
            processValues(ast);

            assert.property(rootScope.scopes[0].getReference('C1').value.prototype, 'm1');
            assert.property(rootScope.scopes[0].getReference('C1').value.prototype, 'm2');
            assert.property(rootScope.scopes[0].getReference('C2').value.prototype, 'm3');
            assert.property(rootScope.scopes[0].getReference('C2').value.prototype, 'm4');
            assert.property(rootScope.scopes[0].getReference('C3').value.prototype, '5');
            assert.property(rootScope.scopes[0].getReference('C3').value.prototype, '6');
        });
    });
});
