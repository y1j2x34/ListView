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
    var items = [{
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
    }];

    function create(){
        var data = [];
        for(var i=0;i< Math.random()*200;i++){
            data.push(items[parseInt(Math.random()*items.length)]);
        }

        window.listviewElement = $("#listview").listview({
            theme:$("input[name=theme]:checked").val(),
            spec:$("input[name=size]:checked").val(),
            data:data
        });
    }
    function destroy(){
        window.listviewElement.listview(false);
        window.listviewElement = undefined;
    }
    create();
    $("#create-listview-btn").click(function(){
        if(!window.listviewElement){
            create();
        }
    });
    $("#destroy-listview-btn").click(function(){
        if(window.listviewElement){
            destroy();
        }
    });
    $("input[name=size]").on("change",function(){
        if(window.listviewElement){
            var listview = window.listviewElement.data("listview");
            if(listview){
                listview.update({
                    spec:$(this).val()
                });
            }
        }
    });
    $("input[name=theme]").on("change",function(){
        if(window.listviewElement){
            var listview = window.listviewElement.data("listview");
            if(listview){
                listview.update({
                    theme:$(this).val()
                });
            }
        }
    });
});