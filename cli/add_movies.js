var Datastore = require('nedb'),
    db = new Datastore({ filename: '../data/movie.nedb', autoload: true }),
    draftDb = new Datastore({ filename: '../data/draft.nedb', autoload: true});
var prompt = require('prompt');
var async = require("async");
var helpers = require("../modules/helpers");

// this governs the user prompts and valid responses
var draft_schema = {
    properties: {
        season: {
            description: "Season (summer/winter)",
            pattern: /^(summer|winter)$/i,
            message: '"summer" or "winter"',
            required: true,
            before: function (input) {
                return input.toLowerCase();
            }
        },
        year: {
            description: "Year (YYYY)",
            pattern: /^20\d{2}$/,
            message: "Four digit year only",
            required: true
        }
    }
}

var movie_schema = {
    properties: {
        name: {
            description: "Movie Name",
            required: true
        },
        release_date: {
            description: "US Release Date",
            pattern: /^20\d{6}$/,
            message: "YYYYMMDD format",
            required: true
        },
        bom_id: {
            description: "Box Office Mojo ID",
            pattern: /.+\.htm$/,
            message: "BOM IDs end in .htm",
            required: true
        },
        imdb_id: {
            description: "IMDb ID",
            pattern: /^tt/,
            message: "IMDb IDs start with tt",
            required: true
        },
        poster_url: {
            description: "Poster URL",
            required: true
        },
        yt_id: {
            description: "YouTube trailer ID",
            required: true
        },
        done: {
            description: "Finished with draft? (Y/N)",
        }
    }
}

prompt.start();

console.log("This will add the movies to an existing draft.");
console.log("This will overwrite any existing movie list on the draft.");

// an array to hold all the movies as we loop though prompts
var movies = [];

// this (when true) will end the movie addition loop
var entry_done = false;

// first we need to get an validate the draft selection
prompt.get(draft_schema, function(err,draft) {
    if (err) { console.log("Unable to get prompt response",err); process.exit(1); };

    // look up the draft document
    draftDb.count( draft, function (err, count) {
        if (err) { console.log("Unable to get search database",err); process.exit(1); };
        
        // if there are no docs the error out
        if (count !== 1) {
            console.log("Unable to find appropriate draft. Please use the create_draft script first. Docs found: "+count);
            process.exit(1);
        }

        // because I don't have time to write a full management system ATM we just delete all existing movies in this draft
        db.remove(draft, { multi: true }, function (err, count) {
            if (err) { console.log("Unable to remove old movies",err); process.exit(1); };
        });
    });

    // loop until we're have our done criteria
    // then run the callback to write the info to the movie doc
    async.until(
        function() {
            return entry_done;
        }, function(callback) {
            prompt.get(movie_schema, function (err,movie) {
                if (err) { callback("Unable to get search database - "+err,null); };
       
                if (movie.done == 'y' || movie.done == 'Y')
                    entry_done = true;

                // remove the done mark
                delete movie.done;

                // add the season and year
                movie.season = draft.season;
                movie.year = draft.year;

                // predicable id
                movie._id = helpers.makeID([ draft.season, draft.year, movie.name ]);

                // add the movie to the movies array
                movies.push(movie);

                // a little formatting and output
                console.log("    -Movies so far: "+movies.length+"\n");

                callback(null,movies);
            });
        }, function(err,movies) {
            // add order to movies array
            movies = helpers.addRandomOrderElement(movies);
            console.log(movies);

            db.insert(movies, function(err) {
                if (err) { console.log("Unable to insert movies into draft database: ",err); process.exit(1); };

                console.log("Movies added to draft.");
            });
        }
    );
});
