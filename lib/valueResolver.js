/**
 * Translate ObjectExpression to object with identifiers resolving
 *
 * @param token
 * @returns {*}
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
            key = resolveToken(keyToken)
        } else if (keyToken.type == 'Literal') {
            key = keyToken.value;
        } else if (keyToken.type == 'Identifier') {
            key = keyToken.name;
        } else {
            console.error('unknown key type - ' + keyToken.type);
        }

        obj[key] = resolveToken(valueToken);
    }

    return obj;
}

function resolveToken(token) {
    switch (token.type) {
        case 'Literal':
            return token.value;
        case 'Identifier':
            var reference = token.scope.getReference(token.name);

            if (!reference) {
                return undefined;
            }

            return resolveToken(reference.token);
        case 'ObjectExpression':
            return handleObjectExpression(token);
        default:
            console.error('unknown token type while resolving - ' + token.type);
    }
}

module.exports = {
    resolveValue: resolveToken,
    handleObjectExpression: handleObjectExpression
};
