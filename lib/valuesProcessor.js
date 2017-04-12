var walker = require('./walker');
var valueResolver = require('./valueResolver');
var utils = require('./utils/index');

/**
 * Handle assignment
 *
 * @param {Token} left
 * @param {Token} right
 * @param {object} walker
 */
function handleAssignment(left, right, walker) {
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

                leftReference = targetScope.setOwnReference(left.name, { value: undefined });
            }
            break;
        }
        case 'MemberExpression': // a.b = ...
            var objectToken = left.object;
            var keyToken = left.property;
            var computed = left.computed;
            var obj = valueResolver.resolveToken(objectToken, walker);
            var key;

            if (computed) {
                key = valueResolver.resolveToken(keyToken, walker);
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
            console.error(new Error('unknown left type - ', left.type));
        }
    }

    if (!right) {
        leftReference = left.scope.getReference(left.name);
        leftReference.value = undefined;

        return;
    }

    if (leftObj && leftKey) {
        if (right.type == 'AssignmentExpression') {
            if (walker) {
                walker.skip();
            }

            handleAssignment(right.left, right.right, walker);
            leftObj[leftKey] = valueResolver.resolveToken(right.left, walker).value;
        } else {
            leftObj[leftKey] = valueResolver.resolveToken(right, walker).value;
        }

        return;
    }

    switch (right.type) {
        case 'ObjectExpression':
            // ... = { ... }
            leftReference.value = valueResolver.handleObjectExpression(right);
            break;
        case 'Identifier':
            // ... = a
            rightReference = right.scope.getReference(right.name);

            if (!rightReference) {
                leftReference.value = undefined;

                return;
            }

            leftReference.value = rightReference.value;

            break;
        case 'AssignmentExpression':
            if (walker) {
                walker.skip();
            }

            handleAssignment(right.left, right.right, walker);
            handleAssignment(left, right.left, walker);
            break;
        default:
            leftReference.value = valueResolver.resolveToken(right, walker).value;
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
                handleAssignment(token.left, token.right, this);
            }
        },
        VariableDeclarator: function(token) {
            handleAssignment(token.id, token.init, this);
        },
        FunctionDeclaration: function(token) {
            var reference = token.scope.getReference(token.id.name);

            reference.value = valueResolver.resolveToken(token);
        },
        ClassDeclaration: function(token) {
            var reference = token.scope.getReference(token.id.name);

            reference.value = valueResolver.resolveToken(token);
        }
    });
};
