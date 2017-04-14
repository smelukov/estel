var Scope = require('./scope');
var processNames = require('./namesProcessor');
var utils = require('./utils/index');
var walker = require('./walker');

/**
 * Handle assignment
 *
 * @param {string} operator
 * @param {*} left
 * @param {*} right
 * @param {object} walker
 */
function handleAssignment(operator, left, right, walker) {
    /**
     * Assignment
     *
     * @param {string} operator
     * @param {*} leftValue
     * @param {*} rightValue
     * @return {*}
     */
    function assignment(operator, leftValue, rightValue) {
        switch (operator) {
            case '=':
                return rightValue;
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
                    return { resolved: false };
                }

                var targetScope = utils.ast.bubble(left.scope);

                leftReference = targetScope.setOwnReference(left.name, { value: undefined });
            }
            break;
        }
        case 'MemberExpression': // a.b = ...
            var keyObject = prepareMemberExpression(left, walker);

            if (keyObject.resolved) {
                leftObj = keyObject.object;
                leftKey = keyObject.key;
            } else {
                return { resolved: false };
            }
            break;
        default: {
            console.error(new Error('unknown left type - ', left.type));

            return { resolved: false };
        }
    }

    if (!right) {
        leftReference = left.scope.getReference(left.name);
        leftReference.value = assignment(operator, leftReference.value, undefined);

        return {
            resolved: true,
            value: leftReference.value
        };
    }

    if (left.type == 'MemberExpression') {
        if (leftObj && leftKey) {
            if (right.type == 'AssignmentExpression') {
                leftValue = leftObj[leftKey];
                handleAssignment(right.operator, right.left, right.right, walker);
                rightValue = resolveToken(right.left, walker).value;
                leftObj[leftKey] = assignment(operator, leftValue, rightValue);
            } else {
                leftObj[leftKey] = assignment(operator, leftObj[leftKey], resolveToken(right, walker).value);
            }

            return {
                resolved: true,
                value: leftObj[leftKey]
            };
        }

        return { resolved: false };
    }

    switch (right.type) {
        case 'ObjectExpression':
            // ... = { ... }
            leftValue = leftReference.value;
            rightValue = handleObjectExpression(right);
            leftReference.value = assignment(operator, leftValue, rightValue);

            return {
                resolved: true,
                value: leftReference.value
            };
        case 'Identifier':
            // ... = a
            rightReference = right.scope.getReference(right.name);

            if (!rightReference) {
                leftReference.value = undefined;
                leftReference.value = assignment(operator, leftReference.value, undefined);

                return {
                    resolved: true,
                    value: leftReference.value
                };
            }

            leftReference.value = assignment(operator, leftReference.value, rightReference.value);

            return {
                resolved: true,
                value: leftReference.value
            };
        case 'AssignmentExpression':
            leftValue = resolveToken(left, walker).value;
            handleAssignment(right.operator, right.left, right.right, walker);
            rightValue = resolveToken(right.left, walker).value;
            leftReference.value = assignment(operator, leftValue, rightValue);

            return {
                resolved: true,
                value: leftReference.value
            };
        default:
            leftValue = leftReference.value;
            rightValue = resolveToken(right, walker).value;
            leftReference.value = assignment(operator, leftValue, rightValue);

            return {
                resolved: true,
                value: leftReference.value
            };
    }
}

/**
 * Get key and object from MemberExpression
 *
 * @param {StaticMemberExpression|ComputedMemberExpression} token
 * @param {object=} walker
 * @returns {{resolved: boolean, key: *, object: *}}
 */
function prepareMemberExpression(token, walker) {
    var objectToken = token.object;
    var keyToken = token.property;
    var computed = token.computed;
    var obj = resolveToken(objectToken, walker);
    var key;

    if (computed) {
        key = resolveToken(keyToken, walker);
    } else {
        key = { resolved: true, value: keyToken.name };
    }

    if (obj.resolved && key.resolved) {
        return { resolved: true, key: key.value, object: obj.value };
    }

    return { resolved: false };
}

/**
 * Translate ObjectExpression to object with identifiers resolving
 *
 * @param {ObjectExpression} token
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
            key = resolveToken(keyToken).value;
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
 * Translate ArrayExpression to array
 *
 * @param {ArrayExpression} token
 * @returns {Array}
 */
