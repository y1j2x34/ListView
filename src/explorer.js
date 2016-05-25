/*
* @author y1j1x24
* @version 1.0
* @datetime 2016/05/16
* @site https://github.com/y1j2x34/web-explorer
*/

"use strict";
// jshint -W030
!(function(){
    function ConstConfigure(value){
        this.value          =   value;
        this.writable       =   false;
        this.configurable   =   true;
        this.enumerable     =   true;
    }
    function createConstructor(init, name){
        // jshint -W054
        var constr = new Function("init","return function "+name+"(){init.apply(this,arguments);}")(init);
        // var constr = function(){
        //     init.apply(this, arguments);
        // };
        var initToString = init.toString();
        var left = initToString.indexOf("(");
        var right = initToString.indexOf(")");
        var initDef = initToString.substring(left, right+1);
        var toString = "function "+name+initDef+"{init.apply(this,arguments);}";

        Object.defineProperties(constr,{
            name        :   {value:name},
            toString    :   new ConstConfigure(function(){
                                return toString;
                            })
        });

        return constr;
    }
    function forEachProp(obj,callback){
        Object.getOwnPropertyNames(obj).forEach(callback);
    }
    function _copy(source, dest,ignores){
        var ignoresMap = {};
        if(ignores instanceof Array){
            for(var i = 0; i < ignores.length; i++){
                ignoresMap[ignores[i]] = true;
            }
        }
        forEachProp(source, function(prop){
            if(dest.hasOwnProperty(prop)){
                return;
            }
            if(ignoresMap[prop]){
                return;
            }
            var def = Object.getOwnPropertyDescriptor(source, prop);
            Object.defineProperty(dest, prop, def);
        });
    }
    function _extendsStatics(clazz){
        var superclass = clazz.superclass;
        if(superclass == clazz) return;
        var ignoresMap = {
            "classname":true,
            "constructor":true
        };
        forEachProp(superclass,function(prop){
            if(prop in clazz || ignoresMap[prop]){
                return;
            }
            Object.defineProperty(clazz, prop, {
                get:function(){
                    return superclass[prop];
                },
                set:function(newValue){
                    superclass[prop] = newValue;
                }
            });
        });
    }
    function _copyStatics(clazz, statics){
        var ignoresMap = {
            "classname"     : true,
            "name"          : true,
            "constructor"   : true,
            "create"        : true,
            "prototype"     : true
        };
        forEachProp(statics,function(prop){
            if(ignoresMap[prop]){
                return;
            }
            Object.defineProperty(clazz, prop,{
                value:statics[prop],
                writable: true
            });
        });
    }
    function _newInstance(){
        // jshint -W040
        var constr = this;
        var instance = Object.create(constr.prototype);
        constr.apply(instance,arguments);
        return instance;
    }
    function Sup(){}

    Object.defineProperties(Sup,{
        create      :   new ConstConfigure(_newInstance),
        classname   :   new ConstConfigure("Sup"),
        constructor :   new ConstConfigure(Sup)
    });
    Object.defineProperties(Sup.prototype, {
        superclass  :   new ConstConfigure(Sup),
        "const"       :   new ConstConfigure(function(name, value){
                            Object.defineProperty(this, name, new ConstConfigure(value));
                        }),
        callSuper   :   new ConstConfigure(function(){
                            // jshint -W103  
                            var superObj = this.__proto__.__proto__;
                            this.superclass.constructor.apply(superObj,arguments);
                        })
    });

    var classes = {
        "Sup" : Sup
    };

	function createClass(def){
		var name = def.name;
		var superclass = def.superclass;
        // jshint -W098
		var init = def.init || function(){};
        var statics = def.statics || {};
        var clazz = createConstructor(init, name);

		clazz.prototype = Object.create(superclass.prototype,{
            constructor : new ConstConfigure(clazz),
            superclass  : new ConstConfigure(superclass),
            classname   : new ConstConfigure(name),
            "class"     : new ConstConfigure(clazz)
        });

        Object.defineProperties(clazz, {
            superclass  :   new ConstConfigure(superclass),
            constructor :   new ConstConfigure(clazz)
        });
        // 拷贝静态属性
        _extendsStatics(clazz);
        // 拷贝静态变量
        _copyStatics(clazz,statics);
        // 拷贝定义
        _copy(def, clazz.prototype,["name","statics"]);
        return clazz;
	}

    classes.Error = createClass({
        name        : "Error",
        superclass  : Sup,
        init        : Error
    });

    function _create(){
        var args = arguments;
        var name,def;
        if(args.length === 1){
            var argType = typeof args[0];
            switch(argType){
            case "string":
                name = args[0];
            break;
            case "object":
                name = args[0].name;
                def = args[0];
            break;
            case "function":
                if(!args[0].name){
                    throw classes.Error.create("anonymous constructor ");
                }else{
                    name = args[0].name;
                    def = {
                        init: args[0]
                    };
                }
            break;
            default:
                throw classes.Error.create("invalid type :" + argType);
            }
        }else if(args.length >= 2){
            name = args[0];
            if(typeof args[1] === "function"){
                def = {
                    init: args[1]
                };
            }else{
                def = args[1];
            }
        }
        if(def === undefined){
            def = {};
        }
        // 参数设置
        def.name = def.name || name;
        if(!def.superclass || !(def.superclass.prototype instanceof Sup)){
            def.superclass = classes[def.superclass] || classes.Sup;
        }
        return createClass(def);
    }
    function _namespace(ns){
        var caller = {
            namespace : !ns?"":ns + "."
        };
        return {
            of:function(name){
                return classes[caller.namespace + name];
            },
            create:function(){
                var clazz =  _create.apply(caller,arguments);
                if(!!caller.namespace){
                    classes[caller.namespace + clazz.name] = clazz;
                }else{
                    classes[clazz.name] = clazz;
                }
                return this;
            },
            classes:function(){
                var cloned = {};
                for(var name in classes){
                    if(name.indexOf(caller.namespace) === 0){
                        cloned[name] = classes[name];
                    }
                }
                return cloned;
            }
        };
    }
    window.FClass = _namespace("");
    window.FClass.namespace = _namespace;
})();
(function(){
    function defaultCallback(key,node){
        return node || {};
    }
    FClass.namespace("com.vgerbot.utils")
    .create("OPath",{
        init:function(root, sep){
            this.root = root || {};
            this.sep = sep || ".";
        },
        get:function(path, callback){
            if(typeof path != "string"){
    			throw new Error("Illegal argument : "+path);
    		}
    		if(typeof callback !== "function"){
    			callback = defaultCallback;
    		}
    		var keys = path.split(this.sep);
    		var obj = this.root;
    		for(var i=0;i<keys.length;i++){
    			var key = keys[i];
    			var node = callback.call(this,key,obj[key],keys,i);
    			obj[key] = node;
    			obj = node;
    		}
    		return obj;
        }
    });
})();

