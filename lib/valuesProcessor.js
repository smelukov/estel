var walker = require('./walker');
var valueResolver = require('./valueResolver');
var utils = require('./utils/index');

function handleAssignment(left, right) {
    var leftReference;
    var rightReference;
    var leftObj;
    var leftKey;

    switch (left.type) {
        case 'Identifier': {
            // a = ...
            leftReference = left.scope.getReference(left.name);

            if (!leftReference) {
                var targetScope = utils.ast.bubble(left.scope);

                leftReference = targetScope.setOwnReference(left.name, {
                    token: utils.ast.createIdentifier('undefined')
                });
                leftReference.token.scope = targetScope;
            }
            break;
        }
        case 'MemberExpression': // a.b = ...
            var objectToken = left.object;
            var keyToken = left.property;
            var computed = left.computed;
            var obj = valueResolver.resolveToken(objectToken);
            var key;

            if (computed) {
                key = valueResolver.resolveToken(keyToken);
            } else {
                key = { resolved: true, value: keyToken.name };
            }

            if (obj.resolved && key.resolved) {
                leftObj = obj.value;
                leftKey = key.value;
            } else {
                return;
            }
            break;
        default: {
            console.error('unknown left type - ' + left.type);
        }
    }

    if (!right) {
        leftReference = left.scope.getReference(left.name);
        leftReference.token = utils.ast.createIdentifier('undefined');

        return;
    }

    if (leftObj && leftKey) {
        leftObj[leftKey] = valueResolver.resolveToken(right).value;

        return;
    }

    switch (right.type) {
        case 'ObjectExpression':
            // ... = { ... }
            right.obj = valueResolver.handleObjectExpression(right);
            leftReference.token = right;
            break;
        case 'MemberExpression':
            // ... = b.c
            leftReference.token = right;
            break;
        case 'Literal':
            // ... = 123
            leftReference.token = right;
            break;
        case 'Identifier':
            // ... = a
            rightReference = right.scope.getReference(right.name);

            if (!rightReference) {
                leftReference.token = utils.ast.createIdentifier('undefined');

                return;
            }

            if (rightReference.token.type == 'Literal' || rightReference.token.obj) {
                leftReference.token = rightReference.token;
            } else {
                console.error('unknown right type');
            }

            break;
        default:
            console.error('unknown right type - ' + right.type);
    }
}

/**
 * Process AST to handle values
 *
 * @param {Object} ast syntax tree in ESTree format
 * @returns {Object} ast
 */
module.exports = function(ast) {
    walker.walk(ast, {
        AssignmentExpression: function(token) {
            if (token.operator == '=') {
                handleAssignment(token.left, token.right);
            }
        },
        VariableDeclarator: function(token) {
            handleAssignment(token.id, token.init);
        },
        ObjectExpression: function(token) {
            token.obj = valueResolver.handleObjectExpression(token);
        }
    });
};
