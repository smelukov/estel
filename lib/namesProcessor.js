var walker = require('./walker');
var utils = require('./utils/index');
var Scope = require('./scope');

/**
 * Create a new scope
 *
 * @param {Token} token scope holder
 * @returns {Scope}
 */
function createScope(token) {
    token.scope = new Scope(token.scope);
    token.scope.token = token;

    return token.scope;
}

function handleImportDeclaration(token) {
    token.scope.setOwnReference(token.local.name);
}

/**
 * Process AST to create scopes and names
 *
 * @param {Object} ast syntax tree in ESTree format
 * @param {Scope} scope root scope
 * @returns {Object} ast
 */
module.exports = function process(ast, scope) {
    walker.walk(ast, {
        '*': function(token, parent) {
            token.parent = parent;

            if (parent) {
                token.scope = parent.scope;
            } else {
                scope.token = token;
                token.scope = scope;
            }

            if (utils.ast.isBlock(token)) {
                createScope(token);
            }
        },
        VariableDeclarator: function(token, parent) {
            var targetScope = token.scope;

            if (parent.kind == 'var') {
                targetScope = utils.ast.bubble(targetScope);
            } else {
                var targetToken = utils.ast.bubbleToBlock(token);

                targetScope = targetToken.scope;
            }

            targetScope.setOwnReference(token.id.name);
            token.scope = targetScope;
        },
        FunctionDeclaration: function(token) {
            var targetScope = utils.ast.bubble(token.scope);

            targetScope.setOwnReference(token.id.name);
            token.scope = targetScope;
        },
        ClassDeclaration: function(token) {
            var targetToken = utils.ast.bubbleToBlock(token);

            targetToken.scope.setOwnReference(token.id.name);
            token.scope = targetToken.scope;
        },
        ClassBody: function(token, parent) {
            if (parent.type == 'ClassExpression' && parent.id) {
                token.scope.setOwnReference(parent.id.name);
            }
        },
        MethodDefinition: function(token) {
            var classToken = utils.ast.bubbleToBlock(token);

            classToken.methods = classToken.methods || {};
            classToken.methods[token.key.name] = token.value;

            token.scope = classToken.scope;
            token.value.isMethod = true;
            token.value.methodName = token.key;
        },
        BlockStatement: function(token, parent) {
            if (utils.ast.isFunction(parent)) {
                if (parent.type == 'FunctionExpression' && parent.id) {
                    token.scope.setOwnReference(parent.id.name);
                }

                if (parent.type != 'ArrowFunctionExpression') {
                    token.scope.setOwnReference('arguments');
                }

                for (var i = 0, param; i < parent.params.length; i++) {
                    // todo support ObjectPattern argument type
                    param = parent.params[i];
                    token.scope.setOwnReference(param.name, { isArg: true, argIndex: i });
                }
            } else if (parent.type == 'CatchClause') {
                token.scope.setOwnReference(parent.param.name);
            }
        },
        ImportSpecifier: handleImportDeclaration,
        ImportDefaultSpecifier: handleImportDeclaration,
        ImportNamespaceSpecifier: handleImportDeclaration
    });

    return ast;
};
