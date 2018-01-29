/**
 * @author Lukas Dratwa
 *
 * 29.01.2018.
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

function moveOptObjUp(jQueryFaIcon) {
    var prev = jQueryFaIcon.parent().parent().prev();
    if(prev.length != 0) {
        jQueryFaIcon.parent().parent().insertBefore(prev);
    }
}

function moveOptObjDown(jQueryFaIcon) {
    var next = jQueryFaIcon.parent().parent().next();
    if(next.length != 0) {
        jQueryFaIcon.parent().parent().insertAfter(next);
    }
}

var removeOptObj = function(id) {
    $("#" + id).remove();
    $(".optObjOrderIconDelte").remove();

    var otherId = id === "low_priority" ? "high_priority" : "low_priority";

    // Quick & dirty ... shame on me :-D
    var html = "<p class='optObjOrderText'><i class='fas fa-arrow-up optObjUp optObjOrderIcon' onclick='moveOptObjUp($(this))'></i><i class='fas fa-arrow-down optObjDown optObjOrderIcon' onclick='moveOptObjDown($(this))'></i>High & low priority constraints</p>";

    $($("#" + otherId + " p")[0]).parent().html(html);
};

$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
        return null;
    }
    else{
        return decodeURI(results[1]) || 0;
    }
};