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

function oyoPlayer(width = 500) {

    width = parseInt(width);

    var scrollAllow = true;
    var scrollView = true;

    var statePlaying = false;
    var statePaused = true;
    var stateEnded = true;
    var playall = true;
    var samples = false;
    var scroll = true;
    var scrobbled = false;

    var trackStart = 0;
    var trackEnd = 0;
    var trackDuration = 0;
    var trackCurrentTime = 0;

    var notification = "";
    var defaultBackgroundColor = "black";
    var defaultTextColor = "white";
    var defaultActiveColor = "#527FC3";
    var defaultInActiveColor = "#B3CEB3";

    var counter = 1;
    var currentSong = "";
    var songs = [];
    var tags = [];
    var errors = [];
    var skip = "";
    var firstTrack, lastTrack;

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
    if (width < 350) {
        width = 350;
    }
    $(player).css("width", width);
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
    $(panel).css("width", width - 16);
    $(panel).css("height", "36px");
    $(panel).css("background-color", defaultBackgroundColor);
    $(panel).css("overflow", "hidden");
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

    var tagBox = new oyoMarquee(width, 25, 8);
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
        stateEnded = false;
        scrobbled = false;
        if (statePaused && notification !== "") {
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
                trackStart = (sampleLimitBegin / 100) * player.audio.duration;
                trackStart = Math.floor(1000000 * trackStart) / 1000000;
                trackEnd = (sampleLimitEnd / 100) * player.audio.duration;
                trackEnd = Math.ceil(1000000 * trackEnd) / 1000000;
                trackDuration = trackEnd - trackStart;
                trackDuration = Math.floor(1000000 * trackDuration) / 1000000;
                if (trackDuration < minSampleLength) {
                    trackEnd = trackStart + minSampleLength;
                    trackEnd = Math.ceil(1000000 * trackEnd) / 1000000;
                }
                if (trackDuration > maxSampleLength) {
                    trackEnd = trackStart + maxSampleLength;
                    trackEnd = Math.ceil(1000000 * trackEnd) / 1000000;
                }
                if (trackEnd > player.audio.duration) {
                    trackEnd = (((100 - sampleLimitBegin) / 100) * player.audio.duration);
                    trackEnd = Math.ceil(1000000 * trackEnd) / 1000000;
                }
                trackDuration = trackEnd - trackStart;
                trackDuration = Math.floor(1000000 * trackDuration) / 1000000;
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
        if (trackDuration !== Infinity) {
            trackSlider.enable();
        } else {
            trackSlider.disable();
        }
    }

    function canPlay() {
        var difference = Math.ceil(1000000 * (trackStart - trackCurrentTime)) / 1000000;
        if (difference !== 0.000001) {
            difference = 0;
        }
        if (!statePaused && trackCurrentTime === (trackStart - difference)) {
            player.audio.play();
        }
    }

    function playing() {
        statePlaying = true;
        statePaused = false;
        stateEnded = false;
        player.changeTag(tags[counter]);
        if (playpause.state === 0) {
            playpause.changeState();
        }
    }

    function timeUpdate() {
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
            case !samples && trackDuration !== Infinity:
                if (player.audio.duration > trackDuration) {
                    trackEnd = player.audio.duration;
                    trackDuration = player.audio.duration;
                }
                var difference = Math.ceil(1000000 * (trackEnd - trackCurrentTime)) / 1000000;
                if (difference !== 0.000001) {
                    difference = 0;
                }
                if (trackCurrentTime >= (trackEnd - difference)) {
                    if (!player.audio.ended) {
                        $(player.audio).trigger("ended");
                    }
                }
                changeTrackPosition();
                break;
            case samples && trackDuration !== Infinity:
                var difference = Math.ceil(1000000 * (trackEnd - trackCurrentTime)) / 1000000;
                if (difference !== 0.000001) {
                    difference = 0;
                }
                if (trackCurrentTime >= (trackEnd - difference)) {
                    $(player.audio).trigger("ended");
                }
                changeTrackPosition();
                break;
            case trackDuration === Infinity:
                break;
        }

        var current = Math.floor(trackCurrentTime - trackStart);
        if (!isNaN(trackDuration)) {
            var time = "";
            if (trackDuration !== Infinity) {
                var duration = Math.floor(trackDuration);
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
        if (statePaused) {
            if (playpause.state === 1) {
                playpause.changeState();
            }
        }
    }

    function ended() {
        if (trackDuration !== Infinity) {
            if (playall) {
                if (!stateEnded) {
                    statePlaying = false;
                    stateEnded = true;
                    player.skipNext();
                }
            } else {
                statePlaying = false;
                statePaused = true;
                stateEnded = true;
                player.audio.currentTime = trackStart;
            }
        } else {
            player.audio.load();
            player.audio.play();
        }

        if (statePaused) {
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
            stateEnded = true;
            if (skip === "previous") {
                player.skipPrevious();
            } else {
                player.skipNext();
            }
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

    Object.defineProperty(player, "scrollAllow", {
        get() {
            return scrollAllow;
        },
        set(value) {
            scrollAllow = value;
            tagBox.scrollAllow = scrollAllow;
            if (!scrollAllow) {
                scroll = false;
                tagBox.scroll = false;
            }
        }
    });

    Object.defineProperty(player, "scrollView", {
        get() {
            return scrollView;
        },
        set(value) {
            scrollView = value;
            if (scrollView) {
                $(tagBox).css("display", "block");
            } else {
                $(tagBox).css("display", "none");
                scroll = false;
                tagBox.scroll = false;
            }
        }
    });

    player.state = {
        get playing() {
            return statePlaying;
        },
        get paused() {
            return statePaused;
        },
        get ended() {
            return stateEnded;
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
            if (scrollAllow && scrollView) {
                scroll = value;
                tagBox.scroll = scroll;
            }
        },
        get scrobbled() {
            return scrobbled;
        }
    };

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
        }
    };

    player.play = function () {
        statePlaying = true;
        statePaused = false;
        stateEnded = false;
        player.audio.play();
    };

    player.pause = function () {
        statePlaying = false;
        statePaused = true;
        player.audio.pause();
    };

    player.playPause = function (index) {
        if (!Boolean(lastTrack)) {
            setTrackIndexes();
        }
        if (songs[index] !== currentSong) {
            if (songs[index] !== undefined) {
                statePlaying = true;
                statePaused = false;
                counter = index;
                player.changeSource(songs[counter]);
            } else {
                player.changeTag("Song does not exist.");
            }
        } else {
            if (player.audio.paused) {
                statePlaying = true;
                statePaused = false;
                player.audio.play();
            } else {
                statePlaying = false;
                statePaused = true;
                player.audio.pause();
            }
        }
    };

    player.skipPrevious = function () {
        skip = "previous";
        if (counter > firstTrack) {
            counter = counter - 1;
            player.changeSource(songs[counter]);
            return true;
        } else {
            counter = firstTrack;
            player.changeSource(songs[counter]);
            return false;
        }
    };

    player.skipNext = function () {
        skip = "next";
        if (counter < lastTrack) {
            counter = counter + 1;
            player.changeSource(songs[counter]);
            return true;
        } else {
            counter = firstTrack;
            statePlaying = false;
            statePaused = true;
            stateEnded = true;
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
                        source.substring(0, 2) !== "//" &&
                        source.substring(1, 3) !== ":/" &&
                        source.substring(0, 7) !== "file://") :
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
        if (!Boolean(lastTrack)) {
            setTrackIndexes();
        }
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
        firstTrack = null;
        lastTrack = null;
        playpause.disable();
        previous.disable();
        next.disable();
        trackSlider.disable();
        volumeSlider.disable();
        speaker.disable();
        trackStart = 0;
        trackEnd = 0;
        trackDuration = 0;
        trackCurrentTime = 0;
        statePlaying = false;
        statePaused = true;
        stateEnded = true;
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
        var width = parseInt($(player).css("width")) - 16;
        $(panel).css("width", width);
        changeTrackSlider();
        $(tagBox).css("width", width);
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

    player.changeControlColors = function (activeColor = defaultActiveColor, inActiveColor = defaultInActiveColor, handleColor) {
        playpause.changeFillColor(activeColor);
        playpause.changeBorderColors(activeColor, inActiveColor);
        previous.changeFillColor(activeColor);
        previous.changeBorderColors(activeColor, inActiveColor);
        next.changeFillColor(activeColor);
        next.changeBorderColors(activeColor, inActiveColor);
        speaker.changeFillColor(activeColor);
        speaker.changeBorderColors(activeColor, inActiveColor);
        trackSlider.changeTrackColors(activeColor, inActiveColor);
        trackSlider.changeThumbColor(handleColor);
        volumeSlider.changeTrackColors(activeColor, inActiveColor);
        volumeSlider.changeThumbColor(handleColor);
    };

    player.resetColors = function () {
        $(player).css("background-color", defaultBackgroundColor);
        $(panel).css("background-color", defaultBackgroundColor);
        playpause.resetColors();
        previous.resetColors();
        next.resetColors();
        speaker.resetColors();
        trackSlider.resetColors();
        volumeSlider.resetColors();
        playpause.changeBackgroundColor(defaultBackgroundColor);
        previous.changeBackgroundColor(defaultBackgroundColor);
        next.changeBackgroundColor(defaultBackgroundColor);
        speaker.changeBackgroundColor(defaultBackgroundColor);
        trackSlider.changeBackgroundColor(defaultBackgroundColor);
        volumeSlider.changeBackgroundColor(defaultBackgroundColor);
        $(timeDisplay).css("color", defaultTextColor);
        tagBox.changeBackgroundColor(defaultBackgroundColor);
        tagBox.changeTextColor(defaultTextColor);
    };

    $(playpause).on("click", playPauseButtonClick);
    $(previous).on("click", previousButtonClick);
    $(next).on("click", nextButtonClick);
    $(trackSlider).on("mousedown", trackSliderMouseDown);
    $(volumeControl).on("mouseenter", volumeControlMouseEnter);
    $(volumeControl).on("mouseleave", volumeControlMouseLeave);
    $(volumeSlider).on("mousedown", volumeSliderMouseDown);
    $(speaker).on("click", speakerButtonClick);
    $(document).on("mousemove", mouseMove);
    $(document).on("mouseup", mouseUp);
    $(player).on("keydown", playerKeyDown);
    $(volumeControl).on("keydown", volumeControlKeyDown);

    function playPauseButtonClick() {
        if (trackDuration === Infinity) {
            if (playpause.state === 1) {
                player.audio.load();
            }
        }
        player.playPause(player.getCurrentTrack());
    }

    function previousButtonClick() {
        var previous = player.skipPrevious();
        if (previous && !statePaused) {
            playpause.changeState();
        }
        initPrevNext();
    }

    function nextButtonClick() {
        var next = player.skipNext();
        if (next && !statePaused) {
            playpause.changeState();
        }
        initPrevNext();
    }

    function trackSliderMouseDown() {
        changeCurrentTime();
    }

    function volumeControlMouseEnter() {
        if (!volumeSlider.disabled) {
            $(volumeSlider).css("display", "inline-block");
            changeTrackSlider();
        }
    }

    function volumeControlMouseLeave() {
        if (!volumeSlider.disabled && !volumeSlider.active) {
            $(volumeSlider).css("display", "none");
            changeTrackSlider();
        }
    }

    function volumeSliderMouseDown() {
        changeVolume();
    }

    function speakerButtonClick() {
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

    function playerKeyDown() {
        changeCurrentTime();
    }

    function volumeControlKeyDown() {
        changeVolume();
    }

    function initPrevNext() {
        if (player.getCurrentTrack() === firstTrack) {
            previous.disable();
        } else {
            previous.enable();
        }
        if (player.getCurrentTrack() === lastTrack) {
            next.disable();
        } else {
            next.enable();
        }
    }

    function setTrackIndexes() {
        for (var i = 1; i < songs.length - 1 ; i++) {
            getTrackIndex(true, i);
            if (Boolean(firstTrack)) {
                break;
            }
        }
        for (var i = songs.length - 1; i > 0; i--) {
            getTrackIndex(false, i);
            if (Boolean(lastTrack)) {
                break;
            }
        }
        function getTrackIndex(top, index) {
            var source = songs[index];
            source = source.replaceAll("\\", "/'");
            source = source.replaceAll("#", "%23");
            var protocol = document.location.protocol;

            switch (true) {
                case protocol === "file:" ||
                    (protocol !== "file:" &&
                        source.substring(0, 2) !== "//" &&
                        source.substring(1, 3) !== ":/" &&
                        source.substring(0, 7) !== "file://") :
                    var url = source;
                    $.ajax({
                        url: url,
                        async: false,
                        success: function () {
                            if (top) {
                                firstTrack = index;
                            } else {
                                lastTrack = index;
                            }
                        }
                    });
                    break;
                default:
                    var url = oyoPlayerLocation + "checkAudio.php";
                    $.ajax({
                        url: url,
                        data: {source: source},
                        async: false,
                        success: function (exists) {
                            if (exists) {
                                if (top) {
                                    firstTrack = index;
                                } else {
                                    lastTrack = index;
                                }
                            }
                        }
                    });
            }
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
        if (trackDuration !== Infinity) {
            var percentage = trackSlider.value / trackSlider.max;
            percentage = Math.ceil(1000000 * percentage) / 1000000;
            var currentTime = trackStart;
            currentTime += percentage * trackDuration;
            currentTime = Math.ceil(1000000 * currentTime) / 1000000;
            player.audio.currentTime = currentTime;
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
    }

    function changeTrackPosition() {
        if (trackDuration !== Infinity) {
            if (trackDuration !== 0) {
                var value = (100 * (trackCurrentTime - trackStart) / trackDuration);
                value = Math.ceil(1000000 * value) / 1000000;
                trackSlider.value = value;
            }
        }
    }

    return player;
}