var helpers = {};

// get the current date in YYYYMMDD format
helpers.currentDate = function() {
    return (new Date()).toISOString().slice(0,10).replace(/-/g,"");
}

// get the current draft
helpers.currentDraft = function() {
    return { season: "winter", year: "2019" };
}

// take an array, make them id/url friendly, then concat with a hyphen
helpers.makeID = function(thing) {
    if (typeof thing == "string") {
        thing = [ thing ];
    }
    else if (!Array.isArray(thing)) {
        return false;
    }

    for (var i = 0; i < thing.length; i++) {
        thing[i] = thing[i].replace(/\s+/g,"_").replace(/[^a-zA-Z0-9_]/,"");
    }
    return thing.join('-');
}

helpers.addRandomOrderElement = function (movies) {
    function shuffle (a) {
        var j, x, i;
        for (i = a.length; i; i -= 1) {
            j = Math.floor(Math.random() * i);
            x = a[i - 1];
            a[i - 1] = a[j];
            a[j] = x;
        }

        return a;
    }
    
    // first make an array of orders the same size
    var movie_order = new Array;
    for (var i = 0; i < movies.length; i++) {
        movie_order.push(i);
    }
    movie_order = shuffle(movie_order);
    
    for (var i = 0; i < movies.length; i++) {
        movies[i].order = movie_order[i];
    }

    return movies;
}

module.exports = helpers;
