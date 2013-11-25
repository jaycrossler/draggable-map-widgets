var app=window.app || {};
app.widget_store = [
    {title:"Mini Map", widget_id:"mini_map", content_function:"buildMap", parameters:
        {map_num:1, center: [-77.042466107994,38.892564036371], numZoomLevels: 20, zoom: 17, panning:true, zoom_buttons:true}
    },
    {title:"Calendar", widget_id:"mini_calendar", content_function:"buildCalendar"}
];