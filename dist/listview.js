(function(globe, factory) {
    "use strict";
    if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else if (typeof define === "function" && define.amd) {
        define('Class',factory);
    } else {
        globe.Class = factory();
    }
})(this, function() {
    // jshint strict:false

    var constructorFactoryCache = {};

    function Class() {}

    Class.create = createClass;
    Class.extend = extend;
    Class.singleton = singleton;

    return Class;

    function singleton(){
        var Cls = createClass.apply(null, arguments);
        return new Cls();
    }

    function createClass(name, definition) {
        var args = arguments;
        switch (args.length) {
            case 0:
                throw new Error("Illegal arguments");
            case 1:
                if (isString(args[0])) {
                    definition = {};
                } else {
                    definition = name;
                    name = definition.name || "<anonymous>";
                }
                break;
        }
        return extend(Class, definition);
    }

    function extend(Super, definition) {

        if(arguments.length === 1){
            if(isFunction(Super)){
                definition = {};
            }else{
                definition = Super;
                Super = Class;
            }
        }

        function F() {}
        F.prototype = Super.prototype;

        var propertyNames = Object.getOwnPropertyNames(definition);
        var init = definition.init;

        removeFirst(propertyNames, "init");

        if (typeof init !== "function") {
            init = noop;
        }
        var className = definition.name || "Class";
        // 启用python风格
        var isPythonicOn = definition.pythonic !== false;

        if(isPythonicOn){
            init = pythonic(init);
        }

        var clazz = createConstructor(className, init);

        clazz.prototype = new F();
        defineConstant(clazz.prototype, "constructor", clazz);
        defineConstant(clazz.prototype, "uber", Super.prototype);
        defineConstant(clazz.prototype, "clazz", clazz);
        defineConstant(clazz.prototype, "superclass", Super);
        defineConstant(clazz, "superclass", Super);
        defineConstant(clazz, "extend", function(definition) {
            return extend.call(clazz, clazz, definition);
        });
        var $super = function(first){
            var self = this;
            if(arguments.length === 1 && isArgument(first)){
                self.superclass.apply(self, first);
            }else{
                self.superclass.apply(self, arguments);
            }
        };

        defineConstant(clazz.prototype, "$super", $super);

        var statics = definition.statics || {};
        removeFirst(propertyNames, "statics");

        copyDescriptors(statics, clazz, Object.getOwnPropertyNames(statics));

        if (isPythonicOn) {
            iteratePropNames(definition, propertyNames, function(origin, name) {
                var value = origin[name];
                if (isFunction(value)) {
                    clazz.prototype[name] = pythonic(value);
                } else {
                    copyDescriptor(origin, clazz.prototype, name);
                }
            });
        } else {
            copyDescriptors(definition, clazz.prototype, propertyNames, function(origin, dest, name) {
                return isFunction(origin[name]);
            });
        }

        removeWhere(propertyNames, function(name) {
            return isFunction(definition[name]);
        });
        return clazz;
    }
    function createConstructor(className, init){
        if(!constructorFactoryCache[className]){
            // jshint evil: true
            constructorFactoryCache[className] = new Function("init", "return function " + className + "(){return init.apply(this, arguments);}");
        }
        return constructorFactoryCache[className](init);
    }
    function defineConstant(target, name, value) {
        Object.defineProperty(target, name, {
            value: value,
            enumerable: false,
            configurable: false,
            writable: false
        });
    }

    function iteratePropNames(origin, propNames, callback) {
        if (!isFunction(callback)) {
            callback = noop;
        }
        if (isString(propNames)) {
            callback(origin, propNames);
        }
        for (var i = 0; i < propNames.length; i++) {
            callback(origin, propNames[i]);
        }
    }

    function copyDescriptors(origin, dest, propNames, filter) {
        if (!isFunction(filter)) {
            filter = acceptAll;
        }
        iteratePropNames(origin, propNames, function(origin, name) {
            if (filter(origin, dest, name)) {
                copyDescriptor(origin, dest, name);
            }
        });
    }

    function copyDescriptor(origin, dest, name) {
        var descriptor = Object.getOwnPropertyDescriptor(origin, name);
        if (isDefined(descriptor)) {
            Object.defineProperty(dest, name, descriptor);
        }
    }

    function isString(value) {
        return typeof value === "string";
    }

    function isFunction(value) {
        return typeof value === "function";
    }

    function isDefined(value) {
        return value !== undefined && value !== null;
    }

    function isArgument(value){
        return value + "" === "[object Arguments]";
    }

    function acceptAll() {
        return true;
    }
    function removeFirst(array, element){
        var index = array.indexOf(element);
        if(index !== -1){
            return array.splice(index, 1);
        }else{
            return [];
        }
    }
    function removeWhere(array, acceptFilter){
        if(!acceptFilter){
            return [];
        }
        var removed = [];
        for(var i =0;i<array.length;i++){
            var toRemove = acceptFilter(array[i]);
            if(toRemove === "break"){
                break;
            }
            if(toRemove){
                removed.push(array[i]);
                array.splice(i, 1);
            }
        }
        return removed;
    }
    function pythonic(fn){
        return function(){
            var self = this;
            var args = [self];
            args.push.apply(args, arguments);
            return fn.apply(self, args);
        };
    }
    function noop() {}
});

