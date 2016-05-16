"use strict";
(function(){
    var sequence = function(){
        var seq = 0;
        return function(){
            return seq ++;
        };
    };
    var ns = FClass.namespace("com.vgerbot.ui.explorer.model");
    ns.create("Item",{
        init:function(id,data){
            this.id = id;
            this.select(false);
            this.data = data;
        },
        select:function(selected){
            this.selected = selected;
        }
    })
    .create("Explorer",{
        superclass:"com.vgerbot.utils.Subject",
        statics:{
            nextSeq: sequence(),
            SUPPORTED_SPECS:["xs","sm","md","lg"],
            SUPPORTED_THEMES:["grid","list"],
            SUPPORTED_CHECK_VALUES:["true","false","show","hide"],
            //The relative complement of b in a
            relc: function(a,b){ // b对于a的相对补集
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
        },
        init: function(){
            this.callSuper();
            this.items = {};
            this.itemIds = [];
            this.id = "exp-"+this.class.nextSeq();
            this.selects = [];
            this.itemSeq = sequence();
        },
        _isArray:function(arr){
            return arr instanceof Array;
        },
        createItem: function(data){
            var item = ns.of("Item").create(this.id+"-"+this.itemSeq(),data);
            this.items[item.id] = item;
            this.itemIds.push(item.id);
            this.trigger("create",item);
        },
        deleteItem: function(ids){
            var that = this;
            var itemsToBeRemoved = [];
            ids.forEach(function(id){
                if(that.items.hasOwnProperty(id)){
                    itemsToBeRemoved.push(that.items[id]);
                }
            });
            that._deleteItems(itemsToBeRemoved);
        },
        _deleteItems:function(itemsToBeRemoved){
            var that = this;
            itemsToBeRemoved.forEach(function(item){
                delete that.items[item.id];
                var index = that.itemIds.indexOf(item.id);
                that.itemIds.splice(index, 1);
                var selIndex = that.selects.indexOf(item.id);
                that.selects.splice(selIndex, 1);
                that.trigger("removeItem", item);
            });
            that.trigger("remove", itemsToBeRemoved);
        },
        update: function(options){
            var that = this;
            if(options.data instanceof Array){
                var itemsToBeRemoved = [];
                for(var id in that.items){
                    itemsToBeRemoved.push(that.items[id]);
                }
                that._deleteItems(itemsToBeRemoved);
                options.data.forEach(function(data){
                    that.createItem(data);
                });
            }
            if(options.theme && that.class.SUPPORTED_THEMES.indexOf(options.theme) !== -1){
                that.trigger("updateTheme",options.theme);
            }
            if(options.spec && that.class.SUPPORTED_SPECS.indexOf(options.spec) !== -1){
                that.trigger("updateSpec",options.spec);
            }
            if(that.class.SUPPORTED_CHECK_VALUES.indexOf(options.check+"") !== -1){
                that.trigger("updateCheck", options.check);
            }
        },
        select:function(){
            var that = this,
                ids = Array.prototype.slice.call(arguments);
            var bselects = this.selects.slice();
            var indexMap = {};
            this.selects.forEach(function(id, index){
                indexMap[id] = index;
            });
            ids.forEach(function(id){
                that.items[id].select(true);
                var index = indexMap[id];
                if(index === undefined){
                    that.selects.push(id);
                }
            });
            this.trigger("select", this.selects, bselects);
        },
        unselect: function(){
            var that = this,
                ids = Array.prototype.slice.call(arguments);
            var bselects = that.selects.slice();
            ids.forEach(function(id){
                var index = that.selects.indexOf(id);
                if(index > -1){
                    that.selects.splice(index, 1);
                    that.items[id].select(false);
                }
            });
            that.trigger("select",that.selects,bselects);
        },
        selectAll: function(){
            this.select.apply(this, this.itemIds);
        },
        unselectAll : function(){
            this.unselect.apply(this, this.selects);
        },
        getItems : function(ids){
            if(this._isArray(ids)){
                return;
            }
            var retItems = [];
            var that = this;
            ids.forEach(function(id){
                var item = that.items[id];
                if(item !== undefined){
                    retItems.push(item);
                }
            });
            return retItems;
        }
    })
    ;
})();
