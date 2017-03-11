define([
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