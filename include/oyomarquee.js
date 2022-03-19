/*!
 * oyomarquee.js 1.0
 * tested with jQuery 3.4.0
 * http://www.oyoweb.nl
 *
 * © 2021 oYoSoftware
 * MIT License
 *
 * oyomarquee is a tool to animate a scrolling text
 */

function oyoMarquee(marqueeWidth, marqueeHeight, marqueeBorderRadius, textDirection) {

    var width, height, borderRadius, direction;
    var scroll = true;
    var speed = 1;
    var loop = "infinite";
    var delay = 0;
    var wrap = false;
    var center = true;
    var repeat = 1;
    var defaultBackgroundColor = "#527FC3";
    var defaultTextColor = "white";

    if (marqueeWidth === undefined) {
        width = 500;
    } else {
        width = marqueeWidth;
    }
    if (marqueeHeight === undefined) {
        height = 25;
    } else {
        height = marqueeHeight;
    }
    if (marqueeBorderRadius === undefined) {
        borderRadius = 0;
    } else {
        borderRadius = marqueeBorderRadius;
    }
    if (textDirection === undefined) {
        direction = "left";
    } else {
        direction = textDirection;
    }

    var style = $("style[name=oyomarquee]")[0];
    if (!style) {
        var style = document.createElement("style");
        $(style).attr("name", "oyomarquee");
        $("head").append(style);
    }
    var marqueeIndex = $("style[name=oyomarquee]")[0].sheet.cssRules.length;
    var name = "oyomarquee" + (marqueeIndex + 1);

    var marquee = document.createElement("div");
    $(marquee).attr("class", "oyomarquee");
    $(marquee).css("box-sizing", "border-box");
    $(marquee).width(width);
    $(marquee).height(height);
    $(marquee).css("border-radius", borderRadius);
    $(marquee).css("overflow", "hidden");
    $(marquee).css("background-color", defaultBackgroundColor);
    $(marquee).css("color", defaultTextColor);

    var marqueeBanner = document.createElement("div");
    $(marqueeBanner).attr("class", "oyomarqueebanner");
    $(marqueeBanner).css("box-sizing", "border-box");
    $(marqueeBanner).css("display", "inline-block");
    $(marqueeBanner).css("position", "relative");
    $(marqueeBanner).css("font-weight", "bold");
    $(marqueeBanner).css("animation-timing-function", "linear");
    $(marqueeBanner).css("animation-name", name);
    $(marqueeBanner).css("animation-iteration-count", loop);
    $(marquee).append(marqueeBanner);

    function setKeyFrames() {
        var marqueeWidth = $(marquee).width();
        var marqueeBannerWidth = $(marqueeBanner).width();
        var marqueeHeight = $(marquee).height();
        var marqueeBannerHeight = $(marqueeBanner).height();
        var marqueeFontSize = parseFloat($(marquee).css("font-size"));
        var textStart, textEnd;
        switch (true) {
            case direction === "left":
                textStart = "0% { left: " + marqueeWidth + "px; }\n  ";
                textEnd = "100% { left: -" + marqueeBannerWidth + "px; } \n";
                break;
            case direction === "right":
                textStart = "0% { left: -" + marqueeBannerWidth + "px; }\n  ";
                textEnd = "100% { left: " + marqueeWidth + "px; } \n";
                break;
            case direction === "up":
                textStart = "0% { top: " + (marqueeHeight + marqueeFontSize / 2) + "px; }\n  ";
                textEnd = "100% { top: -" + (marqueeBannerHeight + marqueeFontSize / 2) + "px; } \n";
                break;
            case direction === "down":
                textStart = "0% { top: -" + (marqueeBannerHeight + marqueeFontSize / 2) + "px; } \n";
                textEnd = "100% { top: " + (marqueeHeight + marqueeFontSize / 2) + "px; }\n  ";
                break;
        }
        var keyframes = "@keyframes " + name + " { \n  " + textStart + textEnd + "}";

        var rules = style.sheet.rules;
        if (rules[marqueeIndex]) {
            style.sheet.deleteRule(marqueeIndex);
            rules = style.sheet.rules;
        }
        var keyFrameRules = [];
        $(rules).each(function (index, rule) {
            keyFrameRules.push(rule.cssText);
        });
        keyFrameRules.push(keyframes);
        keyFrameRules.sort();
        $(style).html(keyFrameRules);
    }

    $(marquee).on("click", function () {
        scroll = !scroll;
        initScroll();
    });

    function initScroll() {
        if (scroll) {
            $(marqueeBanner).css("animation-play-state", "running");
            $(marqueeBanner).css("position", "relative");
        } else {
            $(marqueeBanner).css("animation-play-state", "paused");
            $(marqueeBanner).css("position", "static");
        }
        var running = $(marqueeBanner).css("animation-play-state") === "running";
        if (center === true && (!running || direction === "up" || direction === "down")) {
            $(marquee).css("text-align", "center");
        } else {
            $(marquee).css("text-align", "initial");
        }
    }

    function delayAnimation() {
        scroll = !scroll;
        initScroll();
        setTimeout(function () {
            scroll = !scroll;
            initScroll();
        }, 1000 * delay);
    }

    Object.defineProperty(marquee, "direction", {
        get: function () {
            return direction;
        },
        set: function (value) {
            direction = value;
            marquee.setText();
            initScroll();
        }
    });

    Object.defineProperty(marquee, "scroll", {
        get: function () {
            return scroll;
        },
        set: function (value) {
            scroll = value;
            initScroll();
        }
    });

    Object.defineProperty(marquee, "speed", {
        get: function () {
            return speed;
        },
        set: function (value) {
            speed = value;
            marquee.setText();
        }
    });

    Object.defineProperty(marquee, "loop", {
        get: function () {
            return loop;
        },
        set: function (value) {
            loop = value;
            $(marqueeBanner).css("animation-iteration-count", loop);
        }
    });

    Object.defineProperty(marquee, "delay", {
        get: function () {
            return delay;
        },
        set: function (value) {
            delay = value;
            if (delay === 0 || delay === null) {
                $(marquee).off("animationiteration", delayAnimation);
            } else {
                $(marquee).on("animationiteration", delayAnimation);
            }
        }
    });

    Object.defineProperty(marquee, "wrap", {
        get: function () {
            return wrap;
        },
        set: function (value) {
            wrap = value;
            marquee.setText();
        }
    });

    Object.defineProperty(marquee, "center", {
        get: function () {
            return center;
        },
        set: function (value) {
            center = value;
            initScroll();
        }
    });

    marquee.setText = function (text, textRepeat = 1) {
        $(marqueeBanner).css("animation-name", "");
        $(marqueeBanner).css("line-height", "normal");
        $(marquee).css("padding-top", "0px");
        $(marquee).css("padding-bottom", "0px");

        if (textRepeat !== undefined) {
            repeat = textRepeat;
        }
        if (text !== undefined) {
            var html = "";
            for (i = 1; i <= repeat; i++) {
                html += text;
            }
            $(marqueeBanner).html(html);
        }

        if (wrap === false) {
            $(marqueeBanner).css("white-space", "nowrap");
        } else {
            $(marqueeBanner).css("white-space", "normal");
        }

        var borders = parseFloat($(marquee).css("border-top-width")) + parseFloat($(marquee).css("border-bottom-width"));
        var height = marqueeHeight - borders;
        var marqueeFontSize = parseFloat($(marquee).css("font-size"));
        var factor = Math.floor(height / marqueeFontSize) || 1;
        var lineHeight = parseFloat((height / factor).toFixed(3));
        $(marqueeBanner).css("line-height", lineHeight + "px");

        if (direction === "left" || direction === "right") {
            var duration = ($(marquee).outerWidth() + $(marqueeBanner).outerWidth()) / 100 / speed + "s";
        } else {
            var duration = ($(marquee).outerHeight() + $(marqueeBanner).outerHeight()) / 100 / speed + "s";
        }

        $(marqueeBanner).css("animation-name", name);
        $(marqueeBanner).css("animation-duration", duration);
        setKeyFrames();
    };

    marquee.changeBackgroundColor = function (color) {
        $(marquee).css("background-color", color);
    };

    marquee.changeTextColor = function (color) {
        $(marqueeBanner).css("color", color);
    };

    marquee.resetColors = function () {
        $(marquee).css("background-color", defaultBackgroundColor);
        $(marqueeBanner).css("color", defaultTextColor);
    };

    marquee.change = function (marqueeWidth, marqueeHeight, marqueeBorderRadius) {
        if (marqueeWidth !== undefined) {
            $(marquee).width(marqueeWidth);
        }
        if (marqueeHeight !== undefined) {
            $(marquee).height(marqueeHeight);
        }
        if (marqueeBorderRadius !== undefined) {
            $(marquee).css("border-radius", marqueeBorderRadius);
        }
        if (marqueeWidth === undefined) {
            width = 500;
        } else {
            width = marqueeWidth;
        }
        setKeyFrames(width);
    };

    return marquee;
}
