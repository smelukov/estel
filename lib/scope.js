var utils = require('./utils/index');

/**
 * Scope class
 *
 * @param {Scope=} parent
 * @param {string=} name
 * @constructor
 */
function Scope(parent, name) {
    this.name = name || null;
    this.scopes = [];
    this.references = {};
    this.thisRef = null;
    this.strict = false;
    this.parent = null;

    if (parent && parent instanceof Scope) {
        parent.addScope(this);
    }
}

/**
 * Add sub scope
 *
 * @param {Scope} scope
 * @return {boolean}
 */
Scope.prototype.addScope = function(scope) {
    var added = utils.array.add(this.scopes, scope);

    if (added) {
        if (scope.parent) {
            scope.parent.removeScope(scope)
        }

        scope.parent = this;
    }

    return added;
};

/**
 * Is has scope
 *
 * @param {Scope} scope
 * @return {boolean}
 */
Scope.prototype.hasScope = function(scope) {
    return utils.array.has(this.scopes, scope);
};

/**
 * Remove scope
 *
 * @param {Scope} scope
 * @return {boolean}
 */
Scope.prototype.removeScope = function(scope) {
    var removed = utils.array.remove(this.scopes, scope);

    if (removed) {
        scope.parent = null;
    }

    return removed;
};

/**
 * Set reference
 *
 * @param {string} name
 * @param {*=} value
 */
Scope.prototype.setReference = function(name, value) {
    var reference = this.findReference(name);

    if (reference) {
        return reference.scope.setOwnReference(name, value);
    }

    return this.setOwnReference(name, value);
};

/**
 * Set own reference
 *
 * @param {string} name
 * @param {*=} value
 * @returns {object} reference
 */
Scope.prototype.setOwnReference = function(name, value) {
    this.references[name] = typeof value == 'undefined' ? {} : value;

    return value;
};

/**
 * Has reference
 *
 * @param {string} name
 */
Scope.prototype.hasReference = function(name) {
    return !!this.findReference(name);
};

/**
 * Has own reference
 *
 * @param {string} name
 */
Scope.prototype.hasOwnReference = function(name) {
    return this.references.hasOwnProperty(name)
};

/**
 * Get reference
 *
 * @param {string} name
 */
Scope.prototype.getReference = function(name) {
    var reference = this.findReference(name);

    return reference ? reference.value : null;
};

/**
 * Set own reference
 *
 * @param {string} name
 */
Scope.prototype.getOwnReference = function(name) {
    if (this.hasOwnReference(name)) {
        return this.references[name]
    }

    return null;
};

/**
 * Get references names
 *
 * @returns {Array<string>}
 */
Scope.prototype.getReferenceNames = function() {
    var references = [];
    var cursor = this;

    while (cursor) {
        var ownReferences = cursor.getOwnReferenceNames();

        for (var i = 0; i < ownReferences.length; i++) {
            references.push(ownReferences[i]);
        }

        cursor = cursor.parent;
    }

    return references;
};

/**
 * Get own references names
 *
 * @returns {Array<string>}
 */
Scope.prototype.getOwnReferenceNames = function() {
    return Object.keys(this.references);
};

/**
 * Find reference
 *
 * @param {string} name
 * @returns {?{scope: Scope, name: String, value: *}}
 */
Scope.prototype.findReference = function(name) {
    var cursor = this;

    while (cursor && !cursor.hasOwnReference(name)) {
        cursor = cursor.parent;
    }

    if (cursor) {
        return {
            scope: cursor,
            name: name,
            value: cursor.getOwnReference(name)
        };
    }

    return null;
};

/**
 * Count scope references
 *
 * @returns {number}
 */
Scope.prototype.countReferences = function() {
    var cursor = this;
    var references = {};

    while (cursor) {
        for (var referenceName in cursor.references) {
            references[referenceName] = true;
        }

        cursor = cursor.parent;
    }

    return Object.keys(references).length;
};

/**
 * Count scope own references
 *
 * @returns {number}
 */
Scope.prototype.countOwnReferences = function() {
    return Object.keys(this.references).length;
};

/**
 * Remove own reference
 *
 * @param {string} name
 */
Scope.prototype.removeNearReference = function(name) {
    var cursor = this;

    while (cursor) {
        if (cursor.hasOwnReference(name)) {
            cursor.removeOwnReference(name);

            return;
        }

        cursor = cursor.parent;
    }
};

/**
 * Remove reference
 *
 * @param {string} name
 */
Scope.prototype.removeReference = function(name) {
    var cursor = this;

    while (cursor) {
        cursor.removeOwnReference(name);
        cursor = cursor.parent;
    }
};

/**
 * Remove own reference
 *
 * @param {string} name
 */
Scope.prototype.removeOwnReference = function(name) {
    if (this.references.hasOwnProperty(name)) {
        delete this.references[name];
    }
};

module.exports = Scope;