define('supports/opath',[
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
define('Subject',[
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

define('listview-item.model',["Class"], function(Class){
    "use strict";

    return Class.create({
        name: "ListViewItemModel",
        init: function(self, id, data){
            self.id = id;
            self.select(false);
            self.data = data;
        },
        select:function(self, selected){
            self.selected = selected;
        }
    });
});
define('listview.model',[
    "Class",
    "Subject",
    "./listview-item.model"
], function(Class, Subject, Item){
    "use strict";
    return Class.extend(Subject, {
        name: "ListViewModel",
        statics:{
            nextSeq: sequence(),
            SUPPORTED_SPECS:["xs","sm","md","lg"],
            SUPPORTED_THEMES:["grid","list"],
            SUPPORTED_CHECK_VALUES:["true","false","show","hide"],
            relc: relc
        },
        init: init,
        createItem: createItem,
        deleteItem: deleteItem,
        _deleteItems: _deleteItems,
        update: update,
        select: select,
        unselect: unselect,
        selectAll: selectAll,
        unselectAll: unselectAll,
        getItems: getItems,
        off: off
    });
    function init(self){
        self.$super();
        self.items = {};
        self.itemIds = [];
        self.id = "exp-"+self.clazz.nextSeq();
        self.selects = [];
        self.itemSeq = sequence();
    }
    function _isArray(arr){
        return arr instanceof Array;
    }
    function createItem(self, data){
        var item = new Item(self.id+"-"+self.itemSeq(),data);
        self.items[item.id] = item;
        self.itemIds.push(item.id);
        self.trigger(self.id+".create",item);
        self.trigger("create",item);
    }
    function deleteItem(self, ids){
        var itemsToBeRemoved = [];
        ids.forEach(function(id){
            if(self.items.hasOwnProperty(id)){
                itemsToBeRemoved.push(self.items[id]);
            }
        });
        self._deleteItems(itemsToBeRemoved);
    }
    function _deleteItems(self, itemsToBeRemoved){
        itemsToBeRemoved.forEach(function(item){
            delete self.items[item.id];
            var index = self.itemIds.indexOf(item.id);
            self.itemIds.splice(index, 1);
            var selIndex = self.selects.indexOf(item.id);
            self.selects.splice(selIndex, 1);
            self.trigger(self.id+".removeItem", item);
            self.trigger("removeItem", item);
        });
        self.trigger(self.id+".remove", itemsToBeRemoved);
        self.trigger("remove", itemsToBeRemoved);
    }
    function update(self, options){
        if(options.data instanceof Array){
            var itemsToBeRemoved = [];
            for(var id in self.items){
                itemsToBeRemoved.push(self.items[id]);
            }
            self._deleteItems(itemsToBeRemoved);
            options.data.forEach(function(data){
                self.createItem(data);
            });
        }
        if(options.theme && self.clazz.SUPPORTED_THEMES.indexOf(options.theme) !== -1){
            self.trigger(self.id+".updateTheme",options.theme);
            self.trigger("updateTheme",options.theme);
        }
        if(options.spec && self.clazz.SUPPORTED_SPECS.indexOf(options.spec) !== -1){
            self.trigger(self.id+".updateSpec",options.spec);
            self.trigger("updateSpec",options.spec);
        }
        if(self.clazz.SUPPORTED_CHECK_VALUES.indexOf(options.check+"") !== -1){
            self.trigger(self.id+".updateCheck", options.check);
            self.trigger("updateCheck", options.check);
        }
    }
    function select(self){
        var ids = Array.prototype.slice.call(arguments, 1);
        var bselects = self.selects.slice();
        var indexMap = {};
        self.selects.forEach(function(id, index){
            indexMap[id] = index;
        });
        ids.forEach(function(id){
            self.items[id].select(true);
            var index = indexMap[id];
            if(index === undefined){
                self.selects.push(id);
            }
        });
        self.trigger(self.id+".select", self.selects, bselects);
        self.trigger("select", self.selects, bselects);
    }
    function unselect(self){
        var ids = Array.prototype.slice.call(arguments, 1);
        var bselects = self.selects.slice();
        ids.forEach(function(id){
            var index = self.selects.indexOf(id);
            if(index > -1){
                self.selects.splice(index, 1);
                self.items[id].select(false);
            }
        });
        self.trigger(self.id+".select",self.selects,bselects);
        self.trigger("select",self.selects,bselects);
    }
    function selectAll(self){
        self.select.apply(self, self.itemIds);
    }
    function unselectAll(self){
        self.unselect.apply(self, self.selects);
    }
    function getItems(self, ids){
        if(_isArray(ids)){
            return;
        }
        var retItems = [];
        ids.forEach(function(id){
            var item = self.items[id];
            if(item !== undefined){
                retItems.push(item);
            }
        });
        return retItems;
    }
    function off(self, name){
        if(name === "*") return false;
        if(typeof name === "string"){
            var splited = name.split(".");
            if(splited[1] === "ui"){
                return false;
            }
        }
        return self.uber.off.apply(self, Array.prototype.slice.call(arguments,1));
    }
    // b对于a的相对补集
    function relc(a,b){
        if(!(a instanceof Array && b instanceof Array)){
            return [];
        }

        if(a.length < 1 || b.length < 1){
            return b;
        }
        var indexMap = {};
        a.forEach(function(val, index){
            indexMap[val] = index;
        });
        var difVals = [];
        b.forEach(function(val){
            if(indexMap[val] === undefined){
                difVals.push(val);
            }
        });
        return difVals;
    }
    function sequence(){
        var seq = 0;
        return function(){
            return seq ++;
        };
    }
});
define('dragselector.plugin',[
    "jquery"
], function($){
    "use strict";

    $.fn.dragSelector = function(notDestroy){
        if(notDestroy === true){
            return this.each(function(index, element){
                var $elm = $(element);
                var $sel = $elm.find(".drag-selector");
                if($sel.length < 1){
                    return;
                }
                var eventId = $sel.data("eventId");
                if(eventId === undefined){
                    return;
                }
                $elm.off("mousedown."+eventId);
                $(document).off("mousemove."+eventId);
            });
        }
        return this.each(function(index, element){
            var eventId = new Date().getTime() + index;
            var $elm = $(element);
            var $sel = $("<div>");

            $sel.data("eventId", eventId);

            $sel.addClass("drag-selector");
            $sel.appendTo($elm);

            function mousePosition(e){
                var $cur = $(e.target);
                var mx,my;
                if(e.target === element){
                    mx = e.offsetX;
                    my = e.offsetY;
                }else{
                    var  ofx = $cur.offset();
                    var eofx = $elm.offset();
                    mx = ofx.left - eofx.left + e.offsetX;
                    my = ofx.top  - eofx.top  + e.offsetY;
                }
                return {
                    left: mx,
                    top: my
                };
            }
            function selectorEventHandlerFactory(sx, sy){
                return function(e){
                    $sel.addClass("show");
                    var mp = mousePosition(e);
                    var mx = mp.left,my = mp.top;
                    var
                        selx = Math.min(mx, sx),
                        selw = Math.abs(sx - mx),
                        sely = Math.min(my, sy),
                        selh = Math.abs(sy - my);

                    var box = {
                        left:selx,
                        top: sely,
                        width:selw,
                        height:selh
                    };
                    $sel.css(box);
                    $elm.trigger("dragSelect",box);
                };
            }
            var mouseMoveEvent = "mousemove."+ eventId;
            $elm.on("mousedown."+eventId, function(e){
                if(e.button !== 0){
                    return;
                }
                $sel.css({
                    width:0,
                    height:0
                });
                var mp = mousePosition(e);
                $elm.on(mouseMoveEvent, selectorEventHandlerFactory(mp.left, mp.top));
            });
            $(document).on("mouseup."+eventId, function(e){
                if(e.button !== 0){
                    return;
                }
                $sel.removeClass("show");
                $elm.off(mouseMoveEvent);
            });
        });
    };

    return $.fn.dragSelector;
});
define('listview.plugin',[
    "jquery",
    "./supports/opath",
    "./listview.model",
    "./dragselector.plugin"
], function($, ObjectPath, ListViewModel) {
    "use strict";
    var LISTVIEW_DATA_NAME = "listview";
    var LISTVIEW_ITEM_DATA_NAME = "listview-item-data";
    var DEFAULT_OPTIONS = {
        theme: "grid", // list,grid
        spec: "md", // xs, sm, md, lg, xlg
        template: itemTemplate,
        data: [],
        check: "hide"
    };
    var $document = $(document);

    $.fn.listview = function(options) {
        if (options === undefined || options === null) {
            return;
        }
        if (options === false) {
            return this.each(function(index, element) {
                var $elm = $(element);
                var listview = $elm.data(LISTVIEW_DATA_NAME);
                if (listview instanceof ListViewModel) {
                    destroy(listview, $elm);
                }
            });
        }
        options = $.extend({}, DEFAULT_OPTIONS, options);

        return this.each(function(index, element) {
            var $elm = $(element);
            var listview = $elm.data(LISTVIEW_DATA_NAME);
            if (listview instanceof ListViewModel) {
                listview.update(options);
                return;
            }
            listview = createListView(options, $elm);
            $elm.data(LISTVIEW_DATA_NAME, listview);
        });
    };

    function createListView(options, element) {
        var $elm = $("<div>");
        var $list = $("<ul>");
        $elm.addClass("listview")
            .addClass("listview-" + options.theme)
            .addClass("listview-" + options.spec);
        if (options.check + "" === "false" || options.check + "" === "hide") {
            $elm.addClass("hide-check");
        }
        $list.addClass("listview-item-list");
        $elm.append($list);

        var listview = new ListViewModel();

        listview.on(listview.id + ".remove", function(e, items) {
            var ids = [];
            items.forEach(function(item) {
                ids.push(item.id);
            });
            $(selectElementsByIds(ids)).remove();
        });
        listview.on(listview.id + ".select", function(e, selects, lastSelects) {
            var newSelects = ListViewModel.relc(lastSelects, selects),
                unselects = ListViewModel.relc(selects, lastSelects),
                items;

            if (unselects.length > 0) {
                items = selectElementsByIds(unselects);
                $(items)
                    .removeClass("active")
                    .each(function(index, item) {
                        $(item).find(".item-check>input[type=checkbox]")
                            .removeAttr("checked").removeProp("checked");
                    });
            }

            if (newSelects.length > 0) {
                items = selectElementsByIds(newSelects);
                $(items).addClass("active")
                    .each(function(index, item) {
                        $(item).find(".item-check>input[type=checkbox]")
                            .attr("checked", "checked").prop("checked", "checked");
                    });
            }
        });
        listview.on(listview.id + ".create", function(e, item) {
            var $item = $("<li>");
            $item.attr({
                id: item.id
            }).addClass("listview-item");
            var template;
            switch (typeof options.template) {
                case "string":
                    template = options.template;
                    break;
                case "function":
                    template = options.template(item);
                    break;
                default:
                    template = itemTemplate();
            }
            $item.append(parseTemplate(item, template));
            $item.data(LISTVIEW_ITEM_DATA_NAME, item);
            $list.append($item);
        });
        listview.on(listview.id + ".updateTheme", function(e, theme) {
            $elm
                .removeClass("listview-grid")
                .removeClass("listview-list")
                .addClass("listview-" + theme);
            options.theme = theme;
        });
        listview.on(listview.id + ".updateSpec", function(e, spec) {
            var supportedSpecs = ["xs", "sm", "md", "lg"];
            supportedSpecs.forEach(function(spec) {
                $elm.removeClass("listview-" + spec);
            });
            $elm.addClass("listview-" + spec);
            options.spec = spec;
        });
        listview.on(listview.id + ".updateCheck", function(e, check) {
            switch (check + "") {
                case "true":
                case "show":
                    $elm.removeClass("hide-check");
                    break;
                case "false":
                case "hide":
                    $elm.addClass("hide-check");
                    break;
            }
            options.check = check;
        });
        $elm.on("click", function(e) {
            var $target = $(e.target);
            if ($elm.prop("dragged")) {
                $elm.removeProp("dragged");
                return;
            }
            if (($target.is($elm) || $target.is($list)) && !e.ctrlKey && !e.shiftKey) {
                listview.unselectAll();
            }
        });
        $elm.on("click", ".listview-item", function(e) {
            var $item = $(e.currentTarget);
            var item = $item.data(LISTVIEW_ITEM_DATA_NAME);
            var index = $item.index();
            if (e.shiftKey) {
                var $items = $elm.find(".listview-item");
                var firstIndex = listview.shiftSelectIndex;
                if (firstIndex === undefined) {
                    if (listview.selects.length > 0) {
                        firstIndex = $elm.find("#" + listview.selects[listview.selects.length - 1]).index();
                    } else {
                        firstIndex = 0;
                    }
                    listview.shiftSelectIndex = firstIndex;
                }
                var ids = [];
                var minIndex = Math.min(firstIndex, index),
                    maxIndex = Math.max(firstIndex, index);
                $items.slice(minIndex, maxIndex + 1).each(function(index, itemElement) {
                    ids.push($(itemElement).data(LISTVIEW_ITEM_DATA_NAME).id);
                });
                var unselects = listview.selects.filter(function(id) {
                    var itemIndex = $("#" + id).index();
                    return itemIndex < minIndex || itemIndex > maxIndex;
                });
                listview.unselect.apply(listview, unselects);
                listview.select.apply(listview, ids);
            } else if (e.ctrlKey) {
                if (item.selected) {
                    listview.unselect(item.id);
                } else {
                    listview.select(item.id);
                    listview.shiftSelectIndex = index;
                }
            } else {
                if (item.selected && listview.selects.length < 2) {
                    listview.unselectAll();
                } else {
                    listview.unselectAll();
                    listview.select(item.id);
                    listview.shiftSelectIndex = index;
                }
            }
            e.stopPropagation();
        });
        $elm.on("dblclick", ".item-name", function(e) {
            var $itemName = $(e.currentTarget);
            var item = $itemName.closest(".listview-item")
                .data(LISTVIEW_ITEM_DATA_NAME);
            $itemName.attr("contenteditable", "").text(item.data.cfg.name).focus();
        });
        $elm.on("mousedown", ".item-name[contenteditable]", function(e) {
            e.stopPropagation();
        });
        $elm.on("keyup", ".item-name", function(e) {
            var $itemName = $(e.currentTarget);
            if (e.ctrlKey) {
                $itemName.removeAttr("contenteditable");
                var item = $itemName.closest(".listview-item")
                    .data(LISTVIEW_ITEM_DATA_NAME);
                item.data.cfg.name = $itemName.text().trim();
                $itemName.closest(".listview-item-details")
                    .attr("title", $itemName.text().trim());
                listview.trigger("submit", item, "name");
                e.preventDefault();
                e.stopPropagation();
            }
        });
        $elm.on("focusout", ".item-name", function(e) {
            var $itemName = $(e.currentTarget);
            if ($itemName.attr("contenteditable") === undefined) {
                return;
            }
            $itemName.removeAttr("contenteditable");
            var item = $itemName
                .closest(".listview-item")
                .data(LISTVIEW_ITEM_DATA_NAME);
            $itemName.text(item.data.cfg.name);
        });
        var shiftKeyDown = false,
            ctrlKeyDown = false;
        $document.on("keydown." + listview.id, function(e) {
            shiftKeyDown = e.shiftKey;
            ctrlKeyDown = e.ctrlKey;
            if (e.keyCode === 65 && e.ctrlKey) { // ctrl + A 选择所有
                listview.selectAll();
                e.stopPropagation();
                e.preventDefault();
            }
        });
        $document.on("keyup." + listview.id, function(e) {
            if (e.keyCode === 17) {
                ctrlKeyDown = false;
            }
            if (e.keyCode === 16) {
                shiftKeyDown = false;
            }
        });
        $elm.on("dragSelect", function(e, box) {
            // 在按下Ctrl键点击鼠标多选时，鼠标抖一下容易取消选择。
            if (ctrlKeyDown && box.width < 20 && box.height < 20) {
                return;
            }
            var boxBottom = box.top + box.height;
            $elm.prop("dragged", true);

            var selects = [];
            var unselects = [];
            var eofs = $elm.offset();
            // var eofs = $elm[0].getBoundingClientRect();
            var $items = $elm.find(".listview-item");
            var itemHeight = $items.height();
            var itemWidth = $items.width();
            $items.each(function(index, itemElement) {
                var $itemElm = $(itemElement);
                var item = $itemElm.data(LISTVIEW_ITEM_DATA_NAME);
                var iofs = $itemElm.offset();

                var itemTop = iofs.top - eofs.top;
                if (itemTop > boxBottom) {
                    if (!shiftKeyDown && !ctrlKeyDown) {
                        unselects.push.apply(unselects, listview.itemIds.slice(index));
                    }
                    return false;
                }
                var itemBottom = itemTop + itemHeight;
                if (itemBottom < box.top) {
                    if (!shiftKeyDown && !ctrlKeyDown) {
                        if (item.selected) {
                            unselects.push(item.id);
                        }
                    }
                    return;
                }
                var itemBox = {
                    left: iofs.left - eofs.left,
                    top: itemTop,
                    width: itemWidth,
                    height: itemHeight
                };
                if (collision(box, itemBox)) {
                    if (!item.selected) {
                        selects.push(item.id);
                    }
                } else if (!shiftKeyDown && !ctrlKeyDown) {
                    if (item.selected) {
                        unselects.push(item.id);
                    }
                }
            });
            listview.unselect.apply(listview, unselects);
            listview.select.apply(listview, selects);
        });

        $elm.dragSelector();

        element.empty().append($elm);

        if (options.data instanceof Array) {
            listview.update({
                data: options.data
            });
        }
        return listview;
    }

    function selectElementsByIds(ids) {
        var elements = [];
        ids.forEach(function(id) {
            var element = document.getElementById(id);
            if (element !== undefined) {
                elements.push(element);
            }
        });
        return elements;
    }

    function destroy(listview, $elm) {
        listview.off(listview.id);
        $elm.removeData(LISTVIEW_DATA_NAME);
        $elm.dragSelector(false);
        $elm.find(".listview").remove();
        $document.off("keydown." + listview.id).off("keyup." + listview.id);
    }

    function collision(boxa, boxb) {
        if (boxa.left >= boxb.left && boxa.left >= boxb.left + boxb.width) {
            return false;
        } else if (boxa.left <= boxb.left && boxa.left + boxa.width <= boxb.left) {
            return false;
        } else if (boxa.top >= boxb.top && boxa.top >= boxb.top + boxb.height) {
            return false;
        } else if (boxa.top <= boxb.top && boxa.top + boxa.height <= boxb.top) {
            return false;
        }
        return true;
    }

    function itemTemplate() {
        return [
            "<ul class='listview-item-details' title='${cfg.name}'>",
            "<li class='item-check'><input type='checkbox'></li>",
            "<li class='item-icon ${cfg.icon}'></li>",
            "<li class='item-name'>${cfg.name}</li>",
            "</ul>"
        ].join("");
    }

    function parseTemplate(item, template) {
        var opath = new ObjectPath(item.data, ".");
        return template.replace(/\$\{([^\}]+)\}/g, function(r, path) {
            // return new Function("cfg","item","return "+path+";")(item.data.cfg);
            return opath.get(path);
        });
    }
});
require.config({
    "baseUrl": "/src/script",
    "paths": {
        "jquery": "/vendors/jquery/jquery.min",
        "Class": "supports/Class",
        "Subject": "supports/Subject"
    }
});
require(["listview.plugin"]);
define("main", function(){});

