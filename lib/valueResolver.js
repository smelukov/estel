/**
 * Translate ObjectExpression to object with identifiers resolving
 *
 * @param {Token} token
 * @returns {object}
 */
function handleObjectExpression(token) {
    if (token.obj) {
        return token.obj;
    }

    var obj = {};

    for (var i = 0; i < token.properties.length; i++) {
        var computed = token.properties[i].computed;
        var keyToken = token.properties[i].key;
        var valueToken = token.properties[i].value;
        var key;

        if (computed) {
            key = resolveToken(keyToken).value
        } else if (keyToken.type == 'Literal') {
            key = keyToken.value;
        } else {
            key = keyToken.name;
        }

        obj[key] = resolveToken(valueToken).value;
    }

    return token.obj = obj;
}

/**
 * Resolve BinaryExpression to value
 *
 * @param {Token} token
 * @param {object=} walker
 * @returns {{resolved: boolean, value: *}}
 */
function resolveBinaryExpression(token, walker) {
    function handleSide(side, walker) {
        if (side.type == 'BinaryExpression') {
            if (walker) {
                walker.skip();
            }

            return resolveBinaryExpression(side, walker);
        }

        return resolveToken(side, walker);
    }

    var leftValue = handleSide(token.left, walker);
    var rightValue = handleSide(token.right, walker);
    var result;

    if (!leftValue.resolved || !rightValue.resolved) {
        return { resolved: false };
    }

    switch (token.operator) {
        case '+':
            result = leftValue.value + rightValue.value;
            break;
        case '-':
            result = leftValue.value - rightValue.value;
            break;
        case '*':
            result = leftValue.value * rightValue.value;
            break;
        case '/':
            result = leftValue.value / rightValue.value;
            break;
        case '%':
            result = leftValue.value % rightValue.value;
            break;
        case '**':
            result = Math.pow(leftValue.value, rightValue.value);
            break;
        case '<<':
            result = leftValue.value << rightValue.value;
            break;
        case '>>':
            result = leftValue.value >> rightValue.value;
            break;
        case '>>>':
            result = leftValue.value >>> rightValue.value;
            break;
        case '&':
            result = leftValue.value & rightValue.value;
            break;
        case '|':
            result = leftValue.value | rightValue.value;
            break;
        case '^':
            result = leftValue.value ^ rightValue.value;
            break;
        case '==':
            result = leftValue.value == rightValue.value;
            break;
        case '!=':
            result = leftValue.value != rightValue.value;
            break;
        case '===':
            result = leftValue.value === rightValue.value;
            break;
        case '!==':
            result = leftValue.value !== rightValue.value;
            break;
        case '<':
            result = leftValue.value < rightValue.value;
            break;
        case '<=':
            result = leftValue.value <= rightValue.value;
            break;
        case '>':
            result = leftValue.value > rightValue.value;
            break;
        case '>=':
            result = leftValue.value >= rightValue.value;
            break;
        case 'in':
            var rightType = typeof rightValue.value;

            // prevent exception
            if (rightType == 'object' && rightValue.value || rightType == 'function') {
                result = leftValue.value in rightValue.value;
            } else {
                result = false;
            }
            break;
        case 'instanceof':
            // prevent exception
            if (typeof rightValue.value == 'function') {
                result = leftValue.value instanceof rightValue.value;
            } else {
                result = false;
            }
            break;
    }

    return { resolved: true, value: result };
}

/**
 * Resolve UnaryExpression to value
 *
 * @param {Token} token
 * @param {object=} walker
 * @returns {{resolved: boolean, value: *}}
 */
function resolveUnaryExpression(token, walker) {
    function handleArgument(side, walker) {
        if (side.type == 'UnaryExpression') {
            if (walker) {
                walker.skip();
            }

            return resolveUnaryExpression(side, walker);
        }

        return resolveToken(side, walker);
    }

    var argumentValue = handleArgument(token.argument, walker);
    var result;

    if (!argumentValue.resolved) {
        argumentValue.value = undefined;
    }

    switch (token.operator) {
        case '-':
            result = -argumentValue.value;
            break;
        case '+':
            result = +argumentValue.value;
            break;
        case '!':
            result = !argumentValue.value;
            break;
        case '~':
            result = ~argumentValue.value;
            break;
        case 'typeof':
            result = typeof argumentValue.value;
            break;
        case 'void':
            result = void argumentValue.value;
            break;
        case 'delete':
            if (token.argument.type == 'MemberExpression') {
                var objectToken = token.argument.object;
                var keyToken = token.argument.property;
                var computed = token.argument.computed;
                var obj = resolveToken(objectToken, walker);
                var key;

                if (computed) {
                    key = resolveToken(keyToken, walker);
                } else {
                    key = { resolved: true, value: keyToken.name };
                }

                if (obj.resolved && key.resolved) {
                    result = delete obj.value[key.value];
                } else {
                    result = true;
                }
            } else {
                result = true;
            }
            break;
    }

    return { resolved: true, value: result };
}

/**
 * Resolve MemberExpression from token
 *
 * @param {Token} token
 * @returns {{resolved: boolean, value: *}}
 */
function resolveMemberExpression(token) {
    var path = [];
    var cursor = token;
    var obj;
    var key;

    while (cursor.object) {
        path.unshift({
            property: cursor.property,
            computed: cursor.computed
        });
        cursor = cursor.object;
    }

    path.unshift({
        property: cursor,
        computed: true
    });

    for (var i = 0; i < path.length; i++) {
        var property = path[i].property;
        var computed = path[i].computed;

        if (computed) {
            key = resolveToken(property);

            if (i == 0) {
                if (key.resolved) {
                    obj = key.value;
                    continue;
                } else {
                    return { resolved: false };
                }
            }
            key = key.value;
        } else {
            key = property.name;
        }

        if (!obj || !(key in obj)) {
            return { resolved: false };
        }

        obj = obj[key];
    }

    return { resolved: true, value: obj };
}

/**
 * Resolve token to value
 *
 * @param {Token} token
 * @param {object=} walker
 * @returns {{resolved: boolean, value: *}}
 */
function resolveToken(token, walker) {
    switch (token.type) {
        case 'Literal':
            return { resolved: true, value: token.value };
        case 'Identifier':
            var reference = token.scope && token.scope.getReference(token.name);

            if (!reference) {
                return { resolved: false };
            }

            return { resolved: true, value: reference.value };
        case 'ObjectExpression':
            return { resolved: true, value: handleObjectExpression(token) };
        case 'MemberExpression':
            return resolveMemberExpression(token);
        case 'BinaryExpression':
            return resolveBinaryExpression(token, walker);
        case 'UnaryExpression':
            return resolveUnaryExpression(token, walker);
        case 'FunctionDeclaration': // todo
        case 'FunctionExpression': // todo
        case 'ArrowFunctionExpression': // todo
        case 'ClassDeclaration': // todo
        case 'ClassExpression': // todo
            return {
                resolved: true,
                value: function() {
                    // stub
                }
            };
        case 'ArrayExpression': // todo
        default:
            console.error(new Error('unknown token type while resolving - ' + token.type));
    }
}

module.exports = {
    resolveToken: resolveToken,
    handleObjectExpression: handleObjectExpression,
    resolveMemberExpression: resolveMemberExpression,
    resolveBinaryExpression: resolveBinaryExpression
};
