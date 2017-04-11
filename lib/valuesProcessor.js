var walker = require('./walker');
var valueResolver = require('./valueResolver');
var utils = require('./utils/index');

/**
 * Handle assignment
 *
 * @param {Token} left
 * @param {Token} right
 */
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

                leftReference = targetScope.setOwnReference(left.name, { value: undefined });
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
                var keyValue;

                if (keyToken.type == 'Identifier') {
                    keyValue = keyToken.name;
                } else {
                    console.error(new Error('unknown key token type - ' + keyToken.type));
                }

                key = { resolved: true, value: keyValue };
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
            this.skip();
            handleAssignment.call(this, right.left, right.right);
            leftObj[leftKey] = valueResolver.resolveToken(right.left).value;
        } else {
            leftObj[leftKey] = valueResolver.resolveToken(right).value;
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
            this.skip();
            handleAssignment.call(this, right.left, right.right);
            handleAssignment.call(this, left, right.left);
            break;
        case 'MemberExpression': // ... = b.c
        case 'Literal': // ... = 123
        default:
            leftReference.value = valueResolver.resolveToken(right).value;
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
                handleAssignment.call(this, token.left, token.right);
            }
        },
        VariableDeclarator: function(token) {
            handleAssignment.call(this, token.id, token.init);
        },
        ObjectExpression: function(token) {
            token.obj = valueResolver.handleObjectExpression(token);
        }
    });
};
