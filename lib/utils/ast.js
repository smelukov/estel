var Syntax = require('esprima').Syntax;
var parser = require('../parser');

/**
 * @typedef {Object} Token
 * @property {string} type
 */

/**
 * @typedef {Token} BlockStatement
 * @property {Array<Token>} body
 */

/**
 * @typedef {Token} Identifier
 * @property {string} name
 */

/**
 * @typedef {Token} Literal
 * @property {*} value
 */

/**
 * @typedef {Token} ESFunction
 * @property {?Identifier} id
 * @property {Array<Identifier>} params
 * @property {Array<?Literal>} defaults
 * @property {BlockStatement} body
 */

/**
 * @typedef {Token} ObjectExpression
 * @property {Array<Property>} properties
 */

/**
 * @typedef {Token} Property
 * @property {Literal | Identifier} key
 * @property {Token} value
 */

/**
 * @typedef {Token} MemberExpression
 * @property {Identifier | MemberExpression} object
 * @property {Identifier} property
 */

module.exports = {
    /**
     * Returns first {Token} in {BlockStatement}
     *
     * @param {Token} token
     * @returns {?Token}
     */
    getFirstExpression: function(token) {
        if (token.type == Syntax.BlockStatement || token.type == Syntax.ClassBody || token.type == Syntax.Program) {
            return token.body[0] && token.body[0].expression || token.body[0];
        }
    },
    /**
     * Create literal from string, number or boolean
     *
     * @param {string|number|boolean} value
     * @returns {?Literal}
     */
    createLiteral: function(value) {
        if (['string', 'number', 'boolean'].indexOf(typeof value) > -1) {
            var literal = {
                type: Syntax.Literal,
                value: value,
                raw: typeof value == 'string' ? ('"' + value + '"') : String(value)
            };

            if (typeof value != 'number' || typeof value == 'number' && Number.isFinite(value)) {
                return literal;
            }
        }

        return null;
    },
    /**
     * Create identifier
     *
     * @param {string} name
     * @returns {Identifier}
     */
    createIdentifier: function(name) {
        return {
            type: Syntax.Identifier,
            name: name
        };
    },
    /**
     * Is token a function
     *
     * @param {Token} token
     * @returns {boolean}
     */
    isFunction: function(token) {
        return this.isTypeFunction(token.type);
    },
    /**
     * Is type a function
     *
     * @param {string} type token type
     * @returns {boolean}
     */
    isTypeFunction: function(type) {
        return ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].indexOf(type) > -1;
    },
    /**
     * Is token a class
     *
     * @param {Token} token
     * @returns {boolean}
     */
    isClass: function(token) {
        return this.isTypeClass(token.type);
    },
    /**
     * Is type a class
     *
     * @param {string} type token type
     * @returns {boolean}
     */
    isTypeClass: function(type) {
        return ['ClassDeclaration', 'ClassExpression'].indexOf(type) > -1;
    },
    /**
     * Is token a block
     *
     * @param {Token} token
     * @returns {boolean}
     */
    isBlock: function(token) {
        return this.isTypeBlock(token.type);
    },
    /**
     * Is type a block
     *
     * @param {string} type token type
     * @returns {boolean}
     */
    isTypeBlock: function(type) {
        return ['BlockStatement', 'ForStatement', 'SwitchStatement', 'ClassBody'].indexOf(type) > -1;
    },
    /**
     * Create object
     *
     * @param {object=} from
     * @returns {boolean}
     */
    createObject: function(from) {
        return this.parse(from ? JSON.stringify(from) : '{}', true);
    },
    /**
     * Parse JS code
     *
     * @param {string} code
     * @param {boolean=false} asExpression
     * @returns {Token}
     */
    parse: function(code, asExpression) {
        return this.getFirstExpression(parser.parse(asExpression ? '(' + code + ')' : code));
    }
};
