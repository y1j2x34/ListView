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
    "listview.plugin"
], function($) {
    var items = [{
        cfg: {
            icon: "icon-text-file",
            name: "文本文档",
            time: "2016-05-15"
        }
    }, {
        cfg: {
            icon: "icon-image-file",
            name: "图像文件",
            time: "2016-05-15"
        }
    }, {
        cfg: {
            icon: "icon-music-file",
            name: "音乐文件",
            time: "2016-05-16"
        }
    }];

    function create() {
        var data = [];
        window.listviewElement = $("#listview").listview({
            theme: "grid",
            data: data
        });
        var listview = window.listviewElement.data("listview");
        var times = 100;
        setInterval(function(){
            if(times <= 0){
                return;
            }
            for(var i = 0;i< 10; i++){
                data.push(items[parseInt(Math.random() * items.length)]);
            }
            listview.update({
                data: data
            });
            times -- ;
        }, 100);
    }

    function destroy() {
        window.listviewElement.listview(false);
        window.listviewElement = undefined;
    }
    create();
    $("#create-listview-btn").click(function() {
        if (!window.listviewElement) {
            create();
        }
    });
    $("#destroy-listview-btn").click(function() {
        if (window.listviewElement) {
            destroy();
        }
    });
});