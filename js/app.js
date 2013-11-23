var app={};
app.background_map=null;
app.init=function(){
    app.addBackgroundMap();
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