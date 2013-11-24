var app={};
app.background_map=null;
app.mapManager=[];

app.init=function(){
    app.addBackgroundMap();
    app.addWidgets();
    plusplus.init();
    app.restoreConfigFromCookie();

    $(window).bind('beforeunload',app.setCookie);
    setInterval(app.setCookie,10000); //Auto-save config every 10 seconds

    //TODO: Have a function that auto-builds menubars
    //TODO: Add function for adding map widgets and other type of widgets
    //TODO: Add ability to change opacity of widgets
    //TODO: Handle multiple layers per map widget
    //TODO: Build into a Django app
    //TODO: Make menu titlebars smaller
    //TODO: Have only admins able to move widgets around
    //TODO: Have WFS controls to add features to map layer
    //TODO: Have WFS controls to toggle shapes (damaged/occupied/clear/whatever)
    //TODO: Have a polling service to check if settings/cookies have changed from master and load them


};

app.addBackgroundMap=function(){
    OpenLayers.ImgPath = "js/OpenLayers/img/";
    background_map = new OpenLayers.Map({
        div: "background_map",
        layers: [
            new OpenLayers.Layer.WMS("Landsat7",
                "http://geoint.nrlssc.navy.mil/nrltileserver/wms",
                {layers: "NAIP,OSM_BASEMAP_OVERLAY"})

        ],
        controls: [
        ],
        center: [-77.042466107994,38.892564036371],
        zoom: 15
    });

    background_map.addControl(new OpenLayers.Control.LayerSwitcher());
};
app.addWidgets=function(){
    var $holder = $("#widget_holder");

    var widget_list = [
        {name:"First Floor",content:app.buildMap, parameters:{map_num:1}}, //TODO: Pull from DB and extend with more settings
        {name:"Second Floor",content:app.buildMap, parameters:{map_num:2}},
        {name:"Third Floor",content:app.buildMap, parameters:{map_num:3}},
        {name:"Upcoming Events",content:app.buildCalendar}
    ];
    $.each(widget_list,function(i,widget){
        app.addWidget(widget,$holder);
    });

};
app.addWidget=function(options,$holder){

    var $widget_wrapper = $('<div class="span6 plus-collapsible plus-draggable">')
        .appendTo($holder);
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
    var id = options.id || options.name.replace(/[ -0-9]/g,"");
    var height = options.height || 200;
    var width = $content.parent().css('width')-20;
    $content
        .attr('id',id)
        .css({height:height, width:width})
        .resizable({
            resize: function( event, ui ) {
                $titlebar.css({width:ui.size.width+20});
            }
        });
    //TODO: On drag, make z-index the highest

    options.id = id;
    var content_type = typeof options.content;

    if (content_type=="function"){
        options.content(options,$content);
    } else if (content_type=="object" && options.content.appendTo){
        options.content.appendTo($content);
    } else if (content_type=="string"){
        $content.html(options.content);
    } else {
        $content.html("Unrecognized content");
    }

    options.$content = $content;
    options.$titlebar = $titlebar;
    options.$holder = $widget_wrapper;
    $widget_wrapper.data('widget',options);

    return $widget_wrapper;

};
app.buildMap=function(options,$content){
//    var parameters = options.parameters || {};
    var id = $content.attr('id');

    var newmap = new OpenLayers.Map({
        div: id,
        layers: [
            new OpenLayers.Layer.WMS("Landsat7",
                "http://geoint.nrlssc.navy.mil/nrltileserver/wms",
                {layers: "NAIP"})
        ],
        controls: [
            new OpenLayers.Control.Navigation(),
            new OpenLayers.Control.Zoom()
        ],
        center: [-77.042466107994,38.892564036371],
        numZoomLevels: 20,
        zoom: 17
    });

    var mapInfo={widget:options, div_id:id, map:newmap};
    app.mapManager.push(mapInfo);

};
app.buildCalendar=function(options,$content){
    var id = $content.attr('id');

    var mapInfo={widget:options, div_id:id};
    app.mapManager.push(mapInfo);

    return $('<div>').html("<h1>Calendar</h1>");
};
app.getWidget=function(name){
    if (typeof name=="number" && app.mapManager.length>name){
        return app.mapManager[name];
    }  else {
        for (var i=0;i<app.mapManager.length;i++){
            var map =app.mapManager[i];
            if (map.div_id==name || map.div==name || map.widget.name.toLowerCase()==name.toLowerCase()){
                return map;
            }
        }
    }
    return false;
};
app.getConfig=function(notAsJSON){
    var config={widgets:[]};
    $('.plus-draggable').each(function(i,widget_holder){
        var data = $(widget_holder).data('widget');
        var $content = data.$content;

        var name = data.name;
        var width = parseInt($content.css('width'));
        var height = parseInt($content.css('height'));
        var top = parseInt($(widget_holder).position().top);
        var left = parseInt($(widget_holder).position().left);
        var minimized = $content.css('display');
        var widget_info = {name:name, width:width, height:height, top:top, left:left, minimized:minimized};

        var widget = app.getWidget(name);
        if (widget && widget.map && widget.map.getExtent) {
            widget_info.extents = widget.map.getExtent();
            widget_info.zoom = widget.map.getZoom();
        }

        config.widgets.push(widget_info);
    });
    return notAsJSON ? config : JSON.stringify(config);
};
app.setCookie=function(){
    var config = app.getConfig();
    $.cookie('widget_config',config);
};
app.getCookie=function(){
    var cookie = $.cookie('widget_config') || '{"status":"empty"}';
    return JSON.parse(cookie);
};
app.restoreConfigFromCookie=function(){
    var cookie = app.getCookie();
    if (cookie && cookie.widgets){
        $.each(cookie.widgets,function(i,widget_info){

            var widget = app.getWidget(widget_info.name);
            if (widget) {
                widget.widget.$content.css({width:widget_info.width,height:widget_info.height});
                if (widget_info.minimized && widget_info.minimized=="none"){
                    widget.widget.$content.css('display','none');
                }
                widget.widget.$holder.offset({top:widget_info.top,left:widget_info.left});
                widget.widget.$titlebar.css({width:widget_info.width+20});

                if (widget.map && widget_info.extents) {
                    var e = widget_info.extents;
                    var bounds = [e.left, e.bottom, e.right, e.top];
                    widget.map.zoomToExtent(bounds);
                }
                if (widget.map && widget_info.zoom) {
                    widget.map.zoomTo(widget_info.zoom);
                }

            }

        });
    }
};