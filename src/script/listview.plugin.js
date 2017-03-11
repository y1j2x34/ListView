define([
    "jquery",
    "./supports/opath",
    "./listview.model",
    "./dragselector.plugin"
], function($, ObjectPath, ListViewModel) {
    "use strict";
    var LISTVIEW_DATA_NAME = "listview";
    var LISTVIEW_ITEM_DATA_NAME = "listview-item-data";
    var DEFAULT_OPTIONS = {
        theme: "grid", // list,grid
        spec: "md", // xs, sm, md, lg, xlg
        template: itemTemplate,
        data: [],
        check: "hide"
    };
    var $document = $(document);

    $.fn.listview = function(options) {
        if (options === undefined || options === null) {
            return;
        }
        if (options === false) {
            return this.each(function(index, element) {
                var $elm = $(element);
                var listview = $elm.data(LISTVIEW_DATA_NAME);
                if (listview instanceof ListViewModel) {
                    destroy(listview, $elm);
                }
            });
        }
        options = $.extend({}, DEFAULT_OPTIONS, options);

        return this.each(function(index, element) {
            var $elm = $(element);
            var listview = $elm.data(LISTVIEW_DATA_NAME);
            if (listview instanceof ListViewModel) {
                listview.update(options);
                return;
            }
            listview = createListView(options, $elm);
            $elm.data(LISTVIEW_DATA_NAME, listview);
        });
    };

    function createListView(options, element) {
        var $elm = $("<div>");
        var $list = $("<ul>");
        $elm.addClass("listview")
            .addClass("listview-" + options.theme)
            .addClass("listview-" + options.spec);
        if (options.check + "" === "false" || options.check + "" === "hide") {
            $elm.addClass("hide-check");
        }
        $list.addClass("listview-item-list");
        $elm.append($list);

        var listview = new ListViewModel();

        listview.on(listview.id + ".remove", function(e, items) {
            var ids = [];
            items.forEach(function(item) {
                ids.push(item.id);
            });
            $(selectElementsByIds(ids)).remove();
        });
        listview.on(listview.id + ".select", function(e, selects, lastSelects) {
            var newSelects = ListViewModel.relc(lastSelects, selects),
                unselects = ListViewModel.relc(selects, lastSelects),
                items;

            if (unselects.length > 0) {
                items = selectElementsByIds(unselects);
                $(items)
                    .removeClass("active")
                    .each(function(index, item) {
                        $(item).find(".item-check>input[type=checkbox]")
                            .removeAttr("checked").removeProp("checked");
                    });
            }

            if (newSelects.length > 0) {
                items = selectElementsByIds(newSelects);
                $(items).addClass("active")
                    .each(function(index, item) {
                        $(item).find(".item-check>input[type=checkbox]")
                            .attr("checked", "checked").prop("checked", "checked");
                    });
            }
        });
        listview.on(listview.id + ".create", function(e, item) {
            var $item = $("<li>");
            $item.attr({
                id: item.id
            }).addClass("listview-item");
            var template;
            switch (typeof options.template) {
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
            $item.data(LISTVIEW_ITEM_DATA_NAME, item);
            $list.append($item);
        });
        listview.on(listview.id + ".updateTheme", function(e, theme) {
            $elm
                .removeClass("listview-grid")
                .removeClass("listview-list")
                .addClass("listview-" + theme);
            options.theme = theme;
        });
        listview.on(listview.id + ".updateSpec", function(e, spec) {
            var supportedSpecs = ["xs", "sm", "md", "lg"];
            supportedSpecs.forEach(function(spec) {
                $elm.removeClass("listview-" + spec);
            });
            $elm.addClass("listview-" + spec);
            options.spec = spec;
        });
        listview.on(listview.id + ".updateCheck", function(e, check) {
            switch (check + "") {
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
        $elm.on("click", function(e) {
            var $target = $(e.target);
            if ($elm.prop("dragged")) {
                $elm.removeProp("dragged");
                return;
            }
            if (($target.is($elm) || $target.is($list)) && !e.ctrlKey && !e.shiftKey) {
                listview.unselectAll();
            }
        });
        $elm.on("click", ".listview-item", function(e) {
            var $item = $(e.currentTarget);
            var item = $item.data(LISTVIEW_ITEM_DATA_NAME);
            var index = $item.index();
            if (e.shiftKey) {
                var $items = $elm.find(".listview-item");
                var firstIndex = listview.shiftSelectIndex;
                if (firstIndex === undefined) {
                    if (listview.selects.length > 0) {
                        firstIndex = $elm.find("#" + listview.selects[listview.selects.length - 1]).index();
                    } else {
                        firstIndex = 0;
                    }
                    listview.shiftSelectIndex = firstIndex;
                }
                var ids = [];
                var minIndex = Math.min(firstIndex, index),
                    maxIndex = Math.max(firstIndex, index);
                $items.slice(minIndex, maxIndex + 1).each(function(index, itemElement) {
                    ids.push($(itemElement).data(LISTVIEW_ITEM_DATA_NAME).id);
                });
                var unselects = listview.selects.filter(function(id) {
                    var itemIndex = $("#" + id).index();
                    return itemIndex < minIndex || itemIndex > maxIndex;
                });
                listview.unselect.apply(listview, unselects);
                listview.select.apply(listview, ids);
            } else if (e.ctrlKey) {
                if (item.selected) {
                    listview.unselect(item.id);
                } else {
                    listview.select(item.id);
                    listview.shiftSelectIndex = index;
                }
            } else {
                if (item.selected && listview.selects.length < 2) {
                    listview.unselectAll();
                } else {
                    listview.unselectAll();
                    listview.select(item.id);
                    listview.shiftSelectIndex = index;
                }
            }
            e.stopPropagation();
        });
        $elm.on("dblclick", ".item-name", function(e) {
            var $itemName = $(e.currentTarget);
            var item = $itemName.closest(".listview-item")
                .data(LISTVIEW_ITEM_DATA_NAME);
            $itemName.attr("contenteditable", "").text(item.data.cfg.name).focus();
        });
        $elm.on("mousedown", ".item-name[contenteditable]", function(e) {
            e.stopPropagation();
        });
        $elm.on("keyup", ".item-name", function(e) {
            var $itemName = $(e.currentTarget);
            if (e.ctrlKey) {
                $itemName.removeAttr("contenteditable");
                var item = $itemName.closest(".listview-item")
                    .data(LISTVIEW_ITEM_DATA_NAME);
                item.data.cfg.name = $itemName.text().trim();
                $itemName.closest(".listview-item-details")
                    .attr("title", $itemName.text().trim());
                listview.trigger("submit", item, "name");
                e.preventDefault();
                e.stopPropagation();
            }
        });
        $elm.on("focusout", ".item-name", function(e) {
            var $itemName = $(e.currentTarget);
            if ($itemName.attr("contenteditable") === undefined) {
                return;
            }
            $itemName.removeAttr("contenteditable");
            var item = $itemName
                .closest(".listview-item")
                .data(LISTVIEW_ITEM_DATA_NAME);
            $itemName.text(item.data.cfg.name);
        });
        var shiftKeyDown = false,
            ctrlKeyDown = false;
        $document.on("keydown." + listview.id, function(e) {
            shiftKeyDown = e.shiftKey;
            ctrlKeyDown = e.ctrlKey;
            if (e.keyCode === 65 && e.ctrlKey) { // ctrl + A 选择所有
                listview.selectAll();
                e.stopPropagation();
                e.preventDefault();
            }
        });
        $document.on("keyup." + listview.id, function(e) {
            if (e.keyCode === 17) {
                ctrlKeyDown = false;
            }
            if (e.keyCode === 16) {
                shiftKeyDown = false;
            }
        });
        $elm.on("dragSelect", function(e, box) {
            // 在按下Ctrl键点击鼠标多选时，鼠标抖一下容易取消选择。
            if (ctrlKeyDown && box.width < 20 && box.height < 20) {
                return;
            }
            var boxBottom = box.top + box.height;
            $elm.prop("dragged", true);

            var selects = [];
            var unselects = [];
            var eofs = $elm.offset();
            // var eofs = $elm[0].getBoundingClientRect();
            var $items = $elm.find(".listview-item");
            var itemHeight = $items.height();
            var itemWidth = $items.width();
            $items.each(function(index, itemElement) {
                var $itemElm = $(itemElement);
                var item = $itemElm.data(LISTVIEW_ITEM_DATA_NAME);
                var iofs = $itemElm.offset();

                var itemTop = iofs.top - eofs.top;
                if (itemTop > boxBottom) {
                    if (!shiftKeyDown && !ctrlKeyDown) {
                        unselects.push.apply(unselects, listview.itemIds.slice(index));
                    }
                    return false;
                }
                var itemBottom = itemTop + itemHeight;
                if (itemBottom < box.top) {
                    if (!shiftKeyDown && !ctrlKeyDown) {
                        if (item.selected) {
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
                if (collision(box, itemBox)) {
                    if (!item.selected) {
                        selects.push(item.id);
                    }
                } else if (!shiftKeyDown && !ctrlKeyDown) {
                    if (item.selected) {
                        unselects.push(item.id);
                    }
                }
            });
            listview.unselect.apply(listview, unselects);
            listview.select.apply(listview, selects);
        });

        $elm.dragSelector();

        element.empty().append($elm);

        if (options.data instanceof Array) {
            listview.update({
                data: options.data
            });
        }
        return listview;
    }

    function selectElementsByIds(ids) {
        var elements = [];
        ids.forEach(function(id) {
            var element = document.getElementById(id);
            if (element !== undefined) {
                elements.push(element);
            }
        });
        return elements;
    }

    function destroy(listview, $elm) {
        listview.off(listview.id);
        $elm.removeData(LISTVIEW_DATA_NAME);
        $elm.dragSelector(false);
        $elm.find(".listview").remove();
        $document.off("keydown." + listview.id).off("keyup." + listview.id);
    }

    function collision(boxa, boxb) {
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

    function itemTemplate() {
        return [
            "<ul class='listview-item-details' title='${cfg.name}'>",
            "<li class='item-check'><input type='checkbox'></li>",
            "<li class='item-icon ${cfg.icon}'></li>",
            "<li class='item-name'>${cfg.name}</li>",
            "</ul>"
        ].join("");
    }

    function parseTemplate(item, template) {
        var opath = new ObjectPath(item.data, ".");
        return template.replace(/\$\{([^\}]+)\}/g, function(r, path) {
            // return new Function("cfg","item","return "+path+";")(item.data.cfg);
            return opath.get(path);
        });
    }
});