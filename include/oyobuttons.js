/*!
 * oyobuttons.js 1.0
 * tested with jQuery 3.4.0
 * http://www.oyoweb.nl
 *
 * © 2021 oYoSoftware
 * MIT License
 *
 * oyobuttons is a set of buttons to control media, free buttons included
 */

function oyoButton(buttonType, states) {
    var svgNS = 'http://www.w3.org/2000/svg';

    var defaultBorderColors = "#527FC3 #B3CEB3 #B3CEB3 #527FC3";
    var defaultBorderColorsActive = "#B3CEB3 #527FC3 #527FC3 #B3CEB3";
    var defaultFillColor = "#527FC3";

    var button = document.createElement("button");
    $(button).addClass("oyobutton");
    $(button).css("background-color", "black");

    if (buttonType === "") {
        buttonType = "empty";
    }

    button.borderColors = defaultBorderColors;
    button.borderColorsActive = defaultBorderColorsActive;
    $(button).css("border-color", button.borderColors);

    button.content = document.createElementNS(svgNS, "svg");
    $(button.content).addClass("oyocontent");
    $(button.content).css("width", 50 + "px");
    $(button.content).css("height", 50 + "px");
    $(button.content).css("fill", "black");
    $(button).append(button.content);

    switch (true) {
        case buttonType === "play":
            $(button).addClass("oyoplay");
            var polygon = document.createElementNS(svgNS, "polygon");
            $(polygon).addClass("oyofill");
            $(polygon).attr("points", "20,10 20,40 40,25");
            $(button.content).append(polygon);
            break;
        case buttonType === "pause":
            $(button).addClass("oyopause");
            var rect = document.createElementNS(svgNS, "rect");
            $(rect).addClass("oyofill");
            $(rect).attr("x", "17.5");
            $(rect).attr("y", "10");
            $(rect).attr("width", "5");
            $(rect).attr("height", "30");
            $(button.content).append(rect);
            var rect = document.createElementNS(svgNS, "rect");
            $(rect).addClass("oyofill");
            $(rect).attr("x", "27.5");
            $(rect).attr("y", "10");
            $(rect).attr("width", "5");
            $(rect).attr("height", "30");
            $(button.content).append(rect);
            break;
        case buttonType === "playpause":
            $(button).addClass("oyoplaypause");
            $(button).addClass("oyomultibutton-2");
            var polygon = document.createElementNS(svgNS, "polygon");
            $(polygon).addClass("oyofill oyodisplay-0");
            $(polygon).attr("points", "20,10 20,40 40,25");
            $(button.content).append(polygon);
            var rect = document.createElementNS(svgNS, "rect");
            $(rect).addClass("oyofill oyodisplay-1");
            $(rect).attr("x", "17.5");
            $(rect).attr("y", "10");
            $(rect).attr("width", "5");
            $(rect).attr("height", "30");
            $(button.content).append(rect);
            var rect = document.createElementNS(svgNS, "rect");
            $(rect).addClass("oyofill oyodisplay-1");
            $(rect).attr("x", "27.5");
            $(rect).attr("y", "10");
            $(rect).attr("width", "5");
            $(rect).attr("height", "30");
            $(button.content).append(rect);
            break;
        case buttonType === "stop":
            $(button).addClass("oyostop");
            var rect = document.createElementNS(svgNS, "rect");
            $(rect).addClass("oyofill");
            $(rect).attr("x", "10");
            $(rect).attr("y", "10");
            $(rect).attr("width", "30");
            $(rect).attr("height", "30");
            $(button.content).append(rect);
            break;
        case buttonType === "previous":
            $(button).addClass("oyoprevious");
            var rect = document.createElementNS(svgNS, "rect");
            $(rect).addClass("oyofill");
            $(rect).attr("x", "12.5");
            $(rect).attr("y", "10");
            $(rect).attr("width", "5");
            $(rect).attr("height", "30");
            $(button.content).append(rect);
            var polygon = document.createElementNS(svgNS, "polygon");
            $(polygon).addClass("oyofill");
            $(polygon).attr("points", "37,10 37,40 17,25");
            $(button.content).append(polygon);
            break;
        case buttonType === "next":
            $(button).addClass("oyonext");
            var polygon = document.createElementNS(svgNS, "polygon");
            $(polygon).addClass("oyofill");
            $(polygon).attr("points", "12,10 12,40 32,25");
            $(button.content).append(polygon);
            var rect = document.createElementNS(svgNS, "rect");
            $(rect).addClass("oyofill");
            $(rect).attr("x", "31.5");
            $(rect).attr("y", "10");
            $(rect).attr("width", "5");
            $(rect).attr("height", "30");
            $(button.content).append(rect);
            break;
        case buttonType === "record":
            $(button).addClass("oyorecord");
            $(button).addClass("oyomultibutton-2");
            var circle = document.createElementNS(svgNS, "circle");
            $(circle).addClass("oyodisplay-0");
            $(circle).attr("cx", 24.5);
            $(circle).attr("cy", 24.5);
            $(circle).attr("r", 15);
            $(circle).attr("fill", "red");
            $(button.content).append(circle);
            var circle = document.createElementNS(svgNS, "circle");
            $(circle).addClass("oyodisplay-1");
            $(circle).attr("cx", 24.5);
            $(circle).attr("cy", 24.5);
            $(circle).attr("r", 25);
            var radialGradient = document.createElementNS(svgNS, "radialGradient");
            $(radialGradient).attr("id", "oyorecord");
            $(button.content).append(radialGradient);
            var stop = document.createElementNS(svgNS, "stop");
            $(stop).attr("offset", "50%");
            $(stop).attr("stop-color", "red");
            $(radialGradient).append(stop);
            var stop = document.createElementNS(svgNS, "stop");
            $(stop).attr("offset", "100%");
            $(stop).attr("stop-color", "black");
            $(radialGradient).append(stop);
            radialGradient.url = "url('#oyorecord')";
            $(circle).attr("fill", radialGradient.url);
            $(button.content).append(circle);
            break;
        case buttonType === "speaker":
            $(button).addClass("oyospeaker");
            $(button).addClass("oyomultibutton-2");
            var circle = document.createElementNS(svgNS, "circle");
            $(circle).addClass("oyofill");
            $(circle).attr("cx", 25);
            $(circle).attr("cy", 25);
            $(circle).attr("r", 20);
            $(button.content).append(circle);
            var circle = document.createElementNS(svgNS, "circle");
            $(circle).attr("cx", 25);
            $(circle).attr("cy", 25);
            $(circle).attr("r", 16);
            $(button.content).append(circle);
            var circle = document.createElementNS(svgNS, "circle");
            $(circle).addClass("oyofill");
            $(circle).attr("cx", 25);
            $(circle).attr("cy", 25);
            $(circle).attr("r", 12);
            $(button.content).append(circle);
            var rect = document.createElementNS(svgNS, "rect");
            $(rect).attr("x", "5");
            $(rect).attr("y", "5");
            $(rect).attr("width", "24");
            $(rect).attr("height", "40");
            $(button.content).append(rect);
            var rect = document.createElementNS(svgNS, "rect");
            $(rect).addClass("oyofill");
            $(rect).attr("x", "5");
            $(rect).attr("y", "17");
            $(rect).attr("width", "16");
            $(rect).attr("height", "16");
            $(button.content).append(rect);
            var polygon = document.createElementNS(svgNS, "polygon");
            $(polygon).addClass("oyofill");
            $(polygon).attr("points", "25,5 25,45 8,25");
            $(button.content).append(polygon);
            var polygon = document.createElementNS(svgNS, "polygon");
            $(polygon).addClass("oyofill oyodisplay-1");
            $(polygon).attr("points", "5,7 7,5 45,43 43,45");
            $(button.content).append(polygon);
            var polygon = document.createElementNS(svgNS, "polygon");
            $(polygon).addClass("oyodisplay-1");
            $(polygon).attr("points", "7,5 9,3 47,41 45,43");
            $(button.content).append(polygon);
            break;
        default:
            $(button).addClass(buttonType);
            if (states > 0) {
                var multiButton = "oyomultibutton-" + states;
                $(button).addClass(multiButton);
            }
    }

    $(".oyofill", button.content).css("fill", defaultFillColor);

    $(button).on("mousedown", mouseDown);
    $(button).on("mouseup", mouseUp);
    $(button).on("click", click);

    function mouseDown(event) {
        $(button).css("border-color", button.borderColorsActive);
    }

    function mouseUp(event) {
        $(button).css("border-color", button.borderColors);
    }

    function click() {
        button.changeState();
    }

    button.changeState = function () {
        var classNames = $(button).attr("class");
        classNames = classNames.split(" ");
        var multiButton = "";
        $(classNames).each(function (index, className) {
            if (className.indexOf("oyomultibutton") === 0)
                multiButton = className;
        });
        if (multiButton) {
            var maxState = parseInt(multiButton.split("-")[1]);
            var nextState = state + 1;
            if (nextState === maxState)
                nextState = 0;
            state = nextState;
            var displayElements = $("[class*=oyodisplay-]", button.content);
            displayElements.each(function (index, displayElement) {
                $(displayElement).css("display", "none");
                var className = "oyodisplay-" + nextState;
                if ($(displayElement).hasClass(className)) {
                    $(displayElement).css("display", "inline");
                }
            });
        }
    };

    var classNames = $(button).attr("class");
    classNames = classNames.split(" ");
    var multiButton = "";
    $(classNames).each(function (index, className) {
        if (className.indexOf("oyomultibutton") === 0)
            multiButton = className;
    });
    if (multiButton) {
        var state = -1;
        button.changeState();
        Object.defineProperty(button, "state", {
            get: function () {
                return state;
            }
        });
    }

    button.createContentElement = function (qualifiedName) {
        var element = document.createElementNS(svgNS, qualifiedName);
        $(button.content).append(element);
        return element;
    };

    button.displayStates = function (element, states) {
        if (!Array.isArray(states)) {
            states = $(arguments).toArray();
            states.shift();
        }
        var className = element.className.toString();
        className = className.substring(1, className.length - 1).split(" ")[1];
        if (className === "SVGAnimatedString") {
            $(states).each(function (index, state) {
                var display = "oyodisplay-" + state;
                $(element, button.content).addClass(display);
            });
            button.state = -1;
            button.changeState();
        }
    };

    button.radialGradient = function (stops) {
        var radialGradient = document.createElementNS(svgNS, "radialGradient");
        var urlsplit = "";
        var id = "";
        var blob = new Blob();
        var url = URL.createObjectURL(blob);
        urlsplit = url.split("/");
        id = urlsplit[urlsplit.length - 1];
        urlsplit = id.split("-");
        id = urlsplit[urlsplit.length - 1];
        $(radialGradient).attr("id", id);
        $(button.content).append(radialGradient);
        $.each(stops, function (key, value) {
            var stop = document.createElementNS(svgNS, "stop");
            $(stop).attr("offset", key);
            $(stop).attr("stop-color", value);
            $(radialGradient).append(stop);
        });
        var stop = $("stop[offset='100%']", radialGradient);
        if ($(stop).length === 0) {
            var stop = document.createElementNS(svgNS, "stop");
            $(stop).attr("offset", "100%");
            $(stop).attr("stop-color", "black");
            $(radialGradient).append(stop);
        }
        url = "url('#" + id + "')";
        return url;
    };

    button.enable = function () {
        button.disabled = false;
        $(button).css("cursor", "pointer");
    };

    button.disable = function () {
        button.disabled = true;
        $(button).css("cursor", "default");
    };

    button.changeBackgroundColor = function (color) {
        $(button).css("background-color", color);
        $(button.content).css("fill", color);
        $("radialGradient", button.content).each(function (index, gradient) {
            $("stop[offset='100%']", gradient).attr("stop-color", color);
        });
    };

    button.changeFillColor = function (color) {
        $(".oyofill", button.content).css("fill", color);
    };

    button.changeBorderColors = function (color, colorActive) {
        button.borderColors = color + " " + colorActive + " " + colorActive + " " + color;
        button.borderColorsActive = colorActive + " " + color + " " + color + " " + colorActive;
        $(button).css("border-color", button.borderColors);
    };

    button.resetColors = function () {
        $(button).css("background-color", "black");
        $(button.content).css("fill", "black");
        $("radialGradient", button.content).each(function (index, gradient) {
            $("stop[offset='100%']", gradient).attr("stop-color", "black");
        });
        $(".oyofill", button.content).css("fill", defaultFillColor);
        button.borderColors = defaultBorderColors;
        button.borderColorsActive = defaultBorderColorsActive;
        $(button).css("border-color", button.borderColors);
    };

    button.scale = function (scale) {
        var width = scale * 60;
        var height = scale * 60;
        var borderRadius = scale * 30;
        var borderWidth = scale * 2;
        var padding = scale * 3;

        $(button).css("width", width + "px");
        $(button).css("height", height + "px");
        $(button).css("border-radius", borderRadius + "px");
        $(button).css("border-width", borderWidth + "px");
        $(button).css("padding", padding + "px");

        width = scale * 50;
        height = scale * 50;
        borderRadius = scale * 25;
        $(button.content).css("width", width + "px");
        $(button.content).css("height", height + "px");
        $(button.content).css("border-radius", borderRadius + "px");

        var elements = $(button.content).find("*");
        var svgCSSScale = "scale(" + scale + ")";
        $(elements).each(function (index, element) {
            var svgCSSTransform = svgCSSScale;
            $(element).css("transform", svgCSSTransform);
        });
    };

    return button;
}
