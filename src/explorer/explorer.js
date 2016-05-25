"use strict";
(function($){
    var model = FClass.namespace("com.vgerbot.ui.explorer.model");
    var utils = FClass.namespace("com.vgerbot.utils");

    var EXPLORER_DATA_NAME = "explorer";
    var EXPLORER_ITEM_DATA_NAME = "explorer-item-data";

    var destroy = function(explorer, $elm){
        explorer.off(explorer.id);
        $elm.removeData(EXPLORER_DATA_NAME);
        $elm.dragSelector(false);
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
                explorer.update(options);
                return;
            }
            explorer = createExplorer(options, $elm);
            $elm.data(EXPLORER_DATA_NAME, explorer);
        });
    };
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
                $elm.on(mouseMoveEvent, selector(mp.left, mp.top));
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
})(jQuery);
