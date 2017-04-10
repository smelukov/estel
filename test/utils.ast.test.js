var esprima = require('esprima');
var Syntax = esprima.Syntax;
var assert = require('chai').assert;
var utils = require('../lib/utils');

describe('Utils.AST', function() {
    it('#createLiteral', function() {
        assert.deepEqual(utils.ast.createLiteral(10), {
            type: Syntax.Literal,
            value: 10,
            raw: '10'
        });

        assert.deepEqual(utils.ast.createLiteral('10'), {
            type: Syntax.Literal,
            value: '10',
            raw: '"10"'
        });

        assert.deepEqual(utils.ast.createLiteral(true), {
            type: Syntax.Literal,
            value: true,
            raw: 'true'
        });

        assert.isNull(utils.ast.createLiteral(NaN));
        assert.isNull(utils.ast.createLiteral({}));
    });

    it('#createIdentifier', function() {
        assert.deepEqual(utils.ast.createIdentifier('a'), {
            type: Syntax.Identifier,
            name: 'a'
        });
    });

    it('#getFirstExpression', function() {
        var token1 = utils.ast.getFirstExpression(esprima.parse('function a(){var b;}'));
        var token2 = utils.ast.getFirstExpression(token1.body);
        var token3 = utils.ast.getFirstExpression(esprima.parse('class A{ m(){} }'));
        var token4 = utils.ast.getFirstExpression(token3);
        var token5 = utils.ast.getFirstExpression(token3.body);

        assert.equal(token1.type, Syntax.FunctionDeclaration);
        assert.equal(token2.type, Syntax.VariableDeclaration);
        assert.equal(token3.type, Syntax.ClassDeclaration);
        assert.isNull(token4);
        assert.equal(token5.type, Syntax.MethodDefinition);
    });

    it('#isFunction', function() {
        var token1 = esprima.parse('function a(){}').body[0];
        var token2 = esprima.parse('(function(){})').body[0].expression;
        var token3 = esprima.parse('(()=>{})').body[0].expression;

        assert.isTrue(utils.ast.isFunction(token1));
        assert.isTrue(utils.ast.isFunction(token2));
        assert.isTrue(utils.ast.isFunction(token3));
    });

    it('#isClass', function() {
        var token1 = esprima.parse('class A{}').body[0];
        var token2 = esprima.parse('(class A{})').body[0].expression;

        assert.isTrue(utils.ast.isClass(token1));
        assert.isTrue(utils.ast.isClass(token2));
    });

    it('#isBlock', function() {
        var token1 = esprima.parse('function A(){}').body[0].body;
        var token2 = esprima.parse('class A{}').body[0].body;
        var token3 = esprima.parse('switch(1){}').body[0];
        var token4 = esprima.parse('for(;;);').body[0];

        assert.isTrue(utils.ast.isBlock(token1));
        assert.isTrue(utils.ast.isBlock(token2));
        assert.isTrue(utils.ast.isBlock(token3));
        assert.isTrue(utils.ast.isBlock(token4));
    });

    it('#createObject', function() {
        var token1 = esprima.parse('({})').body[0].expression;
        var token2 = esprima.parse('({"a":1,"b":1})').body[0].expression;
        var obj1 = utils.ast.createObject();
        var obj2 = utils.ast.createObject({ a: 1, b: 1 });

        assert.deepEqual(obj1, token1);
        assert.deepEqual(obj2, token2);
    });

    it('#parse', function() {
        assert.deepEqual(utils.ast.parse('var a = 10'), esprima.parse('var a = 10').body[0]);
    });
});
