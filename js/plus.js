
function Lighthen(red, green, blue)
{
    var max = ([red,green,blue].sort(function(l,r){return r-l}))[0];
    var multiplier = max;
    multiplier = (multiplier / 255) + 5;

    // if it would still be too dark, make it lighten more
    if (multiplier < 1.5) multiplier = 1.9;

    // if it gets to white, move away a bit
    if ((max * multiplier) > 255)
    {
        multiplier = (multiplier / 230) + 1;
    }

    var r = Math.round(red * multiplier);
    var g = Math.round(green * multiplier);
    var b = Math.round(blue * multiplier);

    if (r > 255) r = 255;
    if (g > 255) g = 255;
    if (b > 255) b = 255;

    return "rgb(" + r + "," + g + "," + b + ")";
}


var col_head = $('.well').css('background-color');


    col_head2 = col_head.replace(/[^0-9,]+/g, "");
    var red = col_head2.split(",")[0];
    var gre = col_head2.split(",")[1];
    var blu = col_head2.split(",")[2];

var lighter = Lighthen(red, gre, blu);


(function($) {
    $.fn.drags = function(opt) {

        opt = $.extend({handle:"",cursor:"move"}, opt);

        if(opt.handle === "") {
            var $el = this;
        } else {
            var $el = this.find(opt.handle);
        }

        return $el.css('cursor', opt.cursor).on("mousedown", function(e) {

            if(opt.handle === "") {
                var $drag = $(this).closest('.plus-draggable').addClass('draggable');
            } else {
                var $drag = $(this).addClass('active-handle').parent().addClass('draggable');
            }
            var z_idx = $drag.css('z-index'),
                drg_h = $drag.outerHeight(),
                drg_w = $drag.outerWidth(),
                pos_y = $drag.offset().top + drg_h - e.pageY,
                pos_x = $drag.offset().left + drg_w - e.pageX;
            $drag.css('z-index', 1000).parents().on("mousemove", function(e) {
                $('.draggable').offset({
                    top:e.pageY + pos_y - drg_h,
                    left:e.pageX + pos_x - drg_w
                }).on("mouseup", function() {
                    $(this).removeClass('draggable').css('z-index', z_idx);
                });
            });
            e.preventDefault(); // disable selection
        }).on("mouseup", function() {
            if(opt.handle === "") {
                $(this).removeClass('draggable');
            } else {
                $(this).removeClass('active-handle').parent().removeClass('draggable');
            }
        });

    }
})(jQuery);

$.fn.boxCollapse = function(){
        var th = $(this);
        th.find('.icon_collapse').on('click', function(e){
            e.preventDefault();
            var content = $(this).closest('.navbar').parent().find('p');
            content.slideToggle("slow", function(){
                var di = $(this).css("display");
                if(di == "none"){
                    $('.icon-chevron-up').removeClass('icon-chevron-up').addClass('icon-chevron-down');
                }else{
                    $('.icon-chevron-down').removeClass('icon-chevron-down').addClass('icon-chevron-up');
                }   
            });
        });
};


$.fn.verticalMenu = function(){
    var th = $(this);
    $(this).css( 'cursor', 'pointer');
    th.find('ul > li[class=active]').css('background-color', $('.nav-list > .active').css('background-color')).parent('ul').css('display', 'block');
    th.children('a').on('click', function(e){
        e.preventDefault();
        $(this).parent('li').siblings('.plus-verticalMenu').find('ul').slideUp('slow');
        $(this).siblings('ul').slideToggle('slow');
        
    });
};


(function($){
    $.fn.getStyleObject = function(){
        var dom = this.get(0);
        var style;
        var returns = {};
        if(window.getComputedStyle){
            var camelize = function(a,b){
                return b.toUpperCase();
            };
            style = window.getComputedStyle(dom, null);
            for(var i = 0, l = style.length; i < l; i++){
                var prop = style[i];
                var camel = prop.replace(/\-([a-z])/g, camelize);
                var val = style.getPropertyValue(prop);
                returns[camel] = val;
            };
            return returns;
        };
        if(style = dom.currentStyle){
            for(var prop in style){
                returns[prop] = style[prop];
            };
            return returns;
        };
        return this.css();
    }
})(jQuery);
/*
Works like this:
$.fn.copyCSS = function(source){
  var styles = $(source).getStyleObject();
  this.css(styles);
}


*/
 function getStyle (selector){
  var re = new RegExp('(^|,)\\s*'+selector.toLowerCase()+'\\s*(,|$)');
  var style = "";
  $.each ($.makeArray(document.styleSheets), function(){
    $.each (this.cssRules || this.rules, function(){
       if (re.test(this.selectorText)) style += this.style.cssText + ';';
       });
   });
   return style;
}




$.fn.pricing = function(){
    var th = $(this);
    th.css('borderColor', col_head);
    th.find('.plus-pricing-head').css("background-color", col_head);
    th.find('.plus-pricing-price').css('background-color', lighter);
    th.find('.plus-pricing-button').css('background-color', col_head);
    th.find('li').css('borderColor', col_head);
};

$('.plus-pricing').pricing();
$('.plus-verticalMenu').verticalMenu();
$('.plus-collapsible').boxCollapse();

$('.icon_drag').drags();

$('.plus-verticalMenu > ul > .active').css('background-color', $('.nav-list > .active > a' ).css('background-color')).css('color', $('.nav-list > .active > a' ).css('color') );

        var vert_back = $('.plus-verticalMenu > ul').not('li [class=active]').css('background-color');
        var vert_color = $('.plus-verticalMenu > ul > li').not('li [class=active]').css('color');

$('.plus-verticalMenu > ul > li').hover(function(){
        $(this).css('background-color', $('.nav-list > .active > a' ).css('background-color')).css('color', $('.nav-list > .active > a' ).css('color') );
}, function(){

        $(this).not('[class=active]').css('background-color', vert_back).css('color', vert_color);
});



var megacolor = $('.plus-mega li a').css('color');
var megaback  = $('.plus-mega li a').css('background-color');
$('.plus-mega-content li').hover(function(){
    $(this).css('background-color', $('.nav-list > .active > a' ).css('background-color'));
    $(this).find('a').css('color', $('.nav-list > .active > a' ).css('color') );
}, function(){
    $(this).css('background-color', megaback);
    $(this).find('a').css('color', megacolor);
});




$(document).ready(function(){
    var location = $('.gmap').attr('data-location');
    var zoom = $('.gmap').attr('data-zoom');
    var data = '<iframe width="100%" height="350" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="http://maps.google.com/maps?oe=utf-8&amp;client=firefox-a&amp;channel=fflb&amp;q=google+map&amp;ie=UTF8&amp;hq=&amp;hnear='+location+'&amp;t=m&amp;z='+zoom+'&amp;output=embed&iwloc=near"></iframe>';

    $('.gmap').html(data);
});

$('.plus-post > .arrow-right').css('border-left-color', col_head);
$('.plus-metro > .arrow-up').css('border-bottom-color', col_head);

