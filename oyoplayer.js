/*!
 * oyoplayer.js 2.0
 * tested with jQuery 3.4.0
 * http://www.oyoweb.nl
 *
 * © 2015-2021 oYoSoftware
 * MIT License
 *
 * oyoplayer is an alternative audio player with a playlist
 * it also can play samples and has a marquee
 */

//import {oyoButton} from "../oyobuttons/oyobuttons";
//export {oyoPlayer};

var oyoPlayerLocation;

(function () {
    var src = $("script").last().attr("src");
    oyoPlayerLocation = src.substring(0, src.lastIndexOf("/") + 1);
    var link = document.createElement("link");
    $(link).attr("rel", "stylesheet");
    var href = src.substring(0, src.length - 3) + ".css";
    $(link).attr("href", href);
    $("head").append(link);
})();

function oyoPlayer() {

    var player;
    var playerIndex;
    var tagBox;
    var tag;
    var style;

    var active = false;
    var stateSeeked = false;
    var playall = true;
    var samples = false;
    var scroll = true;
    var scrobbled = false;
    var notification = "";

    var counter = 1;
    var currentSong = "";
    var songs = [];
    var tags = [];
    var errors = [];

    var trackStart = 0;
    var trackEnd = 0;
    var trackDuration = 0;
    var trackCurrentTime = 0;

    var sampleLimitBegin = 20;
    var sampleLimitEnd = 40;
    var minSampleLength = 30;
    var maxSampleLength = 60;

    (function oyoPlayer() {
        if (window.oyoPlayerCount === undefined) {
            oyoPlayerCount = 1;
        } else {
            oyoPlayerCount += 1;
        }

        player = document.createElement("div");
        $(player).attr("class", "oyoplayer");
        playerIndex = oyoPlayerCount;

        player.audio = document.createElement("audio");
        $(player.audio).attr("class", "oyoaudio");
        $(player.audio).attr("controls", "controls");
        $(player.audio).attr("controlslist", "nodownload");
        $(player.audio).attr("preload", "auto");
        $(player).append(player.audio);

        tagBox = document.createElement("div");
        $(tagBox).attr("class", "oyotagbox");
        $(player).append(tagBox);

        tag = document.createElement("div");
        $(tag).attr("class", "oyotag");
        $(tagBox).append(tag);

        $(player.audio).on("loadedmetadata", loadedMetaData);
        $(player.audio).on("canplay", canPlay);
        $(player.audio).on("playing", playing);
        $(player.audio).on("timeupdate", timeUpdate);
        $(player.audio).on("pause", paused);
        $(player.audio).on("seeking", seek);
        $(player.audio).on("seeked", seek);
        $(player.audio).on("ended", ended);
        $(player.audio).on("error", error);

        function loadedMetaData() {
            scrobbled = false;
            if (!player.state.active && notification !== "") {
                player.changeTag(notification);
            } else {
                player.changeTag(tags[counter]);
            }
            switch (true) {
                case !samples && player.audio.duration !== Infinity:
                    trackStart = 0;
                    trackEnd = player.audio.duration;
                    trackDuration = player.audio.duration;
                    break;
                case samples && player.audio.duration !== Infinity:
                    trackStart = Math.round(100 * (sampleLimitBegin / 100) * player.audio.duration) / 100;
                    trackEnd = Math.round(100 * (sampleLimitEnd / 100 * player.audio.duration)) / 100;
                    trackDuration = Math.round(100 * (trackEnd - trackStart)) / 100;
                    if (trackDuration < minSampleLength)
                        trackEnd = trackStart + minSampleLength;
                    if (trackDuration > maxSampleLength)
                        trackEnd = trackStart + maxSampleLength;
                    if (trackEnd > player.audio.duration)
                        trackEnd = Math.round(100 * ((100 - sampleLimitBegin) / 100 * player.audio.duration)) / 100;
                    trackDuration = Math.round(100 * (trackEnd - trackStart)) / 100;
                    break;
                case player.audio.duration === Infinity:
                    trackStart = 0;
                    trackEnd = player.audio.duration;
                    trackDuration = player.audio.duration;
                    break;
            }
            player.audio.currentTime = trackStart;
        }

        function canPlay() {
            if (active && player.audio.currentTime === 0) {
                player.audio.play();
            }
        }

        function playing() {
            notification = "";
            active = true;
            player.changeTag(tags[counter]);
        }

        function timeUpdate(event) {
            // conditions scrobbling LastFM: song is longer than 30 seconds, song has played half it's duration or 240 seconds
            if (player.audio.duration !== Infinity && player.audio.duration > 30 && !scrobbled) {
                var secondsPlayed = 0;
                for (var i = 0; i < player.audio.played.length; i++) {
                    secondsPlayed += player.audio.played.end(i) - player.audio.played.start(i);
                }
                if (secondsPlayed / player.audio.duration > 0.5 || secondsPlayed > 240)
                    scrobbled = true;
            }

            trackCurrentTime = player.audio.currentTime;
            switch (true) {
                case !samples && player.audio.duration !== Infinity:
                    if (player.audio.duration > trackDuration) {
                        trackDuration = player.audio.duration;
                    }
                    if (player.audio.duration > 0 && player.audio.currentTime >= player.audio.duration) {
                        if (!player.audio.ended) {
                            $(player.audio).trigger("ended");
                        }
                    }
                    break;
                case samples && player.audio.duration !== Infinity:
                    if (player.audio.currentTime < trackStart) {
                        player.audio.currentTime = trackStart;
                    }
                    if (player.audio.currentTime > trackEnd) {
                        player.skipNext();
                    }
                    break;
                case player.audio.duration === Infinity:
                    break;
            }
        }

        function paused() {
            stateSeeked = false;
            setTimeout(function () {
                if (!stateSeeked) {
                    active = false;
                }
            }, 200);
        }

        function seek() {
            stateSeeked = true;
        }

        function ended() {
            if (trackDuration !== Infinity) {
                player.audio.src = "";
                player.skipNext();
            } else {
                player.audio.load();
                player.audio.play();
            }
        }

        function error() {
            errors[counter] = true;
            if ($(player.audio).attr("src") !== "") {
                if (active) {
                    player.skipNext();
                } else {
                    var errorcount = 0;
                    for (var i = 1; i < errors.length; i++) {
                        //if (errors[i] === true) {
                        errorcount += 1;
                        //}
                    }
                    if (errorcount < songs.length - 1) {
                        player.skipNext();
                    } else {
                        counter = 1;
                        $(player.audio).attr("src", "");
                    }
                }
            }
        }

        $(tagBox).on("click", tagBoxClick);

        function tagBoxClick() {
            scroll = !scroll;
            initScroll();
        }

        var stylename = "style[name=keyframes]";
        if ($(stylename).length === 0) {
            style = document.createElement('style');
            $(style).attr("name", "keyframes");
            $("head").append(style);
        }
        style = $(stylename).get(0);

        initScroll();
    })();

    function initScroll() {
        var tagBoxWidth = $(tagBox).outerWidth();
        var tagWidth = $(tag).width();
        var centerPosition = (tagBoxWidth - tagWidth) / 2;
        $(tag).css("left", centerPosition);

        if (scroll) {
            var keyframes = "@keyframes keyframes" + playerIndex + " { \n  " +
                    "0% { left: " + centerPosition + "px; }\n  " +
                    "50% { left: " + -1 * tagWidth + "px; }\n  " +
                    "50.001% { left: " + tagBoxWidth + "px; }\n  " +
                    "100% { left: " + centerPosition + "px; }\n" +
                    "}";
            var rules = style.sheet.rules;
            var index = playerIndex - 1;
            if (rules[index]) {
                style.sheet.deleteRule(index);
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

        if (scroll) {
            $(tag).css("animation", "linear infinite");
            $(tag).css("animation-name", "keyframes" + playerIndex);
            $(tag).css("animation-delay", "1s");
            $(tag).css("animation-play-state", "running");
            $(tagBox).css("text-align", "initial");
            $(tag).css("position", "relative");
            var duration = (tagBoxWidth + tagWidth) / 100 + "s";
            $(tag).css("animation-duration", duration);
        } else {
            $(tag).css("animation-play-state", "paused");
            $(tagBox).css("text-align", "center");
            $(tag).css("position", "static");
        }
    }

    player.track = {
        get start() {
            return trackStart;
        },
        get end() {
            return trackEnd;
        },
        get duration() {
            return trackDuration;
        },
        get currentTime() {
            return trackCurrentTime;
        },
        set currentTime(value) {
            player.audio.currentTime = value;
        }
    };

    player.state = {
        get active() {
            return active;
        },
        get playing() {
            var playing = player.audio.duration > 0 && !player.audio.paused && !player.audio.ended && player.audio.readyState > 2;
            return playing;
        },
        get paused() {
            var paused = player.audio.duration > 0 && player.audio.paused && !player.audio.ended && player.audio.readyState > 2 && !player.audio.seeking;
            return paused;
        },
        get playall() {
            return playall;
        },
        set playall(value) {
            playall = value;
        },
        get samples() {
            return samples;
        },
        set samples(value) {
            samples = value;
        },
        get scroll() {
            return scroll;
        },
        set scroll(value) {
            if (value !== false)
                value = true;
            scroll = value;
            initScroll();
        },
        get scrobbled() {
            return scrobbled;
        }
    };

    player.play = function () {
        player.audio.play();
    };

    player.pause = function () {
        player.audio.pause();
    };

    player.playPause = function (index) {
        if (songs[index] !== currentSong) {
            if (songs[index] !== undefined) {
                active = true;
                counter = index;
                player.changeSource(songs[counter]);
            } else {
                player.changeTag("Song does not exist.");
            }
        } else {
            if (player.audio.paused) {
                player.audio.play();
            } else {
                player.audio.pause();
            }
        }
    };

    player.skipPrevious = function () {
        if (playall) {
            if (counter > 1) {
                counter = counter - 1;
                player.changeSource(songs[counter]);
                return true;
            } else {
                counter = 1;
                player.changeSource(songs[counter]);
                return false;
            }
        } else {
            player.audio.currentTime = trackStart;
        }
    };

    player.skipNext = function () {
        if (playall) {
            if (counter < songs.length - 1) {
                counter = counter + 1;
                player.changeSource(songs[counter]);
                return true;
            } else {
                counter = 1;
                active = false;
                player.changeSource(songs[counter]);
                return false;
            }
        } else {
            player.audio.pause();
            player.audio.currentTime = trackStart;
        }
    };

    player.playPlaylist = function () {
        player.playPause(1, true);
    };

    player.changeTag = function (html) {
        $(tag).html(html);
        initScroll();
    };

    player.changeSource = function (source) {
        if (source) {
            currentSong = source;
            source = source.replace(/\\/g, '/');
            var protocol = document.location.protocol;
            switch (true) {
                case protocol === "file:" || (protocol !== "file:" && source.substring(0, 2) !== "//" && source.substring(1, 3) !== ":/") :
                    $(player.audio).attr("src", source);
                    break;
                default:
                    var url = oyoPlayerLocation + "getAudio.php";
                    $.ajax({
                        url: url,
                        cache: false,
                        data: {source: source},
                        xhrFields: {responseType: "blob"},
                        dataType: "binary",
                        success: function (data) {
                            $(player.audio).attr("src", URL.createObjectURL(data));
                        }
                    });
            }
        }
    };

    player.setSourceIndex = function (index) {
        counter = index;
        player.changeSource(songs[counter]);
    };

    player.setNotification = function (text) {
        notification = text;
    };

    player.clearPlaylist = function () {
        counter = 1;
        songs = [];
        tags = [];
        errors = [];
        active = false;
    };

    player.addToPlaylist = function (song, tag) {
        var index = songs.length;
        if (index === 0)
            index = 1;
        songs[index] = song;
        tags[index] = tag;
    };

    player.getCurrentTrack = function () {
        return counter;
    };

    player.getCurrentSong = function () {
        return currentSong;
    };

    player.getSongs = function () {
        var gsongs = [];
        for (var i = 1; i < songs.length; i++) {
            gsongs[i] = {song: songs[i], tag: tags[i]};
        }
        return gsongs;
    };

    player.countSongs = function () {
        var count = songs.length - 1;
        if (count < 0)
            count = 0;
        return count;
    };

    player.setSamples = function (begin, end, min, max) {
        samples = true;
        if (begin) {
            sampleLimitBegin = begin;
        } else {
            sampleLimitBegin = 20;
        }
        if (sampleLimitBegin >= 100)
            sampleLimitBegin = 20;
        if (end) {
            sampleLimitEnd = end;
        } else {
            sampleLimitEnd = 40;
        }
        if (sampleLimitEnd > 100)
            sampleLimitEnd = 40;
        if (sampleLimitEnd <= sampleLimitBegin)
            sampleLimitEnd = sampleLimitBegin + 20;
        if (min) {
            minSampleLength = min;
        } else {
            minSampleLength = 30;
        }
        if (max) {
            maxSampleLength = max;
        } else {
            maxSampleLength = 60;
        }
        if (maxSampleLength < minSampleLength)
            maxSampleLength = minSampleLength;
        player.audio.load();
    };

    return player;
}
