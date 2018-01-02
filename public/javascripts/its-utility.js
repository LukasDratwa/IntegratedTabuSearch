/**
 * @author Lukas Dratwa
 */
var customScrollTo = function(idTo, speed) {
    $('html, body').animate({
        scrollTop: $(idTo).offset().top
    }, speed);
};