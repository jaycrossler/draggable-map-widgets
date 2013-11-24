var app={};
app.background_map=null;
app.init=function(){
    app.addBackgroundMap();
    app.addWidgets();
    plusplus.init();
};

app.addBackgroundMap=function(){
    OpenLayers.ImgPath = "js/OpenLayers/img/";
    background_map = new OpenLayers.Map({
        div: "background_map",
        layers: [
            new OpenLayers.Layer.OSM("OSM (without buffer)"),
            new OpenLayers.Layer.OSM("OSM (with buffer)", null, {buffer: 2})
        ],
        controls: [
        ],
        center: [0, 0],
        zoom: 3
    });

    background_map.addControl(new OpenLayers.Control.LayerSwitcher());
};
app.addWidgets=function(){
    var $holder = $("#widget_holder");

    var widget_list = [
        {name:"First Floor",content:app.buildMap, parameters:{map_num:1}},
        {name:"Second Floor",content:app.buildMap, parameters:{map_num:2}},
        {name:"Third Floor",content:app.buildMap, parameters:{map_num:3}},
        {name:"Upcoming Events",content:app.buildCalendar}
    ];
    $.each(widget_list,function(i,widget){
        //TODO: If cookie of position, extend that
        $holder.append(app.addWidget(widget));
    });

};
app.addWidget=function(options){

    var $widget_wrapper = $('<div class="span6 plus-collapsible plus-draggable">');
    var $titlebar = $('<div class="navbar">').appendTo($widget_wrapper);
    var $titlebar_in = $('<div class="navbar-inner">').appendTo($titlebar);
    $('<a class="brand" href="#">')
        .text(options.name||"Widget")
        .on('click',options.nameClickFunction||function(){})
        .appendTo($titlebar_in);
    if (!options.preventCollapse) {
        $('<a class="btn pull-right icon_collapse" href="#"><i class="icon-chevron-up"></i></a>')
            .appendTo($titlebar_in);
    }
    if (!options.preventMove) {
        $('<a class="btn pull-right icon_drag" href="#"><i class="icon-fullscreen"></i></a>')
            .appendTo($titlebar_in);
    }

    var $content = $('<p class="well">').appendTo($widget_wrapper);
    var content_type = typeof options.content;

    var $content_result;
    if (content_type=="function"){
        $content_result = options.content(options);
    } else {
        $content_result = options.content;
    }

    content_type = typeof $content_result;
    if (content_type=="string"){
        $content.html($content_result);
    } else if (content_type=="object" && $content_result.appendTo){
        $content_result.appendTo($content);
    } else {
        $content.html("Unrecognized content");
    }

    return $widget_wrapper;

};
app.buildMap=function(options){
    var parameters = options.parameters || {};
    return $('<div>').html("<h1>"+parameters.map_num+"</h1>");
};
app.buildCalendar=function(options){
    return $('<div>').html("<h1>Calendar</h1>");
};
