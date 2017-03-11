define([
    "Class"
],function(Class) {
    "use strict";

    return Class.create("Subject", {
        init: function(self){
            self.observers = {};
        },
        //注册事件
        on: on,
        //只执行一次
        one: one,
        //事件触发
        trigger: trigger,
        // 取消事件
        off: off
    });

    function Observer(source, name, data, callback, times) {
        this.source = source;
        this.name = name;
        this.data = data;
        this.callback = callback;
        this.times = times || Infinity;
    }

    function attach(self, names, callback, data, times) {
        if (names === undefined) {
            names = undefined + "";
        }

        var nameParts = names.split(",");
        for(var i=0;i<nameParts.length;i++){
            attachOne(nameParts[i].trim());
        }

        function attachOne(name){
            var parts = name.split(".");
            name = parts[0];
            var cls = parts[1];
            var obs = self.observers[name];
            if (!obs) {
                obs = {};
                self.observers[name] = obs;
            }
            var ob = obs[cls];
            if (!ob) {
                ob = [];
                obs[cls] = ob;
            }
            ob.push(new Observer(self, name, data, callback, times));
        }
    }


    function on(self, name, dataOrCallback, callback) {
        var data;
        if (typeof dataOrCallback === "function") {
            data = callback;
            callback = dataOrCallback;
        } else if (typeof callback === "function") {
            data = dataOrCallback;
        }
        attach(self, name, callback, data);
    }

    function one(self, name, dataOrCallback, callback) {
        var data;
        if (typeof dataOrCallback === "function") {
            data = callback;
            callback = dataOrCallback;
        } else if (typeof callback === "function") {
            data = dataOrCallback;
        }
        attach(self, name, callback, data, 1);
    }

    function trigger(self, names) {
        if (names === undefined) {
            names = undefined + "";
        }
        var nameParts = names.split(",");

        var args = Array.prototype.slice.call(arguments, 2);

        for(var i = 0; i < nameParts.length; i++){
            triggerOneName(nameParts[i].trim());
        }

        function triggerOneName(name){
            var parts = name.split(".");
            name = parts[0];
            var cls = parts[1];
            var observersOfName = self.observers[name];

            if (!observersOfName) {
                return false;
            }

            if (cls) {
                triggerByCls(self, observersOfName[cls], args);
            } else {
                triggerAll(self, observersOfName, args);
            }
        }
    }

    function triggerAll(self, observersOfName, args) {
        var has = false;
        for (var k in observersOfName) {
            has = true;
            var observers = observersOfName[k];
            if (observers && observers.length > 0) {
                for (var i = 0; i < observers.length; i++) {
                    var observer = observers[i];
                    callObserver(self, observer, args);
                }
            }
        }
        return has;
    }

    function triggerByCls(self, observers, args) {
        if (observers && observers.length > 0) {
            for (var i = 0; i < observers.length; i++) {
                var observer = observers[i];
                callObserver(self, observer, args);
            }
            return true;
        }
    }

    function off(self, names, func) {
        if (names === "*") {
            self.observers = {};
            return;
        }

        if (names === undefined) {
            names = undefined + "";
        }

        var nameParts = names.split(",");

        for(var i = 0; i < nameParts.length; i++){
            dettachOne(self, nameParts[i].trim(), func);
        }

        function dettachOne(self, name, func){
            var parts = name.split(".");
            name = parts[0];
            var cls = parts[1];
            var observersOfName = self.observers[name];
            if (!observersOfName) {
                return false;
            }
            if (cls) {
                observersOfName[cls] = undefined;
                delete observersOfName[cls];
            } else if ('function' === typeof func) {
                for (var k in observersOfName) {
                    var observerItems = observersOfName[k];
                    for (var i = 0; i > -1 && i < observerItems.length; i++) {
                        var observerItem = observerItems[i];
                        if (observerItem && observerItem.callback === func) {
                            observerItems.splice(i, 1);
                            i--;
                        }
                    }
                }
            } else {
                self.observers[name] = {};
            }
        }
    }

    function callObserver(self, observer, args) {
        if (observer !== undefined) {
            try {
                var callArgs = [observer];
                callArgs.push.apply(callArgs, args);
                observer.callback.apply(observer.source, callArgs);
            } catch (e) {
                throw e;
            } finally {
                observer.times -= 1;
            }
        }
    }
});
