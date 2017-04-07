var walker = require('./walker');
var utils = require('./utils/index');
var Scope = require('./scope');

/**
 * Create an identifier
 *
 * @param {string} name
 * @return {Identifier}
 */
function createIdentifier(name) {
    return utils.ast.createIdentifier(name);
}

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

/**
 * Bubble from scope to nearest function scope or global scope
 * Uses for hoisting emulation
 *
 * @param {Scope} scope from
 * @returns {Scope}
 */
function bubble(scope) {
    var cursor = scope.token;

    while (cursor && cursor.parent && !utils.ast.isFunction(cursor) && !utils.ast.isClass(cursor)) {
        cursor = cursor.parent;
    }

    if (utils.ast.isFunction(cursor) || utils.ast.isClass(cursor)) {
        return cursor.body.scope
    }

    return cursor.scope;
}

/**
 * Bubble from token to nearest BlockStatement or ForStatement or SwitchStatement or global token
 * Uses for let/const/class hoisting emulation
 *
 * @param {Token} token from
 * @returns {Token}
 */
function bubbleToBlock(token) {
    var cursor = token;

    while (cursor && cursor.parent && !utils.ast.isBlock(cursor)) {
        cursor = cursor.parent;
    }

    return cursor;
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
                targetScope = bubble(targetScope);
            } else {
                var targetToken = bubbleToBlock(token);

                targetScope = targetToken.scope;
            }

            targetScope.setOwnReference(token.id.name, { token: token.init || createIdentifier('undefined') });
            token.scope = targetScope;
        },
        FunctionDeclaration: function(token) {
            var targetScope = bubble(token.scope);

            targetScope.setOwnReference(token.id.name, { token: token });
            token.scope = targetScope;
        },
        ClassDeclaration: function(token) {
            var targetToken = bubbleToBlock(token);

            targetToken.scope.setOwnReference(token.id.name, { token: token });
            token.scope = targetToken.scope;
        },
        ClassBody: function(token, parent) {
            if (parent.type == 'ClassExpression' && parent.id) {
                token.scope.setOwnReference(parent.id.name, { token: parent });
            }
        },
        MethodDefinition: function(token) {
            var classToken = bubbleToBlock(token);

            classToken.methods = classToken.methods || {};
            classToken.methods[token.key.name] = token.value;

            token.scope = classToken.scope;
            token.value.isMethod = true;
            token.value.methodName = token.key;
        },
        BlockStatement: function(token, parent) {
            if (utils.ast.isFunction(parent)) {
                if (parent.type == 'FunctionExpression' && parent.id) {
                    token.scope.setOwnReference(parent.id.name, { token: parent });
                }

                if (parent.type != 'ArrowFunctionExpression') {
                    token.scope.setOwnReference('arguments', { token: utils.ast.createObject() });
                }

                for (var i = 0, param; i < parent.params.length; i++) {
                    // todo support ObjectPattern argument type
                    param = parent.params[i];
                    token.scope.setOwnReference(param.name, { token: param, isArg: true, argIndex: i });
                }
            } else if (parent.type == 'CatchClause') {
                token.scope.setOwnReference(parent.param.name, { token: createIdentifier('undefined') });
            }
        }
    });

    return ast;
};
