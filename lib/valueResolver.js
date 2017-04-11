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
        } else if (keyToken.type == 'Identifier') {
            key = keyToken.name;
        } else {
            console.error('unknown key type - ' + keyToken.type);
        }

        obj[key] = resolveToken(valueToken).value;
    }

    return obj;
}

/**
 * Resolve MemberExpression from token
 *
 * @param {Token} token
 * @returns {{resolved: boolean, value: *}}
 */
function handleMemberExpression(token) {
    var path = [];
    var cursor = token;
    var reference;
    var obj;
    var keyToken;
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
            if (property.type == 'Literal') {
                keyToken = property;
            } else if (property.type == 'Identifier') {
                reference = token.scope.getReference(property.name);
                keyToken = reference && reference.token ? reference.token : null;
            } else {
                console.error('unknown key type - ' + property.type);
            }

            if (!i) {
                if (keyToken && keyToken.obj) {
                    obj = keyToken.obj;
                    continue;
                } else {
                    return { resolved: false };
                }
            }
        } else if (property.type == 'Literal' || property.type == 'Identifier') {
            keyToken = property;
        } else {
            console.error('unknown key type - ' + property.type);
        }

        if (!keyToken) {
            return { resolved: false };
        }

        switch (keyToken.type) {
            case 'Literal':
                key = keyToken.value;
                break;
            case 'Identifier':
                key = keyToken.name;
                break;
            default:
                console.error('unknown key type - ' + property.type);
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
 * @returns {{resolved: boolean, value: *}}
 */
function resolveToken(token) {
    switch (token.type) {
        case 'Literal':
            return { resolved: true, value: token.value };
        case 'Identifier':
            var reference = token.scope && token.scope.getReference(token.name);

            if (!reference) {
                return { resolved: false };
            }

            return resolveToken(reference.token);
        case 'ObjectExpression':
            return { resolved: true, value: handleObjectExpression(token) };
        case 'MemberExpression':
            return handleMemberExpression(token);
        default:
            console.error('unknown token type while resolving - ' + token.type);
    }
}

module.exports = {
    resolveToken: resolveToken,
    handleObjectExpression: handleObjectExpression,
    handleMemberExpression: handleMemberExpression
};
