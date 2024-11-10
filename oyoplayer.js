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
    var trackVolume = 1;
    var trackFadeLength = 10;
    var currentFadeLength = 0;
    var trackFadeIn = 0;
    var trackFadeOut = 0;

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
    var skipNext = true;
    var firstTrack, lastTrack;

    var sampleLimitBegin = 20;
    var sampleLimitEnd = 40;
    var minSampleLength = 30;
    var maxSampleLength = 60;

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
                if (trackFadeLength <= (trackDuration / 2) ) {
                    currentFadeLength  = trackFadeLength;
                } else {
                    currentFadeLength = trackDuration / 2;
                }
                trackFadeIn = trackStart + currentFadeLength;
                trackFadeOut = trackEnd - currentFadeLength;
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
                player.audio.volume = trackVolume;
                var fadeInTime = trackCurrentTime - trackStart;
                if (fadeInTime < 0) {
                    fadeInTime = 0;
                }
                if (trackCurrentTime < trackFadeIn) {
                    var volume = fadeInTime / currentFadeLength * trackVolume;
                    volume = Math.ceil(1000000 * volume) / 1000000;
                    player.audio.volume = volume;
                }
                var fadeOutTime = trackEnd - trackCurrentTime;
                if (fadeOutTime < 0) {
                    fadeOutTime = 0;
                }
                if (trackCurrentTime > trackFadeOut) {
                    var volume = fadeOutTime / currentFadeLength * trackVolume;
                    volume = Math.ceil(1000000 * volume) / 1000000;
                    player.audio.volume = volume;
                }
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
        if (errorcount < player.countSongs()) {
            stateEnded = true;
            if (skipNext || counter === 1) {
                player.skipNext();
            } else {
                player.skipPrevious();
            }
        }
    }

    function volumeChange(event) {
        if (!samples || event.isTrigger) {
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
    }

    Object.defineProperty(player, "firstTrack", {
        get() {
            return firstTrack;
        },
        set(value) {
            firstTrack = value;
        }
    });

    Object.defineProperty(player, "lastTrack", {
        get() {
            return lastTrack;
        },
        set(value) {
            lastTrack = value;
        }
    });

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
        },
        get volume() {
            return trackVolume * 100;
        },
        set volume(value) {
            trackVolume = value / 100;
        },
        get fadeLength() {
            return trackFadeLength;
        },
        set fadeLength(value) {
            trackFadeLength = value;
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
        if (!Boolean(firstTrack)) {
            setTrackIndexes(function () {
                playPause();
            });
        } else {
            playPause();
        }
        function playPause() {
            if (index > player.countSongs()) {
                index = 1;
            }
            if (songs[index] !== currentSong) {
                statePlaying = true;
                statePaused = false;
                counter = index;
                player.changeSource(songs[counter]);
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
        }
    };

    player.skipPrevious = function () {
        skipNext = false;
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
        skipNext = true;
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
            $(player.audio).attr("src", source);
        }
    };

    player.setSourceIndex = function (index) {
        if (!Boolean(lastTrack)) {
            setTrackIndexes(function () {
                setSourceIndex();
            });
        } else {
            setSourceIndex();
        }
        function setSourceIndex() {
            if (index > player.countSongs()) {
                index = 1;
            }
            counter = index;
            player.changeSource(songs[counter]);
        }
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
        skipNext = true;
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
        var index = player.countSongs() + 1;
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
        for (var i = 1; i <= player.countSongs(); i++) {
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

    function setTrackIndexes(callback) {
        getTrackIndexes();

        async function getTrackIndexes() {
            for (var i = 1; i <= player.countSongs(); i++) {
                await getTrackIndex(true, i);
                if (Boolean(firstTrack)) {
                    break;
                }
            }
            var checkAgain = !((firstTrack === player.countSongs()) || !Boolean(firstTrack));
            if (!Boolean(checkAgain)) {
                lastTrack = firstTrack;
            }
            if (Boolean(checkAgain)) {
                for (var i = player.countSongs(); i > 0; i--) {
                    await getTrackIndex(false, i);
                    if (Boolean(lastTrack)) {
                        break;
                    }
                }
            }
            callback();
        }

        async function getTrackIndex(top, index) {
            var source = songs[index];
            source = source.replaceAll("\\", "/'");
            source = source.replaceAll("#", "%23");
            await fetch(source).then(function (response) {
                if (response.ok) {
                    if (top) {
                        firstTrack = index;
                    } else {
                        lastTrack = index;
                    }
                }
            });
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
        trackVolume = percentage;
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

/*!
 * oyobuttons.js 2.0
 * tested with jQuery 3.4.0
 * http://www.oyoweb.nl
 *
 * © 2021-2024 oYoSoftware
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
    $(button).css("outline", "0px");
    $(button).css("border", "2px solid");
    $(button).css("border-radius", "30px");
    $(button).css("padding", "3px");
    $(button).css("background-color", "black");
    $(button).css("margin", "2px");
    $(button).css("overflow", "hidden");

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
    $(button.content).css("border-radius", "25px");
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

    function mouseDown() {
        $(button).css("border-color", button.borderColorsActive);
        $(button.content).css("position", "relative");
        $(button.content).css("left", "1px");
        $(button.content).css("top", "1px");
    }

    function mouseUp() {
        $(button).css("border-color", button.borderColors);
        $(button.content).css("position", "static");
        $(button.content).css("left", "");
        $(button.content).css("top", "");
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
        $(button).css("opacity", "1");
    };

    button.disable = function () {
        button.disabled = true;
        $(button).css("cursor", "default");
        $(button).css("opacity", "0.5");
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

/*!
 * oyoslider.js 1.0
 * tested with jQuery 3.4.0
 * http://www.oyoweb.nl
 *
 * © 2021-2024 oYoSoftware
 * MIT License
 *
 * oyoslider is a tool to define an alternative slider element which is browser independant
 */

function oyoSlider(sliderWidth, sliderHeight, sliderBorderRadius, trackWidth, trackHeight, trackBorderRadius, thumbWidth, thumbHeight, thumbBorderRadius) {

    var defaultBeforeColor = "#527FC3";
    var defaultAfterColor = "#B3CEB3";
    var trackMin = 0;
    var trackMax = 100;
    var trackStep = 1;
    var trackValue = 0;
    var activeElement;

    var slider = document.createElement("div");
    $(slider).addClass("oyoslider");
    $(slider).attr("tabindex", 0);
    $(slider).width(300);
    $(slider).height(12);
    $(slider).css("outline", "none");
    $(slider).css("background-color", "black");
    $(slider).css("border-radius", "6px");
    slider.disabled = false;

    var track = document.createElement("div");
    $(track).attr("class", "oyotrack");
    $(track).width(288);
    $(track).height(4);
    $(track).css("box-sizing", "content-box");
    $(track).css("position", "relative");
    $(track).css("margin", "auto");
    $(track).css("top", "50%");
    $(track).css("transform", "translateY(-50%)");
    $(track).css("border-width", "0px");
    $(track).css("border-radius", "2px");
    $(slider).append(track);

    var thumb = document.createElement("div");
    $(thumb).attr("class", "oyothumb");
    $(thumb).width(12);
    $(thumb).height(12);
    $(thumb).css("z-index", "2");
    $(thumb).css("position", "absolute");
    $(thumb).css("left", "-6px");
    $(thumb).css("top", "50%");
    $(thumb).css("transform", "translateY(-50%)");
    $(thumb).css("background-color", "white");
    $(thumb).css("border-radius", "6px");
    $(thumb).css("display", "none");
    $(track).append(thumb);

    var trackRange = document.createElement("div");
    $(trackRange).attr("class", "oyotrackrange");
    $(trackRange).width(288);
    $(trackRange).height(4);
    $(trackRange).css("z-index", "1");
    $(trackRange).css("position", "absolute");
    $(trackRange).css("border-radius", "2px");
    $(trackRange).css("position", "absolute");
    $(trackRange).css("overflow", "hidden");
    $(track).append(trackRange);

    var trackBefore = document.createElement("div");
    $(trackBefore).attr("class", "oyotrackbefore");
    $(trackBefore).height(4);
    $(trackBefore).css("z-index", "1");
    $(trackBefore).css("position", "absolute");
    $(trackBefore).css("background-color", defaultBeforeColor);
    $(trackBefore).css("border-radius", "2px");
    $(trackRange).append(trackBefore);

    var trackAfter = document.createElement("div");
    $(trackAfter).attr("class", "oyotrackafter");
    $(trackAfter).width(288);
    $(trackAfter).height(4);
    $(trackAfter).css("position", "absolute");
    $(trackAfter).css("background-color", defaultAfterColor);
    $(trackAfter).css("border-radius", "2px");
    $(trackRange).append(trackAfter);

    if (sliderWidth !== undefined) {
        $(slider).width(sliderWidth);
    }
    if (sliderHeight !== undefined) {
        $(slider).height(sliderHeight);
    }
    if (sliderBorderRadius !== undefined) {
        $(slider).css("border-radius", sliderBorderRadius);
    }
    if (trackWidth !== undefined) {
        $(track).width(trackWidth);
        $(trackRange).width(trackWidth);
        $(trackAfter).width(trackWidth);
    }
    if (trackHeight !== undefined) {
        $(track).height(trackHeight);
        $(trackRange).height(trackHeight);
        $(trackBefore).height(trackHeight);
        $(trackAfter).height(trackHeight);
    }
    if (trackBorderRadius !== undefined) {
        $(track).css("border-radius", trackBorderRadius);
        $(trackBefore).css("border-radius", trackBorderRadius);
        $(trackAfter).css("border-radius", trackBorderRadius);
    }
    if (thumbWidth !== undefined) {
        $(thumb).width(thumbWidth);
    }
    if (thumbHeight !== undefined) {
        $(thumb).height(thumbHeight);
    }
    if (thumbBorderRadius !== undefined) {
        $(thumb).css("border-radius", thumbBorderRadius);
    }

    $(document).on("mouseover", documentMouseOver);
    $(slider).on("mouseover", mouseOver);
    $(slider).on("mouseout", mouseOut);
    $(slider).on("mousedown", mouseDown);
    $(document).on("mousemove", mouseMove);
    $(slider).on("keydown", keydown);

    function documentMouseOver(event) {
        activeElement = event.target;
    }

    function mouseOver() {
        if (!slider.disabled) {
            var length = $(".oyoactive").length;
            if (length === 0) {
                $(thumb).css("display", "block");
                $("body").css("cursor", "pointer");
            }
        }
    }

    function mouseOut(event) {
        if (!slider.disabled) {
            var mousedown = (event.buttons === 1);
            if (mousedown && $(thumb).hasClass("oyoactive")) {
                $(thumb).css("display", "block");
                $("body").css("cursor", "pointer");
            } else {
                $(thumb).removeClass("oyoactive");
                $(thumb).css("display", "none");
                $("body").css("cursor", "default");
            }
        }
    }

    function mouseDown() {
        if (!slider.disabled) {
            $(thumb).addClass("oyoactive");
            var offsetX = $(track).offset().left + parseInt($(track).css("border-left-width"));
            trackValue = trackMin + (trackMax - trackMin) * (event.pageX - offsetX) / $(track).width();
            trackValue = Math.ceil(1000000 * trackValue) / 1000000;
            changeThumbPosition();
        }
    }

    function mouseMove(event) {
        if (!slider.disabled) {
            var mousedown = (event.buttons === 1);
            if (mousedown && $(thumb).hasClass("oyoactive")) {
                var offsetX = $(track).offset().left + parseInt($(track).css("border-left-width"));
                trackValue = trackMin + (trackMax - trackMin) * (event.pageX - offsetX) / $(track).width();
                trackValue = Math.ceil(1000000 * trackValue) / 1000000;
                changeThumbPosition();
                document.getSelection().removeAllRanges();
            } else {
                var elements = $(slider).add($(slider).find("*")).toArray();
                if (elements.indexOf(event.target) === -1 && $(thumb).hasClass("oyoactive")) {
                    $(thumb).removeClass("oyoactive");
                    $(thumb).css("display", "none");
                    $("body").css("cursor", "default");
                }
            }
            event.stopPropagation();
        }
    }

    function keydown(event) {
        if (!slider.disabled) {
            if (event.keyCode === 37) {
                trackValue -= trackStep;
            }
            if (event.keyCode === 39) {
                trackValue += trackStep;
            }
            if (event.keyCode === 37 || event.keyCode === 39) {
                changeThumbPosition();
                event.preventDefault();
                event.stopPropagation();
            }
        }
    }

    function checkThumbValue() {
        if (trackValue < trackMin) {
            trackValue = trackMin;
        }
        if (trackValue > trackMax) {
            trackValue = trackMax;
        }
    }

    function changeThumbPosition() {
        checkThumbValue();
        var left = (trackValue - trackMin) / (trackMax - trackMin) * $(track).width() - $(thumb).width() / 2;
        $(thumb).css("left", left);
        var width = left + $(thumb).width() / 2;
        $(trackBefore).width(width);
    }

    slider.reset = function () {
        trackValue = trackMin;
        changeThumbPosition();
        $(thumb).removeClass("oyoactive");
        var elements = $(slider).add($(slider).find("*")).toArray();
        if (elements.indexOf(activeElement) === -1) {
            $(thumb).css("display", "none");
        }
    };

    slider.setKeyControlElement = function (element, on) {
        if (on === undefined) {
            on = true;
        }
        $(slider).off("keydown", keydown);
        if (on) {
            $(element).on("keydown", keydown);
        } else {
            $(element).off("keydown", keydown);
        }
    };

    Object.defineProperty(slider, "active", {
        get: function () {
            return $(thumb).hasClass("oyoactive");
        }
    });

    Object.defineProperty(slider, "min", {
        get: function () {
            return trackMin;
        },
        set: function (value) {
            trackMin = value;
        }
    });

    Object.defineProperty(slider, "max", {
        get: function () {
            return trackMax;
        },
        set: function (value) {
            trackMax = value;
        }
    });

    Object.defineProperty(slider, "step", {
        get: function () {
            return trackStep;
        },
        set: function (value) {
            trackStep = value;
        }
    });

    Object.defineProperty(slider, "value", {
        get: function () {
            return trackValue;
        },
        set: function (value) {
            trackValue = value;
            trackValue = Math.ceil(1000000 * trackValue) / 1000000;
            changeThumbPosition();
        }
    });

    slider.enable = function () {
        slider.disabled = false;
        $(slider).css("opacity", 1);
    };

    slider.disable = function () {
        slider.disabled = true;
        $(slider).css("opacity", 0.5);
        $(thumb).removeClass("oyoactive");
        $(thumb).css("display", "none");
        $("body").css("cursor", "default");
    };

    slider.changeBackgroundColor = function (color) {
        $(slider).css("background-color", color);
    };

    slider.changeThumbColor = function (color) {
        $(thumb).css("background-color", color);
    };

    slider.changeTrackColors = function (beforeColor, afterColor) {
        $(trackBefore).css("background-color", beforeColor);
        $(trackAfter).css("background-color", afterColor);
    };

    slider.resetColors = function () {
        $(slider).css("background-color", "black");
        $(thumb).css("background-color", "white");
        $(trackBefore).css("background-color", defaultBeforeColor);
        $(trackAfter).css("background-color", defaultAfterColor);
    };

    slider.change = function (width, height, borderRadius, backgroundColor) {
        if (width !== undefined) {
            var oldSliderWidth = $(slider).width();
            $(slider).width(width);
            var sliderWidthChange = $(slider).width() - oldSliderWidth;
            var trackWidth = $(track).width() + sliderWidthChange;
            slider.changeTrack(trackWidth);
        }
        if (height !== undefined) {
            $(slider).height(height);
        }
        if (borderRadius !== undefined) {
            $(slider).css("border-radius", borderRadius);
        }
        if (backgroundColor !== undefined) {
            $(slider).css("background-color", backgroundColor);
        }
    };

    slider.changeThumb = function (width, height, borderRadius, color) {
        if (width !== undefined) {
            $(thumb).width(width);
        }
        if (height !== undefined) {
            $(thumb).height(height);
        }
        if (borderRadius !== undefined) {
            $(thumb).css("border-radius", borderRadius);
        }
        if (color !== undefined) {
            $(thumb).css("background-color", color);
        }
    };

    slider.changeTrack = function (width, height, borderRadius, beforeColor, afterColor) {
        if (width !== undefined) {
            $(track).width(width);
            $(trackRange).width(width);
            $(trackAfter).width(width);
        }
        if (height !== undefined) {
            $(track).height(height);
            $(trackRange).height(height);
            $(trackBefore).height(height);
            $(trackAfter).height(height);
        }
        if (borderRadius !== undefined) {
            $(track).css("border-radius", borderRadius);
            $(trackBefore).css("border-radius", borderRadius);
            $(trackAfter).css("border-radius", borderRadius);
        }
        if (beforeColor !== undefined) {
            $(trackBefore).css("background-color", beforeColor);
        }
        if (afterColor !== undefined) {
            $(trackAfter).css("background-color", afterColor);
        }
    };

    return slider;
}

/*!
 * oyomarquee.js 1.0
 * tested with jQuery 3.4.0
 * http://www.oyoweb.nl
 *
 * © 2021-2024 oYoSoftware
 * MIT License
 *
 * oyomarquee is a tool to animate a scrolling text
 */

function oyoMarquee(marqueeWidth, marqueeHeight, marqueeBorderRadius, textDirection) {

    var width, height, borderRadius, direction;
    var scroll = true;
    var scrollAllow = true;
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
        if (scrollAllow) {
            scroll = !scroll;
            initScroll();
        }
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

    Object.defineProperty(marquee, "scrollAllow", {
        get: function () {
            return scrollAllow;
        },
        set: function (value) {
            scrollAllow = value;
            if (!scrollAllow) {
                scroll = false;
            }
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
