window.log=function(){log.history=log.history||[];log.history.push(arguments);if(this.console){console.log(Array.prototype.slice.call(arguments))}};window.console=window.console||{log:log,warn:log,error:log,assert:log};

var app=window.app || {};
app.background_map=null;
app.activeWidgetManager=[];
app.saveConfig=true;
app.settings={
    buffer:20,
    default_height:200,
    num_links_in_menubuilder_column:5
};

app.init=function(){
    app.addBackgroundMap();

    app.addWidgets(app.default_widget_list);
    app.restoreConfigFromCookie();

    $(window).bind('beforeunload',app.setCookie);
    setInterval(app.setCookie,10000); //Auto-save config every 10 seconds

    app.addMainMenu();

    //TODO: Handle multiple layers per map widget
    //TODO: Build into a Django app
    //TODO: Have only admins able to move widgets around
    //TODO: Have WFS controls to add features to map layer
    //TODO: Have WFS controls to toggle shapes (damaged/occupied/clear/whatever)
    //TODO: Have a polling service to check if settings/cookies have changed from master and load them

};

app.addBackgroundMap=function(){
    OpenLayers.ImgPath = "js/OpenLayers/img/";
    app.background_map = new OpenLayers.Map({
        div: "background_map",
        layers: [
            new OpenLayers.Layer.WMS("Landsat7",
                "http://geoint.nrlssc.navy.mil/nrltileserver/wms",
                {layers: "NAIP,OSM_BASEMAP_OVERLAY"})
        ],
        center: [-77.042466107994,38.892564036371],
        zoom: 15
    });

    app.background_map.addControl(new OpenLayers.Control.LayerSwitcher());
};
app.lookupWidgetInfo=function(options){
    //Extends a widget config with all widget info
    if (!options || !options.widget_id){
        console.log("ERROR = app.lookupWidgetInfo received a request for a widget, and no widget_id was passed in.");
        return options;
    }
    if (!app.widget_store || !app.widget_store.length){
        console.log("ERROR = app.widget_store is not defined or doesn't have widgets within it.");
        return options;
    }

    var newOptions;
    $.each(app.widget_store,function(i,widget_data){
        if (widget_data.widget_id == options.widget_id){
            newOptions = $.extend(true,{},widget_data,options);
            return false;
        }
    });
    if (newOptions && newOptions.content_function) newOptions.content = app[newOptions.content_function];

    return newOptions || options;
};

