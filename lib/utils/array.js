module.exports = {
    /**
     * @param {Array} array
     * @param {*} value
     * @param {string=} property
     * @return {number}
     */
    indexOf: function(array, value, property) {
        for (var i = 0; i < array.length; i++) {
            var element = array[i];

            if (property) {
                if (element[property] === value) {
                    return i;
                }
            } else {
                if (element === value) {
                    return i;
                }
            }
        }

        return -1;
    },
    /**
     * @param {Array} array
     * @param {*} value
     * @param {string=} property
     * @return {boolean}
     */
    add: function(array, value, property) {
        if (this.indexOf(array, value, property) > -1) {
            return false;
        }

        array.push(value);

        return true;
    },
    /**
     * @param {Array} array
     * @param {*} value
     * @param {string=} property
     * @return {boolean}
     */
    remove: function(array, value, property) {
        var ix = this.indexOf(array, value, property);

        if (ix > -1) {
            array.splice(ix, 1);

            return true;
        }

        return false;
    },
    /**
     * @param {Array} array
     * @param {*} value
     * @param {string=} property
     * @return {boolean}
     */
    has: function(array, value, property) {
        return this.indexOf(array, value, property) > -1;
    },
    /**
     * @param {Array} array
     * @param {*} value
     * @param {string=} property
     * @return {?*}
     */
    search: function(array, value, property) {
        var ix = this.indexOf(array, value, property);

        if (ix > -1) {
            return array[ix];
        }

        return null;
    },
    /**
     * @param {*} test
     * @returns {boolean}
     */
    is: function(test) {
        return Array.isArray(test) || !!test &&
            typeof test.length == 'number' &&
            typeof test != 'string' &&
            typeof test != 'function';
    },
    /**
     * Create array from everything
     *
     * @param {*} source
     * @returns {Array}
     */
    from: function(source) {
        if (Array.isArray(source)) {
            return source;
        } else if (this.is(source)) {
            return Array.prototype.slice.call(source);
        } else if (typeof source != 'undefined') {
            return [source];
        }

        return [];
    }
};
