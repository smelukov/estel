var walker = require('./walker');
var valueResolver = require('./valueResolver');
var utils = require('./utils/index');

/**
 * Handle assignment
 *
 * @param {string} operator
 * @param {Token} left
 * @param {Token} right
 * @param {object} walker
 */
function handleAssignment(operator, left, right, walker) {
    function assignment(operator, leftValue, rightValue) {
        switch (operator) {
            case '=':
                return leftValue = rightValue;
            case '+=':
                return leftValue += rightValue;
            case '-=':
                return leftValue -= rightValue;
            case '*=':
                return leftValue *= rightValue;
            case '/=':
                return leftValue /= rightValue;
            case '%=':
                return leftValue %= rightValue;
            case '<<=':
                return leftValue <<= rightValue;
            case '>>=':
                return leftValue >>= rightValue;
            case '>>>=':
                return leftValue >>>= rightValue;
            case '|=':
                return leftValue |= rightValue;
            case '^=':
                return leftValue ^= rightValue;
            case '&=':
                return leftValue &= rightValue;
        }
    }

    var leftReference;
    var rightReference;
    var leftValue;
    var rightValue;
    var leftObj;
    var leftKey;

    switch (left.type) {
        case 'Identifier': {
            // a = ...
            leftReference = left.scope.getReference(left.name);

            if (!leftReference) {
                if (operator != '=') {
                    return;
                }

                var targetScope = utils.ast.bubble(left.scope);

                leftReference = targetScope.setOwnReference(left.name, { value: undefined });
            }
            break;
        }
        case 'MemberExpression': // a.b = ...
            var keyObject = valueResolver.prepareMemberExpression(left, walker);

            if (keyObject.resolved) {
                leftObj = keyObject.object;
                leftKey = keyObject.key;
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
        leftReference.value = assignment(operator, leftReference.value, undefined);

        return;
    }

    if (leftObj && leftKey) {
        if (right.type == 'AssignmentExpression') {
            if (walker) {
                walker.skip();
            }

            leftValue = leftObj[leftKey];
            handleAssignment(right.operator, right.left, right.right, walker);
            rightValue = valueResolver.resolveToken(right.left, walker).value;
            leftObj[leftKey] = assignment(operator, leftValue, rightValue);
        } else {
            leftObj[leftKey] = assignment(operator, leftObj[leftKey], valueResolver.resolveToken(right, walker).value);
        }

        return;
    }

    switch (right.type) {
        case 'ObjectExpression':
            // ... = { ... }
            leftValue = leftReference.value;
            rightValue = valueResolver.handleObjectExpression(right);
            leftReference.value = assignment(operator, leftValue, rightValue);
            break;
        case 'Identifier':
            // ... = a
            rightReference = right.scope.getReference(right.name);

            if (!rightReference) {
                leftReference.value = undefined;
                leftReference.value = assignment(operator, leftReference.value, undefined);

                return;
            }

            leftReference.value = assignment(operator, leftReference.value, rightReference.value);

            break;
        case 'AssignmentExpression':
            if (walker) {
                walker.skip();
            }

            leftValue = valueResolver.resolveToken(left, walker).value;
            handleAssignment(right.operator, right.left, right.right, walker);
            rightValue = valueResolver.resolveToken(right.left, walker).value;
            leftReference.value = assignment(operator, leftValue, rightValue);

            break;
        default:
            leftValue = leftReference.value;
            rightValue = valueResolver.resolveToken(right, walker).value;
            leftReference.value = assignment(operator, leftValue, rightValue);
            break;
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
            handleAssignment(token.operator, token.left, token.right, this);
        },
        VariableDeclarator: function(token) {
            handleAssignment('=', token.id, token.init, this);
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
