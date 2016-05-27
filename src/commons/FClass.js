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
            if(prop in dest){
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
        constructor :   new ConstConfigure(Sup),
        isInstance  :   new ConstConfigure(function(obj){
                            return obj instanceof this;
                        }),
        is          :   new ConstConfigure(function(type){
            return this === type || this === classes[type];
        }),
        isSupTypeOf :   new ConstConfigure(function(type){
            if(typeof type === "string"){
                type = classes[type];
            }
            while(type !== null && type !== Sup){
                type = type.superclass;
                if(type === this){
                    return true;
                }
            }
            return false;
        }),
        isSubTypeOf :  new ConstConfigure(function(type){
            if(typeof type === "string"){
                type = classes[type];
            }
            if(!type || type === this || typeof type.isSupTypeOf === "undefined"){
                return false;
            }
            return type.isSupTypeOf(this);
        })
    });
    Object.defineProperties(Sup.prototype, {
        superclass  :   new ConstConfigure(Sup),
        "const"       :   new ConstConfigure(function(name, value){
                            Object.defineProperty(this, name, new ConstConfigure(value));
                        }),
        callSuper   :   new ConstConfigure(function(){
                            var step = this.__step__;
                            if(step === undefined){
                                step = this.class;
                            }else{
                                step = step.superclass;
                            }
                            Object.defineProperty(this, "__step__",{
                                value:step,
                                enumerable:false,
                                writeable:false,
                                configurable:true
                            });
                            step.superclass.constructor.apply(this,arguments);
                            if(step.superclass === Sup){
                                delete this.__step__;
                            }
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
    var Namespace = _create("Namespace",{
        init:function(ns){
            this.const("name", !ns?"":ns + ".");
        },
        of:function(name){
            return classes[this.name + name];
        },
        create : function(){
            var clazz =  _create.apply(null,arguments);
            if(!!this.name){
                classes[this.name + clazz.name] = clazz;
            }else{
                classes[clazz.name] = clazz;
            }
            return this;
        },
        classes : function(){
            var cloned = {};
            for(var name in classes){
                if(name.indexOf(this.name) === 0){
                    cloned[name] = classes[name];
                }
            }
            return cloned;
        }
    });

    var FClass = Namespace.create("");
    FClass.run = function(namespaces,func,caller){
        if(typeof namespaces === "function"){
            func = namespaces;
            namespaces = [];
        }
        if(!(namespaces instanceof Array && (typeof func === "function"))){
            throw new Error("illegal arguments");
        }
        namespaces.push("");
        var namespaceArray = [];
        namespaces.forEach(function(ns){
            if(!(ns instanceof Namespace)){
                ns = Namespace.create(ns);
            }
            namespaceArray.push(ns);
        });
        var funcStr = func.toString();
        var ilb = funcStr.indexOf('(');
        var irb = funcStr.indexOf(')',ilb);
        var argStr = funcStr.substring(ilb+1, irb);
        var argNames = argStr.split(/\s*,\s*/);
        var args = [];
        argNames.forEach(function(name){
            for(var i=0;i<namespaceArray.length;i++){
                var ns = namespaceArray[i];
                var cls = ns.of(name);
                if(cls !== undefined){
                    args.push(cls);
                    return;
                }
            }
            throw new Error("class not found : "+name);
        });
        return func.apply(caller, args);
    };
    FClass.namespace = function(ns){
        return Namespace.create(ns);
    };
    window.FClass = FClass;
})();