app.addWidgets=function(widget_list){
    widget_list = widget_list || [];

    var $holder = $("#widget_holder");
    $.each(widget_list,function(i,widget){
        if (app.isWidgetAlreadyDrawn(widget)){
            app.updateWidget(widget);
        } else {
            app.addWidget(widget,$holder);
        }
    });
};
app.isWidgetAlreadyDrawn=function(options){
    var id = app.titleize(options.name);
    var $w = $('#'+id);
    return $w && $w.length;
};
app.updateWidget=function(options,widget){
    widget = widget || app.getWidget(options.name);
    if (widget) {
        widget.widget.$content.css({width:options.width,height:options.height});
        if (options.minimized && options.minimized=="none"){
            widget.widget.$content.css('display','none');
        } else {
            widget.widget.$content.css('display','block');
        }
        widget.widget.$holder.offset({top:options.top,left:options.left});
        widget.widget.$titlebar.css({width:options.width+app.settings.buffer});
        if (options.opacity) {
            widget.widget.$holder.fadeTo(100,options.opacity);
        }
        if(options.zIndex){
            widget.widget.$holder.css('zIndex',options.zIndex);
        }

        //Set up map and Extents
        if (widget.map){
            widget.map.updateSize();
        }
        if (widget.map && options.extents) {
            var e = options.extents;
            var bounds = [e.left, e.bottom, e.right, e.top];
            widget.map.zoomToExtent(bounds);
        }
        if (widget.map && options.zoom) {
            widget.map.zoomTo(options.zoom);
        }
    }
};
app.addWidget=function(options,$holder){
    options = $.extend({},options);
    options = app.lookupWidgetInfo(options);

    var $widget_wrapper = $('<div class="span6 plus-collapsible">')
        .appendTo($holder);
    var $titlebar = $('<div class="navbar">')
        .appendTo($widget_wrapper);

    var $titlebar_in = $('<div class="navbar-inner">').appendTo($titlebar);
    $('<a class="brand" href="#">')
        .text(options.name||"Widget")
        .on('click',options.nameClickFunction||function(){})
        .appendTo($titlebar_in);
    if (!options.preventCollapse) {
        $('<a class="btn pull-right icon_collapse plus-nodrag" href="#"><i class="icon-chevron-up"></i></a>')
            .appendTo($titlebar_in);
        $widget_wrapper.boxCollapse()
    }
    if (!options.preventMove) {
        $('<a class="btn pull-right icon_drag" href="#"><i class="icon-fullscreen"></i></a>')
            .appendTo($titlebar_in);
    }
    if (!options.preventMenu) {

        var menuOptions = [
            {icon:'share',title:'Duplicate Widget',onClick:function(){
                var newOptions = $.extend({},options,{name:app.getCopyName(options.name)});
                var $widget_holder = options.$holder;
                if ($widget_holder && $widget_holder.position && $widget_holder.position()){
                    var top = parseInt($widget_holder.position().top);
                    var left = parseInt($widget_holder.position().left);
                    newOptions.top = top+app.settings.buffer;
                    newOptions.left = left+(2*app.settings.buffer);
                }
                var newWidget = app.addWidget(newOptions, $holder);
                newWidget.widget.$holder.css({zIndex:10000});
            }},
            {icon:'plus-sign',title:'100% Solid',onClick:function(){
                $widget_wrapper.fadeTo(100,1);
            }},
            {icon:'minus-sign',title:'80% Transparent',onClick:function(){
                $widget_wrapper.fadeTo(100,.8);
            }},
            {icon:'minus-sign',title:'60% Transparent',onClick:function(){
                $widget_wrapper.fadeTo(100,.6);
            }},
            {icon:'fire',addClass:'btn-warning',title:'Remove Widget',onClick:function(){
                app.removeWidget(options);
            }}

        ];
        app.buildHoverMenu({menuTitle:"Options",clickInsteadOfHover:false,right:true,menuOptions:menuOptions}).appendTo($titlebar_in);
    }

    var $content = $('<p class="well">').appendTo($widget_wrapper);
    var id = options.divid || app.titleize(options.name);
    var height = options.height || app.settings.default_height || 200;
    var width = $content.parent().css('width')-app.settings.buffer;
    $content
        .attr('id',id)
        .css({height:height, width:width})
        .resizable({
            resize: function( event, ui ) {
                $titlebar.css({width:ui.size.width+app.settings.buffer});

                var widget = app.getWidget(id);
                if (widget.map) widget.map.updateSize();
            }
        });

    if(options.zIndex){
        $widget_wrapper.css('zIndex',options.zIndex);
    }

    options.id = id;
    var content_type = typeof options.content;
    var additional_config = {};

    if (content_type=="function"){
        additional_config = options.content(options,$content) || {};
    } else if (content_type=="object" && options.content.appendTo){
        options.content.appendTo($content);
    } else if (content_type=="string"){
        $content.html(options.content);
    } else {
        $content.html("Unrecognized content");
    }

    $widget_wrapper.draggable({handle:".navbar",containment:"body", stack:".plus-collapsible"});

    options.$content = $content;
    options.$titlebar = $titlebar;
    options.$holder = $widget_wrapper;

    var widgetInfo= $.extend({widget:options, id:id},additional_config);
    app.activeWidgetManager.push(widgetInfo);

    app.updateWidget(options,widgetInfo);

    return widgetInfo;

};
app.buildMap=function(options,$content){
    var id = $content.attr('id');

    var controls = [];
    if (options.parameters.panning) controls.push(new OpenLayers.Control.Navigation());
    if (options.parameters.zoom_buttons) controls.push(new OpenLayers.Control.Zoom());

    var newmap = new OpenLayers.Map({
        div: id,
        layers: [
            new OpenLayers.Layer.WMS("Landsat7",
                "http://geoint.nrlssc.navy.mil/nrltileserver/wms",
                {layers: "NAIP"})
        ],
        controls: controls,
        center: options.parameters.center,
        numZoomLevels: options.parameters.numZoomLevels,
        zoom: options.parameters.zoom
    });

    return {map:newmap};

};
app.buildCalendar=function(options,$content){
    var id = $content.attr('id');

    $('<div>').html("<h1>Calendar</h1>").appendTo($content);

};
app.getWidget=function(name){
    if (typeof name=="number" && app.activeWidgetManager.length>name){
        return app.activeWidgetManager[name];
    }  else {
        for (var i=0;i<app.activeWidgetManager.length;i++){
            var widget =app.activeWidgetManager[i];
            if (widget.id==name || widget.div==name || widget.widget.name.toLowerCase()==name.toLowerCase()){
                return widget;
            }
        }
    }
    return false;
};
app.isWidgetThisWidget=function(widget,name){
    if (widget.id==name || widget.div==name) return true;
    return ( widget && widget.widget && widget.widget.name && widget.widget.name.length
        && name.length && widget.widget.name.toLowerCase()==name.toLowerCase());
};
app.removeWidget=function(options){
    var name=options.name;

    for (var i=0;i<app.activeWidgetManager.length;i++){
        var widget =app.activeWidgetManager[i];
        if (widget.id==name || widget.div==name ||
            (widget && widget.widget && widget.widget.name && widget.widget.name.length
            && name.length && widget.widget.name.toLowerCase()==name.toLowerCase())){
            app.activeWidgetManager[i]={};
        }
    }
    options.$holder.empty();
    delete options;
};
app.getConfig=function(notAsJSON){
    var config={widgets:[]};
    $(app.activeWidgetManager).each(function(i,widget_holder){
        if (!widget_holder.widget || !widget_holder.widget.$content) {
            //Likely a deleted widget, skip it
            return;
        }

        var data = widget_holder.widget;
        var $content = data.$content;

        var name = data.name;
        var width = parseInt($content.css('width'));
        var height = parseInt($content.css('height'));
        var $holder = data.$holder;
        var top,left,zIndex;
        if ($holder && $holder.position && $holder.position()){
            top = parseInt($holder.position().top);
            left = parseInt($holder.position().left)+app.settings.buffer;
            zIndex= $holder.css('zIndex');
        }
        //TODO: Check that buffer is standard in every browser

        var minimized = $content.css('display');
        var opacity = app.getOpacity(data.$holder);
        var widget_info = {widget_id:data.widget_id, name:name, width:width, height:height, top:top, left:left, minimized:minimized, opacity:opacity,zIndex:zIndex};

        if (widget_holder.map && widget_holder.map.getExtent) {
            widget_info.extents = widget_holder.map.getExtent();
            widget_info.zoom = widget_holder.map.getZoom();
        }

        config.widgets.push(widget_info);
    });
    return notAsJSON ? config : JSON.stringify(config);
};
app.setCookie=function(){
    if (app.saveConfig) {
        var config = app.getConfig();
        $.cookie('widget_config',config);
    }
};
app.getCookie=function(){
    var cookie = $.cookie('widget_config') || '{"status":"empty"}';
    return JSON.parse(cookie);
};
app.restoreConfigFromCookie=function(){
    var cookie = app.getCookie();
    if (cookie && cookie.widgets){
        app.addWidgets(cookie.widgets);
    }
};
app.restoreConfigFromString=function(configString){
    configString = configString ||'{"widgets":[{"widget_id":"mini_map","name":"First Floor","opacity":1,"width":330,"height":200,"top":72,"left":40,"minimized":"block","extents":{"left":-77.044540606474,"bottom":38.893079020501,"right":-77.040785513854,"top":38.895439364435},"zoom":17},{"widget_id":"mini_map","name":"Second Floor","width":483,"height":283,"top":80,"left":425,"minimized":"block","extents":{"left":-77.045628432422,"bottom":38.89201954794,"right":-77.042930130154,"top":38.893644966604},"zoom":18},{"widget_id":"mini_map","name":"Third Floor","width":749,"height":270,"top":290,"left":119,"minimized":"block","extents":{"left":-77.056654993683,"bottom":38.891351677896,"right":-77.040154043823,"top":38.89757440281},"zoom":16},{"widget_id":"mini_calendar","name":"Upcoming Events","width":689,"height":200,"top":649,"left":224,"minimized":"none"}]}';
    var config;
    try {
        config = JSON.parse(configString);
    } catch (ex){
        console.log("ERROR - Trying to parse config string, JSON error");
        return;
    }
    if (config && config.widgets){
        app.addWidgets(config.widgets);
    } else {
        console.log("ERROR - no widgets info when trying to load config data");
    }
};
app.clearCookiesAndReload=function(){
    app.saveConfig=false;
    $.cookie('widget_config','{"status":"empty"}');
    window.location.reload();
};
//=Helpers====================
app.titleize=function(name){
    return name.replace(/[ -0-9]/g,"");
};
app.getOpacity=function(elem) {
    var ori = $(elem).css('opacity');
    var ori2 = $(elem).css('filter');
    if (ori2) {
        ori2 = parseInt( ori2.replace(')','').replace('alpha(opacity=','') ) / 100;
        if (!isNaN(ori2) && ori2 != '') {
            ori = ori2;
        }
    }
    return ori;
};
app.buildHoverMenu=function(options){
    //TODO: options.clickInsteadOfHover isn't working

    var num_rows = options.colSize || app.settings.num_links_in_menubuilder_column || 5;

    var $navC = $('<div class="nav-collapse plus-nodrag">');
    var $navUl = $('<ul class="nav">')
        .appendTo($navC);
    if (options.right) {$navUl.addClass('pull-right');}
    var $navLi = $('<li class="dropdown">')
        .appendTo($navUl);
    var $navLink = $('<a href="#" class="dropdown-toggle" data-toggle="dropdown">')
        .text(options.menuTitle)
        .appendTo($navLi);
    $('<b class="caret">').appendTo($navLink);
    var $navUlHolder = $('<ul class="dropdown-menu plus-mega">')
        .appendTo($navLink);
    if (!options.clickInsteadOfHover) {$navUlHolder.addClass('plus-hover');}

    var $navUlLi = $('<li>')
        .appendTo($navUlHolder);
    var $navUlDiv = $('<div class="plus-mega-content">')
        .appendTo($navUlLi);

    var row_height = 0;
    var $navLiHolder;
    $(options.menuOptions||[]).each(function(i,option){
        if (row_height%num_rows==0){
            $navLiHolder = $('<ul class="span2">')
                .appendTo($navUlDiv);
        }
        var $item = $('<li><a href="#"><i class="icon-'+option.icon+'"></i>'+option.title+'</a></li>')
            .on('click',option.onClick||function(){})
            .appendTo($navLiHolder);
        if (option.addClass) $item.addClass(option.addClass);
        row_height++;
    });
    if (!options.menuOptions || !options.menuOptions.length) $navC.hide();

    if ($navLink.dropdown) $navLink.dropdown();

    return $navC;
};
app.addMainMenu=function(){
    var menuOptions = [
        {icon:'share',title:'Add Map Widget',onClick:function(){
            var options ={name:"Map",widget_id:"mini_map",parameters:{map_num:3}};
            app.addWidget(options);
        }},
        {icon:'share',title:'Add Other Widget',onClick:function(){
            var options ={name:"Calendar",widget_id:"mini_calendar"};
            app.addWidget(options);
        }},
        {icon:'share',title:'Add Table Widget',onClick:function(){
            var options ={name:"Table",widget_id:"mini_calendar"};
            app.addWidget(options);
        }}
    ];
    app.buildHoverMenu({menuTitle:"Add Widgets",clickInsteadOfHover:false,right:false,menuOptions:menuOptions}).appendTo('#main_menu');
    //TODO: This adding of widgets is adding them at a weird size
    //TODO: Make sure all imported widgets are brought on screen, and are of sufficient size
    //TODO: Bring widgets in at proper z-index

    menuOptions = [
        {icon:'share',title:'Remove Cookies',onClick:function(){
            app.clearCookiesAndReload();
        }},
        {icon:'share',title:'Load settings 1',onClick:function(){
            app.restoreConfigFromString()
        }},
        {icon:'share',title:'Print Settings to Console',onClick:function(){
            console.log(app.getConfig());
        }}

    ];
    app.buildHoverMenu({menuTitle:"Widget Functions",clickInsteadOfHover:false,right:true,menuOptions:menuOptions}).appendTo('#main_menu');

};
app.getCopyName=function(name){
    var endWithCopyNum = /.+([Cc]opy)( \d+)*/.test(name);
    if (endWithCopyNum){
        var endWithNum = /\d$/.test(name);
        if (endWithNum){
            var num = name.match(/\d$/);
            if (num) {
                var suffix = ""+num;
                num = parseInt(num);
                num++;
                name = name.substring(0, name.length - suffix.length);
                name= _.string.trim(name)+" "+num;
            }
        } else {
            name+= " 2";
        }
    } else {
        name+= " Copy";
    }
    return name;
};