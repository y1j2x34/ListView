require.config({
    "baseUrl": "/src/script",
    "paths": {
        "jquery": "/vendors/jquery/jquery.min",
        "Class": "supports/Class",
        "Subject": "supports/Subject"
    }
});
require(["listview.plugin"]);