(function(){
    var utils = FClass.namespace("com.vgerbot.utils");

	function callObserver(observer,args){
		if(observer !== undefined && observer !== null){
			try{
				var callArgs = [observer];
				callArgs.push.apply(callArgs,args);
				observer.callback.apply(observer.source,callArgs);
			}catch(e){
				console.error(e);
			}finally{
				observer.times -= 1;
			}
		}
	}

    utils.create("Observer",{
        init:function(source,name,data,callback,times){
            this.callSuper();
    		this.source = source;
    		this.name = name;
    		this.data = data;
    		this.callback = callback;
    		this.times = times || Infinity;
    	}
    })
    .create("Subject",{
        init: function(){
            this.callSuper();
            this.observers = {};
		    this.$$opath = utils.of("OPath").create(this.observers);
        },
        __attach:function(name,callback,data,times){
            var caller = this;
    		if(name === undefined){
    			name = undefined + "";
    		}
    		var observers = caller.$$opath.get(name,function(key,node,keys,i){
    			if(i === keys.length-1){
    				return [];
    			}else{
    				return node || {};
    			}
    		});
    		observers.push(utils.of("Observer").create(caller,name,data,callback,times));
            return this;
    	},
        on:function(name,dataOrCallback,callback){
            var data;
    		if('function' === typeof dataOrCallback){
    			data = callback;
    			callback = dataOrCallback;
    		}else if('function' === typeof callback){
    			data = dataOrCallback;
    		}
    		return this.__attach(name,callback,data);
    	},
        one:function(name,dataOrCallback,callback){
            var data;
    		if('function' === typeof dataOrCallback){
    			data = callback;
    			callback = dataOrCallback;
    		}else if('function' === typeof callback){
    			data = dataOrCallback;
    		}
    		return this.__attach(name,callback,data,1);
    	},
        trigger : function(name){
            var Observer = utils.of("Observer");

    		if(name === undefined){
    			name = undefined + "";
    		}
    		var observers = this.$$opath.get(name,function(key,node){
    			return node;
    		});
    		if(observers){
    			var args = Array.prototype.slice.call(arguments,1);
    			(function call(observers){
    				for(var k in observers){
    					var obs = observers[k];
    					if(obs instanceof Observer){
    						callObserver.call(this,obs,args);
    					}else{
    						call(obs);
    					}
    				}
    			})(observers);
    			return true;
    		}
    		return false;
    	},
        off: function(name,func){
            var Observer = utils.of("Observer");
    		if(name === undefined){
    			name = undefined + "";
    		}
            if(name === "*"){
                this.observers = this.$$opath.root = {};
                return;
            }
    		var observers = this.$$opath.get(name);

    		if(typeof func !== "function"){
    			this.$$opath.get(name,function(key,node,keys,i){
    				if(i === keys.length - 1){
    					return {};
    				}else{
    					return node;
    				}
    			});
    		}else{
    			(function loop(observers){
    				for(var i in observers){
    					var obs = observers[i];
    					if((obs instanceof Observer) && obs.callback === func){
    						observers[i] = undefined;
    					}else{
    						loop(obs);
    					}
    				}
    				if(observers instanceof Array){
    					while(true){
    						var i = observers.indexOf(undefined);
    						if(i == -1) break;
    						observers.splice(i,1);
    					}
    				}else{
    					for(var key in observers){
    						if(observers[key] === undefined){
    							delete observers[key];
    						}
    					}
    				}
    			})(observers);
    		}
            return this;
    	}
    });
})();
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
            this.trigger(this.id+".create",item);
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
                that.trigger(that.id+".removeItem", item);
                that.trigger("removeItem", item);
            });
            that.trigger(this.id+".remove", itemsToBeRemoved);
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
                that.trigger(this.id+".updateTheme",options.theme);
                that.trigger("updateTheme",options.theme);
            }
            if(options.spec && that.class.SUPPORTED_SPECS.indexOf(options.spec) !== -1){
                that.trigger(this.id+".updateSpec",options.spec);
                that.trigger("updateSpec",options.spec);
            }
            if(that.class.SUPPORTED_CHECK_VALUES.indexOf(options.check+"") !== -1){
                that.trigger(this.id+".updateCheck", options.check);
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
            this.trigger(this.id+".select", this.selects, bselects);
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
            that.trigger(this.id+".select",that.selects,bselects);
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
        },
		off: function(name){
			if(name === "*") return false;
			if(typeof name === "string"){
				var splited = name.split(".");
				if(splited[1] === "ui"){
					return false;
				}
			}
			var _super = this.__proto__.__proto__;
			return _super.off.apply(this, arguments);
		}
    })
    ;
})();
"use strict";
(function($){
    var model = FClass.namespace("com.vgerbot.ui.explorer.model");
    var utils = FClass.namespace("com.vgerbot.utils");

    var EXPLORER_DATA_NAME = "explorer";
    var EXPLORER_ITEM_DATA_NAME = "explorer-item-data";

    var destroy = function(explorer, $elm){
        explorer.off(explorer.id);
        $elm.removeData(EXPLORER_DATA_NAME);
        $elm.find(".explorer").remove();
        $(document).off("keydown." + explorer.id).off("keyup." + explorer.id);
    };
    var itemTemplate = function(){
        return [
            "<ul class='explorer-item-details' title='${cfg.name}'>",
                "<li class='item-check'><input type='checkbox'></li>",
                "<li class='item-icon ${cfg.icon}'></li>",
                "<li class='item-name'>${cfg.name}</li>",
            "</ul>"
        ].join("");
    };
    var parseTemplate = function(item, template){
        var opath = utils.of("OPath").create(item.data, ".");
        return template.replace(/\$\{([^\}]+)\}/g,function(r, path){
            // return new Function("cfg","item","return "+path+";")(item.data.cfg);
            return opath.get(path);
        });
    };
    var createExplorer = function(options, element){
        var $elm = $("<div>");
        var $list = $("<ul>");

        $elm.addClass("explorer")
            .addClass("explorer-"+options.theme)
            .addClass("explorer-"+options.spec);
        if(options.check+"" === "false" || options.check+"" === "hide"){
            $elm.addClass("hide-check");
        }
        $list.addClass("explorer-item-list");
        $elm.append($list);

        var explorer = model.of("Explorer").create();

        explorer.on(explorer.id+".remove", function(e, items){
            var ids = [];
			items.forEach(function(item){
				ids.push(item.id);
			});
            $(selectElementsByIds(ids)).remove();
        });
        var selectElementsByIds = function(ids){
			var elements = [];
			ids.forEach(function(id){
				var element = document.getElementById(id);
				if(element !== undefined){
					elements.push(element);
				}
			});
			return elements;
		};
        explorer.on(explorer.id+".select", function(e, selects,lastSelects){
            var newSelects = this.class.relc(lastSelects, selects),
                unselects = this.class.relc(selects, lastSelects);

            if(unselects.length > 0){
                var items = selectElementsByIds(unselects);
                $(items)
                .removeClass("active")
                .each(function(index, item){
                    $(item).find(".item-check>input[type=checkbox]")
                    .removeAttr("checked").removeProp("checked");
                });
            }

            if(newSelects.length > 0){
                /*
                var qSelector = "#" + newSelects.join(",#");
                $list.find(qSelector)
                .addClass("active")
                .find(".item-check>input[type=checkbox]")
                .attr("checked","checked").prop("checked","checked");
                */
                var items = selectElementsByIds(newSelects);
                $(items).addClass("active")
                .each(function(index, item){
                    $(item).find(".item-check>input[type=checkbox]")
                    .attr("checked","checked").prop("checked","checked");
                })
                ;
            }
        });
        explorer.on(explorer.id+".create", function(e,item){
            var $item = $("<li>");
            $item.attr({
                id:item.id
            }).addClass("explorer-item");
            var template ;
            switch(typeof options.template){
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
            $item.data(EXPLORER_ITEM_DATA_NAME, item);
            $list.append($item);
        });
        explorer.on(explorer.id+".updateTheme", function(e, theme){
            $elm
            .removeClass("explorer-grid")
            .removeClass("explorer-list")
            .addClass("explorer-"+theme)
            ;
            options.theme = theme;
        });
        explorer.on(explorer.id+".updateSpec", function(e, spec){
            var supportedSpecs = ["xs","sm","md","lg"];
            supportedSpecs.forEach(function(spec){
                $elm.removeClass("explorer-"+spec);
            });
            $elm.addClass("explorer-"+spec);
            options.spec = spec;
        });
        // explorer.update({check:true})
        explorer.on(explorer.id+".updateCheck", function(e, check){
            switch(check + ""){
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
        $elm.on("click", function(e){
            var $target = $(e.target);
            if($elm.prop("dragged")){
                $elm.removeProp("dragged");
                return;
            }
            if( ( $target.is($elm) || $target.is($list) ) && !e.ctrlKey && !e.shiftKey){
                explorer.unselectAll();
            }
        });
        $elm.on("click",".explorer-item",function(e){
            var $item = $(e.currentTarget);
            var item = $item.data(EXPLORER_ITEM_DATA_NAME);
            var index = $item.index();
            if(e.shiftKey){
                var $items = $elm.find(".explorer-item");
                var firstIndex = explorer.shiftSelectIndex;
                if(firstIndex === undefined){
                    if(explorer.selects.length > 0){
                        firstIndex = $elm.find("#"+explorer.selects[explorer.selects.length-1]).index();
                    }else{
                        firstIndex = 0;
                    }
                    explorer.shiftSelectIndex = firstIndex;
                }
                var ids = [];
                var minIndex = Math.min(firstIndex, index),
                    maxIndex = Math.max(firstIndex, index);
                $items.slice(minIndex, maxIndex+1).each(function(index, itemElement){
                    ids.push($(itemElement).data(EXPLORER_ITEM_DATA_NAME).id);
                });
                var unselects = explorer.selects.filter(function(id){
                    var itemIndex = $("#"+id).index();
                    return itemIndex < minIndex || itemIndex > maxIndex;
                });
                explorer.unselect.apply(explorer, unselects);
                explorer.select.apply(explorer, ids);
            }else if(e.ctrlKey){
                if(item.selected){
                    explorer.unselect(item.id);
                }else{
                    explorer.select(item.id);
                    explorer.shiftSelectIndex = index;
                }
            }else{
                if(item.selected && explorer.selects.length < 2){
                    explorer.unselectAll();
                }else{
                    explorer.unselectAll();
                    explorer.select(item.id);
                    explorer.shiftSelectIndex = index;
                }
            }
            e.stopPropagation();
        });
        $elm.on("dblclick", ".item-name", function(e){
            var $itemName = $(e.currentTarget);
            var item = $itemName.closest(".explorer-item")
                        .data(EXPLORER_ITEM_DATA_NAME);
            $itemName.attr("contenteditable","").text(item.data.cfg.name).focus();
        });
        $elm.on("mousedown", ".item-name[contenteditable]",function(e){
            e.stopPropagation();
        });
        $elm.on("keyup", ".item-name", function(e){
            var $itemName = $(e.currentTarget);
            if(e.ctrlKey){
                $itemName.removeAttr("contenteditable");
                var item = $itemName.closest(".explorer-item")
                            .data(EXPLORER_ITEM_DATA_NAME);
                item.data.cfg.name = $itemName.text().trim();
                $itemName.closest(".explorer-item-details")
                .attr("title",$itemName.text().trim());
                explorer.trigger("submit",item, "name");
                e.preventDefault();
                e.stopPropagation();
            }
        });
        $elm.on("focusout", ".item-name", function(e){
            var $itemName = $(e.currentTarget);
            if($itemName.attr("contenteditable") === undefined){
                return;
            }
            $itemName.removeAttr("contenteditable");
            var item = $itemName
                        .closest(".explorer-item")
                        .data(EXPLORER_ITEM_DATA_NAME);
            $itemName.text(item.data.cfg.name);
        });
        var shiftKeyDown = false, ctrlKeyDown = false;
        $(document).on("keydown."+explorer.id, function(e){
            shiftKeyDown = e.shiftKey;
            ctrlKeyDown = e.ctrlKey;
            if(e.keyCode === 65 && e.ctrlKey){ // ctrl + A 选择所有
                explorer.selectAll();
				e.stopPropagation();
				e.preventDefault();
            }
        });
        $(document).on("keyup."+explorer.id, function(e){
            if(e.keyCode === 17){
                ctrlKeyDown = false;
            }
            if(e.keyCode === 16){
                shiftKeyDown = false;
            }
        });
        $elm.on("dragSelect", function(e, box){
            // 如果鼠标移动距离很小，则不触发事件 => 用户体验问题
            // 不做这个校验，在按下Ctrl键点击鼠标多选时，鼠标抖一下容易取消选择
            if(box.width < 20 && box.height < 20){
                return;
            }
            var boxBottom = box.top + box.height;
            $elm.prop("dragged", true);
            function collision(boxa,boxb){
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
            var selects = [];
            var unselects = [];
            var eofs = $elm.offset();
            var $items = $elm.find(".explorer-item");
            var itemHeight = $items.height();
            var itemWidth = $items.width();
            $items.each(function(index, itemElement){
                var $itemElm = $(itemElement);
                var item = $itemElm.data(EXPLORER_ITEM_DATA_NAME);
                var iofs = $itemElm.offset();

                var itemTop = iofs.top - eofs.top;
                if(itemTop > boxBottom){
                    if(!shiftKeyDown && !ctrlKeyDown){
                        unselects.push.apply(unselects, explorer.itemIds.slice(index));
                    }
                    return false;
                }
                var itemBottom = itemTop + itemHeight;
                if(itemBottom < box.top){
                    if(!shiftKeyDown && !ctrlKeyDown){
                        if(item.selected){
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
                if(collision(box, itemBox)){
                    if(!item.selected){
                        selects.push(item.id);
                    }
                }else if(!shiftKeyDown && !ctrlKeyDown){
                    if(item.selected){
                        unselects.push(item.id);
                    }
                }
            });
            explorer.unselect.apply(explorer, unselects);
            explorer.select.apply(explorer, selects);
        });
        $elm.dragSelector();
        element.empty().append($elm);
        if(options.data instanceof Array){
            explorer.update({
                data:options.data
            });
        }
        return explorer;
    };
    $.fn.explorer = function(options){
        if(options === undefined || options === null){
            return;
        }
        if(options === false){
            return this.each(function(index, element){
                var $elm = $(element);
                var explorer = $elm.data(EXPLORER_DATA_NAME);
                if(explorer instanceof model.of("Explorer")){
                    destroy(explorer, $elm);
                }
            });
        }
        options = $.extend({
            theme   :   "grid",// list,grid
            spec    :   "md",// xs, sm, md, lg, xlg
            template:   itemTemplate,
            data    :   [],
            check   :   "hide"
        },options);
        return this.each(function(index, element){
            var $elm = $(element);
            var explorer = $elm.data(EXPLORER_DATA_NAME);
            if(explorer instanceof model.of("Explorer")){
                return;
            }
            explorer = createExplorer(options, $elm);
            $elm.data(EXPLORER_DATA_NAME, explorer);
        });
    };
    $.fn.dragSelector = function(){
        return this.each(function(index, element){
            var $elm = $(element);
            var $sel = $("<div>");
            $sel.addClass("drag-selector");
            $sel.appendTo($elm);
            function mousePosition(e){
                var $cur = $(e.target);
                var mx,my;
                if($cur.is($elm)){
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
            var selector = function(sx, sy){
                return function selector(e){
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
            };
            var eventId = "mousemove."+ Math.random();
            $elm.on("mousedown", function(e){
                if(e.button !== 0){
                    return;
                }
                $sel.css({
                    width:0,
                    height:0
                });
                var mp = mousePosition(e);
                $elm.on(eventId, selector(mp.left, mp.top));
            });
            $(document).on("mouseup", function(e){
                if(e.button !== 0){
                    return;
                }
                $sel.removeClass("show");
                $elm.off(eventId);
            });
        });
    };
})(jQuery);