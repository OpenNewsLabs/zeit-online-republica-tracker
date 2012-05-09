(function ($) {

  if (typeof window.loadFirebugConsole == "undefined" || typeof window.console == 'undefined') {
    var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml", "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];
    window.console = {};
    for (var i = 0; i < names.length; ++i) {
      window.console[names[i]] = function () {};
    }
  }

  $.fn.rePublica = function (options) {

    var defaults = $.extend({
      interval: 30000,
      displaytime: 2500,
      elements: 0,
      wordsToSearchFor: ['session','track', 'vortrag', 'talk', 'panel'],
      run: false,
      pageid: "",
      alternation: 0,
      totalFoundTweets: 0,
      currentPage: '?q=rp12&rpp=100&include_entities=true&result_type=popular',
      totalTweetsScanned: 0,
      recycledElements: []
    }, options);

    function getTweets() {
      $.ajax({
        url: "http://search.twitter.com/search.json"+ defaults.currentPage,
        dataType: "jsonp",
        success: function(json){
          if(json){
            defaults.currentPage = json.next_page;
            whiteList(json);
          }
        }
      });
    };

    function whiteList(json){
      $.each(json.results, function (index, item) {
        defaults.totalTweetsScanned++
        if(validate(defaults.wordsToSearchFor, item.text)){
          defaults.totalFoundTweets++;
          addItemToDom(index,item);
        }
      });
    }

    function validate(searchFor, findIn){
      var text = findIn.toLowerCase(), i = 0;
      for (i; i < searchFor.length; i++) {
        var found = text.search(searchFor[i]), added = false;
        if(found >= 0 && text.split(' ')[0] !== 'rt') return true
      };
    }

    function parseTweet(item){
      var i = 0, k = 0, j = 0, n = 0, text = item.text;
      for (k; k < item.entities.urls.length; k++) {
        text = text.replace(
          item.text.substring(
            item.entities.urls[k].indices[0],
            item.entities.urls[k].indices[1]
          ), '<a href="'+item.entities.urls[k].url+'"" target="_blank">'+item.entities.urls[k].url+'</a>'
        );
        text = text;
      }

      if(item.entities.media !== undefined){
        for (n; n < item.entities.media.length; n++) {
          text = text.replace(
            item.text.substring(
              item.entities.media[n].indices[0],
              item.entities.media[n].indices[1]
            ), '<a href="'+item.entities.media[n].url+'"" target="_blank">'+item.entities.media[n].url+'</a>'
          );
          text = text;
        }
      }

      for (i; i < item.entities.hashtags.length; i++) {
        text = text.replace(
         item.text.substring(
           item.entities.hashtags[i].indices[0],
           item.entities.hashtags[i].indices[1]
         ), '<a href="https://twitter.com/#!/search/%23'+item.entities.hashtags[i].text+'" target="_blank">#'+item.entities.hashtags[i].text+'</a>'
        );
        text = text;
      }
      
      for (j; j < item.entities.user_mentions.length; j++) {
        text = text.replace(
         item.text.substring(
           item.entities.user_mentions[j].indices[0],
           item.entities.user_mentions[j].indices[1]
         ), '<a href="https://twitter.com/#!/'+item.entities.user_mentions[j].screen_name+'" target="_blank">@'+item.entities.user_mentions[j].screen_name+'</a>'
        );
        text = text;
      }

      return text;

    }

    function addItemToDom(index, item){
      var div = $("#blueprint").clone().attr("id", "").addClass("index" + index);
      $(".msgtitle", div).html("<h3 data-id="+item.id+"><a href='http://www.twitter.com/#!/"+item.from_user+"' target='_blank'>"+item.from_user+"</a></h3>");
      $(".msgbody", div).html(parseTweet(item));
      $(div).prependTo("#msglist");
    };



    function showList() {
      if(defaults.totalFoundTweets < 20){
        if(defaults.currentPage !== undefined) getTweets();
      }
      defaults.elements++;
      $("#msglist li:not(#blueprint):hidden").last().attr("id", "elem" + defaults.elements).show(1000, function () {
        if (defaults.elements > 4) {
          $("#msglist li#elem" + (defaults.elements - 4)).hide(1, function () {
            $(this).hide();
            $('#msglist').prepend($(this));
          });
        }
      });
    };

    return this.each(function () {
      getTweets();
      window.displayTimerID = window.setInterval(showList, defaults.displaytime);
      $("#pause").bind("click", function () {
        $(this).toggleClass("paused");
        if ($(this).text() == "Anzeige pausieren") {
            $(this).text("Anzeige fortsetzen");
            window.clearInterval(window.displayTimerID);
        } else {
            $(this).text("Anzeige pausieren");
            window.displayTimerID = window.setInterval(showList, defaults.displaytime);
        }
      });
      $("#msglist li").live("mouseover mouseout", function (event) {
          $("#pause").toggleClass("paused");
          if (event.type == 'mouseover') {
              $("#pause").text("Anzeige fortsetzen");
              window.clearInterval(window.displayTimerID);
          } else {
              $("#pause").text("Anzeige pausieren");
              window.displayTimerID = window.setInterval(showList, defaults.displaytime);
          }
      });
    });

  };

  $("#msglist").rePublica();

})(window.jQuery);

