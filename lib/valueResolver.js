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
            console.error(new Error('unknown key type - ' + keyToken.type));
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
        } else if (property.type == 'Identifier') {
            key = property.name;
        } else {
            console.error(new Error('unknown key type - ' + property.type));
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

            return { resolved: true, value: reference.value };
        case 'ObjectExpression':
            return { resolved: true, value: handleObjectExpression(token) };
        case 'MemberExpression':
            return resolveMemberExpression(token);
        default:
            console.error(new Error('unknown token type while resolving - ' + token.type));
    }
}

module.exports = {
    resolveToken: resolveToken,
    handleObjectExpression: handleObjectExpression,
    resolveMemberExpression: resolveMemberExpression
};
