var walker = require('./walker');
var valueResolver = require('./valueResolver');

/**
 * Process AST to handle values
 *
 * @param {Object} ast syntax tree in ESTree format
 * @returns {Object} ast
 */
module.exports = function(ast) {
    walker.walk(ast, {
        AssignmentExpression: function(token) {
            valueResolver.resolveToken(token, this);
        },
        VariableDeclarator: function(token) {
            valueResolver.resolveToken(token, this);
        },
        FunctionDeclaration: function(token) {
            valueResolver.resolveToken(token, this);
        },
        ClassDeclaration: function(token) {
            valueResolver.resolveToken(token, this);
        },
        CallExpression: function(token) {
            valueResolver.resolveToken(token, this);
        },
        UnaryExpression: function(token) {
            valueResolver.resolveToken(token, this);
        },
        BinaryExpression: function(token) {
            valueResolver.resolveToken(token, this);
        },
        LogicalExpression: function(token) {
            valueResolver.resolveToken(token, this);
        },
        UpdateExpression: function(token) {
            valueResolver.resolveToken(token, this);
        }
    });
};
