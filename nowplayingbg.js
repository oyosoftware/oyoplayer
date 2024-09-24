function nowplaying() {
    if (!document.hidden) {
        var date = new Date().getTime() / 1000;
        $.getJSON("https://www.arrow.nl/wp-content/plugins/adeko-arrow-onair/playlistdata/Arrow_PLAYING_NOW.json?date=" + date, function (obj) {
            console.log(obj['current'].artist + " " + obj['current'].title);

            var artistname = obj['previous'].artist;
            var songtitle = obj['previous'].title;
            var thumbname = artistname + " - " + songtitle;
            $('#thumb1').html("previous:<br>" + thumbname);
            var thumbfilename = thumbname.toLowerCase().replace(/ /g, "_");
            var bgfile = artistname.toLowerCase().replace(/ /g, "_");

            var artistname = obj['current'].artist;
            var songtitle = obj['current'].title;
            var thumbname = artistname + " - " + songtitle;
            $('#thumb2').html("current:<br>" + thumbname);

            var artistname = obj['next'].artist;
            var songtitle = obj['next'].title;
            var thumbname = artistname + " - " + songtitle;
            $('#thumb3').html("next:<br>" + thumbname);;

            $.ajax({
                url: 'https://www.arrow.nl/wp-content/themes/bones-master/hoesjes/' + thumbfilename + '.jpg',
                error: function () {
                    if ($('#playlistimg').attr('src') !== "https://www.arrow.nl/wp-content/uploads/2021/12/pngegg.png") {
                        $('#playlistimg').attr('src', function () {
                            return "https://www.arrow.nl/wp-content/uploads/2021/12/pngegg.png";
                        });
                    }
                    let data = obj['current'].artist;
                    let data2 = obj['current'].title;
                    //$('#playlistimg').attr('src', 'https://www.arrow.nl/wp-content/themes/bones-master/hoesjes/' + thumbfilename + '.jpg');
                    $('.playnowar').text(data);
                    $('.playnowtitle').text(data2);
                },
                success: function () {
                    let data = "<div><img alt id='playlistimg' height='80px' src='https://www.arrow.nl/wp-content/themes/bones-master/hoesjes/" + thumbfilename + ".jpg'></div><div style='margin-left:2rem;display: flex; flex-direction: column; align-items: center; justify-content: center;'><p class='playnowar'>" + obj['current'].artist + "</p><p class='playnowtitle'>" + obj['current'].title + "</p></div>";
                    //$('#playlistimg').attr('src', 'https://www.arrow.nl/wp-content/themes/bones-master/hoesjes/' + thumbfilename + '.jpg');
                    $('#thumb1').html(data);
                }
            });

        });
    }
}
nowplaying();

setInterval(nowplaying, 20000);

function do_onair_code() {
    $.ajax({
        url: 'https://www.arrow.nl?do_onair_code',
        error: function () {
            console.log('do_onair_code went wrong!');
        },
        success: function (data) {
            console.log(data);
            $('#thumb').html(data);
        }
    });
}
