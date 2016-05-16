"use strict";
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
                this.observers = {};
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
