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