var assert = require('chai').assert;
var parser = require('../lib/parser');
var utils = require('../lib/utils');

describe('Utils.AST', function() {
    it('#createLiteral', function() {
        assert.deepEqual(utils.ast.createLiteral(10), {
            type: 'Literal',
            value: 10,
            raw: '10'
        });

        assert.deepEqual(utils.ast.createLiteral('10'), {
            type: 'Literal',
            value: '10',
            raw: '"10"'
        });

        assert.deepEqual(utils.ast.createLiteral(true), {
            type: 'Literal',
            value: true,
            raw: 'true'
        });

        assert.isNull(utils.ast.createLiteral(NaN));
        assert.isNull(utils.ast.createLiteral({}));
    });

    it('#createIdentifier', function() {
        assert.deepEqual(utils.ast.createIdentifier('a'), {
            type: 'Identifier',
            name: 'a'
        });
    });

    it('#getFirstExpression', function() {
        var token1 = utils.ast.getFirstExpression(parser.parse('function a(){var b;}'));
        var token2 = utils.ast.getFirstExpression(token1.body);
        var token3 = utils.ast.getFirstExpression(parser.parse('class A{ m(){} }'));
        var token4 = utils.ast.getFirstExpression(token3);
        var token5 = utils.ast.getFirstExpression(token3.body);

        assert.equal(token1.type, 'FunctionDeclaration');
        assert.equal(token2.type, 'VariableDeclaration');
        assert.equal(token3.type, 'ClassDeclaration');
        assert.isNull(token4);
        assert.equal(token5.type, 'MethodDefinition');
    });

    it('#isFunction', function() {
        var token1 = parser.parse('function a(){}').body[0];
        var token2 = parser.parse('(function(){})').body[0].expression;
        var token3 = parser.parse('(()=>{})').body[0].expression;

        assert.isTrue(utils.ast.isFunction(token1));
        assert.isTrue(utils.ast.isFunction(token2));
        assert.isTrue(utils.ast.isFunction(token3));
    });

    it('#isClass', function() {
        var token1 = parser.parse('class A{}').body[0];
        var token2 = parser.parse('(class A{})').body[0].expression;

        assert.isTrue(utils.ast.isClass(token1));
        assert.isTrue(utils.ast.isClass(token2));
    });

    it('#isBlock', function() {
        var token1 = parser.parse('function A(){}').body[0].body;
        var token2 = parser.parse('class A{}').body[0].body;
        var token3 = parser.parse('switch(1){}').body[0];
        var token4 = parser.parse('for(;;);').body[0];

        assert.isTrue(utils.ast.isBlock(token1));
        assert.isTrue(utils.ast.isBlock(token2));
        assert.isTrue(utils.ast.isBlock(token3));
        assert.isTrue(utils.ast.isBlock(token4));
    });
});