function handleArrayExpression(token) {
    if (token.array) {
        return token.array;
    }

    var array = [];

    for (var i = 0; i < token.elements.length; i++) {
        array.push(resolveToken(token.elements[i]).value);
    }

    return token.array = array;
}

/**
 * Resolve BinaryExpression to value
 *
 * @param {BinaryExpression} token
 * @param {object=} walker
 * @returns {{resolved: boolean, value: *}}
 */
function resolveBinaryExpression(token, walker) {
    /**
     * Handle side
     *
     * @param {ExpressionStatement} side
     * @param {object} walker
     * @return {{resolved: boolean, value: *}}
     */
    function handleSide(side, walker) {
        if (side.type == 'BinaryExpression') {
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
 * Resolve LogicalExpression to value
 *
 * @param {LogicalExpression} token
 * @param {object=} walker
 * @returns {{resolved: boolean, value: *}}
 */
function resolveLogicalExpression(token, walker) {
    /**
     * Handle side
     *
     * @param {ExpressionStatement} side
     * @param {object} walker
     * @return {{resolved: boolean, value: *}}
     */
    function handleSide(side, walker) {
        if (side.type == 'LogicalExpression') {
            return resolveLogicalExpression(side, walker);
        }

        return resolveToken(side, walker);
    }

    var leftValue;
    var rightValue;
    var result;

    switch (token.operator) {
        case '||':
            leftValue = handleSide(token.left, walker);

            if (!leftValue.resolved) {
                return { resolved: false };
            }

            if (leftValue.value) {
                result = leftValue.value;
            } else {
                rightValue = handleSide(token.right, walker);

                if (!rightValue.resolved) {
                    return { resolved: false };
                }

                result = rightValue.value;
            }
            break;
        case '&&':
            leftValue = handleSide(token.left, walker);

            if (!leftValue.resolved) {
                return { resolved: false };
            }

            if (!leftValue.value) {
                result = leftValue.value;
            } else {
                rightValue = handleSide(token.right, walker);

                if (!rightValue.resolved) {
                    return { resolved: false };
                }

                result = rightValue.value;
            }
            break;
    }

    return { resolved: true, value: result };
}

/**
 * Resolve UnaryExpression to value
 *
 * @param {UnaryExpression} token
 * @param {object=} walker
 * @returns {{resolved: boolean, value: *}}
 */
function resolveUnaryExpression(token, walker) {
    /**
     * Handle argument
     *
     * @param {ExpressionStatement} argument
     * @param {object} walker
     * @return {{resolved: boolean, value: *}}
     */
    function handleArgument(argument, walker) {
        if (argument.type == 'UnaryExpression') {
            return resolveUnaryExpression(argument, walker);
        }

        return resolveToken(argument, walker);
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
                var keyObject = prepareMemberExpression(token.argument, walker);

                if (keyObject.resolved) {
                    result = delete keyObject.object[keyObject.key];
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
 * Resolve UpdateExpression to value
 *
 * @param {UpdateExpression} token
 * @param {object=} walker
 * @returns {{resolved: boolean, value: *}}
 */
function resolveUpdateExpression(token, walker) {
    var result;

    if (token.argument.type == 'MemberExpression') {
        var keyObject = prepareMemberExpression(token.argument, walker);

        if (keyObject.resolved) {
            if (keyObject.key in keyObject.object) {
                switch (token.operator) {
                    case '++':
                        if (token.prefix) {
                            result = ++keyObject.object[keyObject.key];
                        } else {
                            result = keyObject.object[keyObject.key]++;
                        }
                        break;
                    case '--':
                        if (token.prefix) {
                            result = --keyObject.object[keyObject.key];
                        } else {
                            result = keyObject.object[keyObject.key]--;
                        }
                        break;
                }
            } else {
                result = NaN;
            }
        } else {
            return { resolved: false };
        }
    } else {
        var reference = token.argument.scope.getReference(token.argument.name);

        if (reference) {
            switch (token.operator) {
                case '++':
                    if (token.prefix) {
                        result = ++reference.value;
                    } else {
                        result = reference.value++;
                    }
                    break;
                case '--':
                    if (token.prefix) {
                        result = --reference.value;
                    } else {
                        result = reference.value--;
                    }
                    break;
            }
        } else {
            return { resolved: false };
        }
    }

    return { resolved: true, value: result };
}

/**
 * Resolve conditional expression
 *
 * @param {ConditionalExpression} token
 * @return {{resolved: boolean, value: *}}
 */
function resolveConditionalExpression(token) {
    var test = resolveToken(token.test);

    if (test.resolved) {
        if (test.value) {
            return resolveToken(token.consequent);
        } 
        
        return resolveToken(token.alternate);
        
    }

    return { resolved: false };
}

/**
 * Resolve MemberExpression from token
 *
 * @param {StaticMemberExpression|ComputedMemberExpression} token
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

        if (!obj || typeof obj[key] == 'undefined') {
            return { resolved: false };
        }

        obj = obj[key];
    }

    return { resolved: true, value: obj };
}

/**
 * Create Runner
 *
 * @param {Scope} scope
 * @param {function} runner
 * @returns {function}
 */
function createRunner(scope, runner) {
    var token = {
        runner: runner,
        scope: scope,
        type: 'FunctionExpression',
        id: null,
        params: [],
        body: {
            type: 'BlockStatement',
            body: []
        }
    };

    return handleFunctionToken(token);
}

/**
 * Create stub function for token
 *
 * @param {FunctionDeclaration|FunctionExpression|ArrowFunctionExpression|ClassDeclaration|ClassExpression} token
 * @param {Scope=} scope
 * @return {function}
 */
function handleFunctionToken(token, scope) {
    var fn = function() {
        // stub
    };

    fn.token = token;
    fn.scope = scope || token.scope;

    return fn;
}

/**
 * Create method for class
 *
 * @param {MethodDefinition} token
 * @return {{resolved: boolean, name: string=, value: string=}}
 */
function resolveClassMethod(token) {
    var computed = token.computed;
    var methodName;
    var methodValue;

    if (computed) {
        methodName = resolveToken(token.key);

        if (!methodName.resolved) {
            return { resolved: false };
        }

        methodName = methodName.value;
    } else if (token.key.type == 'Literal') {
        methodName = token.key.value;
    } else {
        methodName = token.key.name;
    }

    methodValue = resolveToken(token.value);

    return { resolved: true, name: methodName, value: methodValue };
}

/**
 * Handle class token
 *
 * @param {ClassDeclaration|ClassExpression} token
 * @return {function}
 */
function handleClassToken(token) {
    /**
     * Resolve method
     *
     * @param {MethodDefinition} token
     * @param {function} fn
     * @return {{resolved: boolean, value: {resolved: boolean, name: string=, value: string=}=}}
     */
    function resolveMethod(token, fn) {
        var method = resolveClassMethod(token);

        if (method.resolved) {
            fn.prototype[method.name] = method.value;

            return { resolved: true, value: method };
        }

        return { resolved: false };
    }

    var fn = handleFunctionToken(token);

    walker.walk(token, {
        MethodDefinition: function(methodToken, parent) {
            this.skip();
            methodToken.scope = parent.scope;
            methodToken.key.scope = parent.scope;
            resolveMethod(methodToken, fn);
        }
    });

    return fn;
}

/**
 * Resolve call expression
 *
 * @param {CallExpression} token
 * @return {{resolved: boolean, value: *}}
 */
function resolveCallExpression(token) {
    var callee = resolveToken(token.callee).value;
    var result;
    var i;

    if (typeof callee == 'function' && callee.token) {
        var fnScope = new Scope(callee.scope);

        fnScope.token = callee.token.body;
        callee.token.body.scope = fnScope;
        processNames(callee.token.body, fnScope);

        if (callee.token.type == 'FunctionExpression' && callee.token.id) {
            fnScope.setOwnReference(callee.token.id.name, { value: callee.token });
        }

        var args = { length: token.arguments.length };

        for (i = 0; i < token.arguments.length; i++) {
            // todo support SpreadElement
            var arg = token.arguments[i];

            args[i] = resolveToken(arg).value;
        }
        if (callee.token.type != 'ArrowFunctionExpression') {
            fnScope.setOwnReference('arguments', { value: args });

            if (token.callee.type == 'MemberExpression') {
                fnScope.thisRef = prepareMemberExpression(token.callee).object;
            }
        }

        for (i = 0; i < callee.token.params.length; i++) {
            // todo support ObjectPattern
            // todo support RestElement
            var param = callee.token.params[i];

            fnScope.setOwnReference(param.name, { isArg: true, argIndex: i, value: args[i] });
        }

        if (typeof callee.token.runner == 'function') {
            result = callee.token.runner(args, token, callee.token, fnScope);
        } else if (callee.token.expression) {
            result = resolveToken(callee.token.body);
        } else {
            walker.walk(callee.token.body, {
                AssignmentExpression: function(token) {
                    resolveToken(token, this);
                },
                VariableDeclarator: function(token) {
                    resolveToken(token, this);
                },
                FunctionDeclaration: function(token) {
                    resolveToken(token, this);
                },
                ClassDeclaration: function(token) {
                    resolveToken(token, this);
                },
                CallExpression: function(token) {
                    resolveToken(token, this);
                },
                UnaryExpression: function(token) {
                    resolveToken(token, this);
                },
                BinaryExpression: function(token) {
                    resolveToken(token, this);
                },
                LogicalExpression: function(token) {
                    resolveToken(token, this);
                },
                UpdateExpression: function(token) {
                    resolveToken(token, this);
                },
                ConditionalExpression: function(token) {
                    resolveToken(token, this);
                },
                ReturnStatement: function(token) {
                    if (token.argument) {
                        result = resolveToken(token.argument, this);
                    }
                }
            });
        }
    }

    return result || { resolved: true, value: undefined };
}

/**
 * Resolve token to value
 *
 * @param {*} token
 * @param {object=} walker
 * @returns {{resolved: boolean, value: *}}
 */
function resolveToken(token, walker) {
    var reference;

    if (walker) {
        walker.skip();
    }

    switch (token.type) {
        case 'Literal':
            return { resolved: true, value: token.value };
        case 'Identifier':
            reference = token.scope && token.scope.getReference(token.name);

            if (!reference) {
                return { resolved: false };
            }

            return { resolved: true, value: reference.value };
        case 'ObjectExpression':
            return { resolved: true, value: handleObjectExpression(token) };
        case 'ArrayExpression':
            return { resolved: true, value: handleArrayExpression(token) };
        case 'MemberExpression':
            return resolveMemberExpression(token);
        case 'BinaryExpression':
            return resolveBinaryExpression(token, walker);
        case 'LogicalExpression':
            return resolveLogicalExpression(token, walker);
        case 'UnaryExpression':
            return resolveUnaryExpression(token, walker);
        case 'UpdateExpression':
            return resolveUpdateExpression(token, walker);
        case 'ConditionalExpression':
            return resolveConditionalExpression(token);
        case 'FunctionDeclaration':
            reference = token.scope.getReference(token.id.name);
            reference.value = handleFunctionToken(token);

            return {
                resolved: true,
                value: reference.value
            };
        case 'FunctionExpression':
        case 'ArrowFunctionExpression':
            return {
                resolved: true,
                value: handleFunctionToken(token)
            };
        case 'ClassDeclaration':
            reference = token.scope.getReference(token.id.name);
            reference.value = handleClassToken(token);

            return {
                resolved: true,
                value: reference.value
            };
        case 'ClassExpression':
            return {
                resolved: true,
                value: handleFunctionToken(token)
            };
        case 'CallExpression':
            return resolveCallExpression(token);
        case 'ThisExpression':
            var cursor = token.scope;

            while (cursor && cursor.thisRef == null) {
                cursor = cursor.parent;
            }

            if (cursor) {
                return { resolved: true, value: cursor.thisRef };
            }

            return { resolved: false };
        case 'AssignmentExpression':
            return handleAssignment(token.operator, token.left, token.right, walker);
        case 'VariableDeclarator':
            return handleAssignment('=', token.id, token.init, walker);
        default:
            console.error(new Error('unknown token type while resolving - ' + token.type));

            return { resolved: false };
    }
}

module.exports = {
    handleAssignment: handleAssignment,
    prepareMemberExpression: prepareMemberExpression,
    handleObjectExpression: handleObjectExpression,
    handleArrayExpression: handleArrayExpression,
    resolveBinaryExpression: resolveBinaryExpression,
    resolveLogicalExpression: resolveLogicalExpression,
    resolveUnaryExpression: resolveUnaryExpression,
    resolveUpdateExpression: resolveUpdateExpression,
    resolveMemberExpression: resolveMemberExpression,
    createRunner: createRunner,
    handleFunctionToken: handleFunctionToken,
    resolveClassMethod: resolveClassMethod,
    handleClassToken: handleClassToken,
    resolveCallExpression: resolveCallExpression,
    resolveToken: resolveToken
};
