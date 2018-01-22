/**
 * @author Lukas Dratwa
 */
var customScrollTo = function(idTo, speed) {
    $('html, body').animate({
        scrollTop: $(idTo).offset().top
    }, speed);
};

/* Toggle between adding and removing the "responsive" class to topnav when the user clicks on the icon */
var toggleNavbarClass = function(id) {
    var x = document.getElementById(id);
    if (x.className === "topnav") {
        x.className += " responsive";
    } else {
        x.className = "topnav";
    }
};

var removeOptObj = function(id) {
    $("#" + id).remove();
    $(".optObjOrderIconDelte").remove();

    var otherId = id === "low_priority" ? "high_priority" : "low_priority";
    $($("#" + otherId + " p")[0]).text("High & low priority constraints")
};

$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
        return null;
    }
    else{
        return decodeURI(results[1]) || 0;
    }
}