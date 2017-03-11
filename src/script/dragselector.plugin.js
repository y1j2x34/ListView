define([
    "jquery"
], function($){
    "use strict";

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
                if(e.target === element){
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
            function selectorEventHandlerFactory(sx, sy){
                return function(e){
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
            }
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
                $elm.on(mouseMoveEvent, selectorEventHandlerFactory(mp.left, mp.top));
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

    return $.fn.dragSelector;
});