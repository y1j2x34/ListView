"use strict";
require.config({
    "baseUrl": "../",
    "paths": {
        "jquery": "/vendors/jquery/jquery.min",
        "bootstrap": "/vendors/bootstrap/dist/js/bootstrap.min",
        "listview": "../dist/listview.min"
    },
    shim: {
        "bootstrap":{
            deps: ["jquery"]
        }
    },
    bundles:{
        "listview": ["listview.plugin"]
    }
});
require([
    "jquery",
    "listview.plugin",
    "bootstrap"
], function($){
    $("#listview").listview({
        theme:"list",
        data:[{
            cfg:{
                icon:"icon-text-file",
                name:"文本文档",
                time:"2016-05-15"
            }
        },{
            cfg:{
                icon:"icon-image-file",
                name:"图像文件",
                time:"2016-05-15"
            }
        },{
            cfg:{
                icon:"icon-music-file",
                name:"音乐文件",
                time:"2016-05-16"
            }
        }],
        template:function(){
            return ["<ul class='listview-item-details' title='名称：${cfg.name}\n修改日期：${cfg.time}'>",
                        "<li class='item-check'><input type='checkbox'></li>",
                        "<li class='item-icon ${cfg.icon}'></li>",
                        "<li class='item-name'>${cfg.name}</li>",
                        "<li class='item-time'><span class='time-desc'>修改日期：</span>${cfg.time}</li>",
                    "</ul>"].join("");
        }
    });
    $("input[name=theme]").change(function(){
        $("#listview").data("listview").update({
            theme:$(this).val()
        });
    });
});