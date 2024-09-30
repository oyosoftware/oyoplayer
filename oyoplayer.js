/*!
 * oyoplayer.js 3.0
 * tested with jQuery 3.4.0
 * http://www.oyoweb.nl
 *
 * © 2015-2024 oYoSoftware
 * MIT License
 *
 * oyoplayer is an alternative audio player with a playlist
 * it also can play samples and has a marquee
 */

var src = $("script").last().attr("src");
var oyoPlayerLocation = src.substring(0, src.lastIndexOf("/") + 1);

function oyoPlayer() {

    var active = false;
    var playall = true;
    var samples = false;
    var scroll = true;
    var scrobbled = false;
    var notification = "";
    var defaultBackgroundColor = "black";
    var defaultTextColor = "white";

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

    var buttons = document.createElement("script");
    $(buttons).attr("src", oyoPlayerLocation + "oyobuttons.js");
    $("head").append(buttons);
    var slider = document.createElement("script");
    $(slider).attr("src", oyoPlayerLocation + "oyoslider.js");
    $("head").append(slider);
    var marquee = document.createElement("script");
    $(marquee).attr("src", oyoPlayerLocation + "oyomarquee.js");
    $("head").append(marquee);

    var player = document.createElement("div");
    $(player).attr("class", "oyoplayer");
    $(player).css("box-sizing", "border-box");
    $(player).css("width", "500px");
    $(player).css("border-radius", "16px");
    $(player).css("box-shadow", "8px 8px 16px black");
    $(player).css("overflow", "hidden");
    $(player).css("background-color", defaultBackgroundColor);
    $(player).css("padding", "8px");
    $(player).css("user-select", "none");
    $(player).css("outline", "none");

    player.audio = document.createElement("audio");
    $(player.audio).attr("class", "oyoaudio");
    $(player.audio).attr("preload", "auto");
    $(player).append(player.audio);

    var panel = document.createElement("div");
    $(panel).attr("class", "oyopanel");
    $(panel).css("display", "inline-block");
    $(panel).css("width", "484px");
    $(panel).css("background-color", defaultBackgroundColor);
    $(panel).css("overflow", "hidden");
    $(panel).css("border-radius", "16px");
    $(player).append(panel);

    var playControl = document.createElement("div");
    $(playControl).attr("class", "oyoplaycontrol");
    $(playControl).css("display", "inline-block");
    $(playControl).css("vertical-align", "middle");
    $(panel).append(playControl);

    var playpause = new oyoButton("playpause");
    playpause.scale(0.5);
    playpause.disable();
    $(playControl).append(playpause);

    var previous = new oyoButton("previous");
    previous.scale(0.5);
    previous.disable();
    $(playControl).append(previous);

    var next = new oyoButton("next");
    next.scale(0.5);
    next.disable();
    $(playControl).append(next);

    var timeDisplay = document.createElement("div");
    $(timeDisplay).addClass("oyotimedisplay");
    $(timeDisplay).css("display", "inline-block");
    $(timeDisplay).css("color", defaultTextColor);
    $(timeDisplay).css("margin", "6px");
    $(timeDisplay).css("text-align", "center");
    $(timeDisplay).css("vertical-align", "middle");
    $(timeDisplay).html(formatTime(0, 0));
    $(panel).append(timeDisplay);

    var trackSlider = new oyoSlider();
    $(trackSlider).addClass("oyotrackslider");
    $(trackSlider).css("display", "inline-block");
    $(trackSlider).css("vertical-align", "middle");
    $(trackSlider).css("outline", "none");
    trackSlider.change(100, 34);
    trackSlider.disable();
    trackSlider.setKeyControlElement(player);
    $(panel).append(trackSlider);

    var volumeControl = document.createElement("div");
    $(volumeControl).addClass("oyovolumecontrol");
    $(volumeControl).css("display", "inline-block");
    $(volumeControl).css("vertical-align", "middle");
    $(panel).append(volumeControl);

    var volumeSlider = new oyoSlider();
    $(volumeSlider).addClass("oyovolumeslider");
    $(volumeSlider).css("display", "inline-block");
    $(volumeSlider).css("vertical-align", "middle");
    $(volumeSlider).css("outline", "none");
    volumeSlider.change(64, 34);
    $(volumeSlider).css("display", "none");
    volumeSlider.setKeyControlElement(volumeControl);
    volumeSlider.disable();
    $(volumeControl).append(volumeSlider);

    var speaker = new oyoButton("speaker");
    $(speaker).css("vertical-align", "middle");
    speaker.scale(0.5);
    speaker.disable();
    $(volumeControl).append(speaker);

    var tagBox = new oyoMarquee(484, 25, 8);
    tagBox.changeBackgroundColor(defaultBackgroundColor);
    tagBox.changeTextColor(defaultTextColor);
    $(player).append(tagBox);

    $(player.audio).on("loadedmetadata", loadedMetaData);
    $(player.audio).on("canplay", canPlay);
    $(player.audio).on("playing", playing);
    $(player.audio).on("timeupdate", timeUpdate);
    $(player.audio).on("pause", paused);
    $(player.audio).on("ended", ended);
    $(player.audio).on("error", error);
    $(player.audio).on("volumechange", volumeChange);

    function loadedMetaData() {
        scrobbled = false;
        if (!active && notification !== "") {
            player.changeTag(notification);
            notification = "";
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

        playpause.enable();
        volumeSlider.enable();
        speaker.enable();
        initPrevNext();
        trackSlider.reset();
        if (player.track.duration !== Infinity) {
            trackSlider.enable();
        } else {
            trackSlider.disable();
        }
    }

    function canPlay() {
        if (active && player.audio.currentTime === trackStart) {
            player.audio.play();
        }
    }

    function playing() {
        player.changeTag(tags[counter]);

        if (playpause.state === 0) {
            playpause.changeState();
        }
    }

    function timeUpdate(event) {
        // conditions scrobbling LastFM: song is longer than 30 seconds,
        // song has played half it's duration or 240 seconds
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
                    if (playall) {
                        player.skipNext();
                    } else {
                        active = false;
                        player.audio.currentTime = trackStart;
                        player.audio.pause();
                    }
                }
                break;
            case player.audio.duration === Infinity:
                break;
        }

        var current = Math.floor(player.track.currentTime - player.track.start);
        if (!isNaN(player.track.duration)) {
            var time = "";
            if (player.track.duration !== Infinity) {
                var duration = Math.floor(player.track.duration);
                time = formatTime(current, duration);
            } else {
                time = formatTime(current);
            }
        }
        var prevtime = $(timeDisplay).html();
        if (time !== prevtime) {
            $(timeDisplay).html(time);
            changeTrackSlider();
        }
    }

    function paused() {
        if (!active) {
            if (playpause.state === 1) {
                playpause.changeState();
            }
        }
    }

    function ended() {
        if (trackDuration !== Infinity) {
            if (playall) {
                player.skipNext();
            } else {
                active = false;
                player.audio.currentTime = trackStart;
            }
        } else {
            player.audio.load();
            player.audio.play();
        }

        if (!active) {
            if (playpause.state === 1) {
                playpause.changeState();
            }
        }
    }

    function error() {
        errors[counter] = true;
        var errorcount = 0;
        for (var i = 1; i < errors.length; i++) {
            if (errors[i] === true) {
                errorcount += 1;
            }
        }
        if (errorcount < songs.length - 1) {
            player.skipNext();
        }
    }

    function volumeChange() {
        if (((player.audio.muted || player.audio.volume === 0) && speaker.state === 0) ||
            ((!player.audio.muted && player.audio.volume !== 0) && speaker.state === 1)) {
            speaker.changeState();
        }
        var left = player.audio.volume * $(".oyotrack", volumeSlider).width() - $(".oyothumb", volumeSlider).width() / 2;
        if (player.audio.muted) {
            left = -$(".oyothumb", volumeSlider).width() / 2;
        }
        $(".oyothumb", volumeSlider).css("left", left);
        var width = left + $(".oyothumb", volumeSlider).width() / 2;
        $(".oyotrackbefore", volumeSlider).width(width);
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
            scroll = value;
            tagBox.scroll = scroll;
        },
        get scrobbled() {
            return scrobbled;
        }
    };

    player.play = function () {
        active = true;
        player.audio.play();
    };

    player.pause = function () {
        active = false;
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
                active = true;
                player.audio.play();
            } else {
                active = false;
                player.audio.pause();
            }
        }
    };

    player.skipPrevious = function () {
        if (counter > 1) {
            counter = counter - 1;
            player.changeSource(songs[counter]);
            return true;
        } else {
            counter = 1;
            player.changeSource(songs[counter]);
            return false;
        }
    };

    player.skipNext = function () {
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
    };

    player.playPlaylist = function () {
        player.playPause(1, true);
    };

    player.changeTag = function (html) {
        tagBox.setText(html);
    };

    player.changeSource = function (source) {
        if (source) {
            currentSong = source;
            source = source.replaceAll("\\", "/'");
            source = source.replaceAll("#", "%23");
            var protocol = document.location.protocol;

            switch (true) {
                case protocol === "file:" ||
                    (protocol !== "file:" &&
                        source.substring(0, 2) !== "//" && source.substring(1, 3) !== ":/" && source.substring(0, 7) !== "file://") :
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
        tagBox.setText(text);
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
        if (index === 0) {
            index = 1;
        }
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

    var playerObserver = new ResizeObserver(function () {
        changeTrackSlider();
        $(player.audio).trigger("volumechange");
    });
    playerObserver.observe(player);

    player.changeBackgroundColor = function (color) {
        $(player).css("background-color", color);
        $(panel).css("background-color", color);
        playpause.changeBackgroundColor(color);
        previous.changeBackgroundColor(color);
        next.changeBackgroundColor(color);
        speaker.changeBackgroundColor(color);
        trackSlider.changeBackgroundColor(color);
        volumeSlider.changeBackgroundColor(color);
        tagBox.changeBackgroundColor(color);
    };

    player.changeTextColor = function (color) {
        $(timeDisplay).css("color", color);
        tagBox.changeTextColor(color);
    };

    player.changeControlColors = function (controlColorActive, controlColorInActive) {
        playpause.changeFillColor(controlColorActive);
        playpause.changeBorderColors(controlColorActive, controlColorInActive);
        previous.changeFillColor(controlColorActive);
        previous.changeBorderColors(controlColorActive, controlColorInActive);
        next.changeFillColor(controlColorActive);
        next.changeBorderColors(controlColorActive, controlColorInActive);
        speaker.changeFillColor(controlColorActive);
        speaker.changeBorderColors(controlColorActive, controlColorInActive);
        trackSlider.changeTrackColors(controlColorActive, controlColorInActive);
        trackSlider.changeThumbColor(controlColorActive);
        volumeSlider.changeTrackColors(controlColorActive, controlColorInActive);
        volumeSlider.changeThumbColor(controlColorActive);
    };

    player.resetColors = function () {
        $(player).css("background-color", defaultBackgroundColor);
        $(panel).css("background-color", defaultBackgroundColor);
        playpause.changeBackgroundColor(defaultBackgroundColor);
        playpause.resetColors();
        previous.changeBackgroundColor(defaultBackgroundColor);
        previous.resetColors();
        next.changeBackgroundColor(defaultBackgroundColor);
        next.resetColors();
        speaker.changeBackgroundColor(defaultBackgroundColor);
        speaker.resetColors();
        trackSlider.changeColor(defaultBackgroundColor);
        trackSlider.resetColors();
        volumeSlider.changeColor(defaultBackgroundColor);
        volumeSlider.resetColors();
        tagBox.changeBackgroundColor(defaultBackgroundColor);
        $(timeDisplay).css("color", defaultTextColor);
        tagBox.changeTextColor(defaultTextColor);
    };

    $(playpause).on("click", oyoPlayPauseButtonClick);
    $(previous).on("click", oyoPreviousButtonClick);
    $(next).on("click", oyoNextButtonClick);
    $(trackSlider).on("mousedown", oyoTrackSliderMouseDown);
    $(volumeControl).on("mouseenter", oyoVolumeControlMouseEnter);
    $(volumeControl).on("mouseleave", oyoVolumeControlMouseLeave);
    $(volumeSlider).on("mousedown", oyoVolumeSliderMouseDown);
    $(speaker).on("click", oyoSpeakerButtonClick);
    $(document).on("mousemove", mouseMove);
    $(document).on("mouseup", mouseUp);
    $(player).on("keydown", oyoPlayerKeyDown);
    $(volumeControl).on("keydown", oyoVolumeControlKeyDown);

    function oyoPlayPauseButtonClick() {
        if (playpause.state === 1) {
            active = true;
        } else {
            active = false;
        }
        if (player.track.duration === Infinity) {
            if (playpause.state === 1) {
                player.audio.load();
            }
        }
        player.playPause(player.getCurrentTrack());
    }

    function oyoPreviousButtonClick() {
        var previous = player.skipPrevious();
        if (previous && active) {
            playpause.changeState();
        }
        initPrevNext();
    }

    function oyoNextButtonClick() {
        var next = player.skipNext();
        if (next && active) {
            playpause.changeState();
        }
        initPrevNext();
    }

    function oyoTrackSliderMouseDown() {
        changeCurrentTime();
    }

    function oyoVolumeControlMouseEnter() {
        if (!volumeSlider.disabled) {
            $(volumeSlider).css("display", "inline-block");
            changeTrackSlider();
        }
    }

    function oyoVolumeControlMouseLeave() {
        if (!volumeSlider.disabled && !volumeSlider.active) {
            $(volumeSlider).css("display", "none");
            changeTrackSlider();
        }
    }

    function oyoVolumeSliderMouseDown() {
        changeVolume();
    }

    function oyoSpeakerButtonClick() {
        player.audio.muted = !player.audio.muted;
    }

    function mouseMove() {
        if (trackSlider.active) {
            changeCurrentTime();
        }
        if (volumeSlider.active) {
            changeVolume();
        }
    }

    function mouseUp(event) {
        var elements = $(volumeControl).add($(volumeControl).find("*")).toArray();
        if (elements.indexOf(event.target) === -1) {
            $(volumeSlider).css("display", "none");
            changeTrackSlider();
        }
    }

    function oyoPlayerKeyDown() {
        changeCurrentTime();
    }

    function oyoVolumeControlKeyDown() {
        changeVolume();
    }

    function initPrevNext() {
        if (player.getCurrentTrack() === 1) {
            previous.disable();
        } else {
            previous.enable();
        }
        if (player.getCurrentTrack() === player.countSongs()) {
            next.disable();
        } else {
            next.enable();
        }
    }

    function formatTime(currentSeconds, durationSeconds) {
        var aHours, aMinutes, aSeconds;
        var cHours = Math.floor(currentSeconds / 3600);
        var cMinutes = Math.floor((currentSeconds - (cHours * 3600)) / 60);
        var cSeconds = currentSeconds - (cHours * 3600) - (cMinutes * 60);
        var dHours = Math.floor(durationSeconds / 3600);
        var dMinutes = Math.floor((durationSeconds - (dHours * 3600)) / 60);
        var dSeconds = durationSeconds - (dHours * 3600) - (dMinutes * 60);
        if (cHours > 0 || dHours > 0) {
            aHours = cHours + ":";
            aMinutes = cMinutes.toString().padStart(2, "0") + ":";
            aSeconds = cSeconds.toString().padStart(2, "0");
        } else {
            aHours = "";
            aMinutes = cMinutes + ":";
            aSeconds = cSeconds.toString().padStart(2, "0");
        }
        var time = aHours + aMinutes + aSeconds;
        if (durationSeconds !== undefined) {
            if (dHours > 0) {
                aHours = dHours + ":";
                aMinutes = dMinutes.toString().padStart(2, "0") + ":";
                aSeconds = dSeconds.toString().padStart(2, "0");
            } else {
                aHours = "";
                aMinutes = dMinutes + ":";
                aSeconds = dSeconds.toString().padStart(2, "0");
            }
            var durationTime = aHours + aMinutes + aSeconds;
            time += "/" + durationTime;
        }
        return time;
    }

    function changeCurrentTime() {
        if (player.track.duration !== Infinity) {
            var currentTime = player.track.start;
            var percentage = trackSlider.value / trackSlider.max;
            currentTime += percentage * player.track.duration;
            player.track.currentTime = currentTime;
        }
    }

    function changeVolume() {
        var percentage = volumeSlider.value / volumeSlider.max;
        if (percentage > 0) {
            player.audio.muted = false;
        }
        player.audio.volume = percentage;
    }

    function changeTrackSlider() {
        var panelWidth = $(panel).width();
        var playControlWidth = $(playControl).outerWidth(true);
        var timeDisplayWidth = $(timeDisplay).outerWidth(true);
        var volumeControlWidth = $(volumeControl).outerWidth(true);
        var width = panelWidth - (playControlWidth + timeDisplayWidth + volumeControlWidth);
        trackSlider.change(width);
        if (player.track.duration !== Infinity) {
            if (player.track.duration !== 0) {
                var value = parseFloat((100 * (player.track.currentTime - player.track.start) / player.track.duration).toFixed(6));
                trackSlider.value = value;
            }
        }
    }

    return player;
}