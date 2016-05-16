"use strict";
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
