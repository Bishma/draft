var Datastore = require('nedb'),
    db = new Datastore({ filename: '../data/movie.nedb', autoload: true }),
    draftDb = new Datastore({ filename: '../data/draft.nedb', autoload: true});
var prompt = require('prompt');
var async = require("async");
var helpers = require("../modules/helpers.js");

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

prompt.start();

// first we need to get an validate the draft selection
prompt.get(draft_schema, function(err,draft) {
    if (err) { console.log("Unable to get prompt response",err); process.exit(1); };

    // look up the draft document
    draftDb.count( draft ).exec(function (err, count) {
        if (err) { console.log("Unable to get search database",err); process.exit(1); };

        // if there are no docs the error out
        if (count !== 1) {
            console.log("Unable to find appropriate draft. Please use the create_draft script first. Docs found: "+count);
            process.exit(1);
        }

        db.find( draft ).sort({ release_date: 1 }).exec(function (err, movie_docs) {
            if (movie_docs.length == 0) { console.log("Did not find any movie documents. ",err); process.exit(1); }

            var edited_movies = [];
            async.eachSeries (movie_docs, function (movie, callback) {
                var movie_schema = {
                    properties: {
                        name: {
                            description: "Movie Name",
                            required: true,
                            default: movie.name
                        },
                        release_date: {
                            description: "US Release Date",
                            pattern: /^20\d{6}$/,
                            message: "YYYYMMDD format",
                            required: true,
                            default: movie.release_date
                        },
                        bom_id: {
                            description: "Box Office Mojo ID",
                            pattern: /.+\.htm$/,
                            message: "BOM IDs end in .htm",
                            required: true,
                            default: movie.bom_id
                        },
                        imdb_id: {
                            description: "IMDb ID",
                            pattern: /^tt/,
                            message: "IMDb IDs start with tt",
                            required: true,
                            default: movie.imdb_id
                        },
                        yt_id: {
                            description: "YouTube trailer ID",
                            required: true,
                            default: movie.yt_id
                        },
                        poster_url: {
                            description: "Poster URL",
                            required: true,
                            default: movie.poster_url
                        },
                    }
                }

                // first we need to get an validate the draft selection
                prompt.get(movie_schema, function(err,movie) {
                    if (err) { console.log("Unable to get prompt response",err); process.exit(1); };

                    // add the season and year
                    movie.season = draft.season;
                    movie.year = draft.year;

                    // predicable id
                    movie._id = helpers.makeID([ draft.season, draft.year, movie.name ]);

                    edited_movies.push(movie);

                    callback(null);
                });
            },
            function (err) {
                if (err) { console.log("An error has occurred. ",err); process.exit(1); };

                // delete the old records in case IDs have changed
                db.remove( draft, { multi: true },function (err, count) {
                    if (err) { console.log("Unable to remove old movies",err); process.exit(1); };

                    // add the random order to the records
                    edited_movies = helpers.addRandomOrderElement(edited_movies);

                    // once removal is done add the edited movies back in
                    db.insert(edited_movies, function(err) {
                        if (err) { console.log("Unable to insert edited movies into draft database. ",err); process.exit(1); };

                        console.log("Movies edited and readded to draft.");
                    });
                });
            });
        });
    });
});
