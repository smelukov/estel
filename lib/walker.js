var walker = require('estraverse');

exports.walk = function(ast, walkers, context) {
    walkers = walkers || {};
    walker.traverse(ast, {
        enter: function(token, parent) {
            var handler = walkers.hasOwnProperty(token.type) && walkers[token.type];
            var allHandler = walkers.hasOwnProperty('*') && walkers['*'];

            if (typeof allHandler == 'function') {
                allHandler.call(this, token, parent, context);
            }

            if (typeof handler == 'function') {
                return handler.call(this, token, parent, context);
            }
        }
    });
};
