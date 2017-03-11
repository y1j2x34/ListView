define([
    "Class"
], function(Class) {
    "use strict";
    return Class.create({
        name: "ObjectPath",
        pythonic: false,
        init: function(root, sep) {
            this.root = root || {};
            this.sep = sep || ".";
        },
        get: function(path, callback) {
            if (typeof path !== "string") {
                throw new Error("Illegal argument : " + path);
            }
            if (typeof callback !== "function") {
                callback = defaultCallback;
            }
            var self = this;
            var keys = path.split(self.sep);
            var obj = self.root;
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var node = callback.call(self, key, obj[key], keys, i);
                obj[key] = node;
                obj = node;
            }
            return obj;
        }
    });

    function defaultCallback(key, node) {
        return node || {};
    }
});