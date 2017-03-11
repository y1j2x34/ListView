define(["Class"], function(Class){
    "use strict";

    return Class.create({
        name: "ListViewItemModel",
        init: function(self, id, data){
            self.id = id;
            self.select(false);
            self.data = data;
        },
        select:function(self, selected){
            self.selected = selected;
        }
    });
});