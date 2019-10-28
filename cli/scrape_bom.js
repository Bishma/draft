var https = require('https');
var helpers = require('../modules/helpers.js');
var async = require('async');
var Datastore = require('nedb');
var db = new Object;
var fs = require('fs');
db.draft = new Datastore({ filename: '../data/draft.nedb', autoload: true })
db.movie = new Datastore({ filename: '../data/movie.nedb', autoload: true });
db.value = new Datastore({ filename: '../data/value.nedb', autoload: true });

var current_draft = helpers.currentDraft();
var current_date = helpers.currentDate();

db['movie'].find(current_draft, function(err,movies) {
    // decide which movies to scrape then scrape in a waterfall
    async.waterfall([
        async.apply(determineOpenMovies, movies),
        scrape
    ], function (err, result) {
        if (err) { console.log("waterfall error: ",err); }
        
        db['draft'].update( current_draft, { $set: { last_scrape: current_date }}, {}, function(err, num_updated) {
            if (err) { console.log('Unable to update the last scrape date',err), process.exit(1); }

            console.log('Updated '+num_updated+' draft documents');
        });
    });

    function determineOpenMovies(movies, callback) {
        // these are the movies that are open
        var open_movies = new Array;

        for (var i = 0; i < movies.length; i++) {
            if (current_date >= movies[i].release_date) {
                open_movies.push(movies[i]);
            } 
        }

        console.log('Found '+open_movies.length+' movies to scrape');
        callback(null, open_movies);
    }

    function scrape(open_movies, callback) {
        for (var j = 0; j < open_movies.length; j++) {
            console.log('Scraping '+open_movies[j].name);
            var scrapeDelayer = function(movie) {
                var min = 7;
                var max = 34;
                var seconds = Math.floor((Math.random() * (max - min + 1) + min) * 1000);
                console.log("\t"+seconds+"ms delay");

                setTimeout(function() {
					//set the unique path for this movie
					var movie_path = '/title/' + movie.imdb_id + '/';

                    // set the options for the get request
                    var options = {
                        host: 'www.imdb.com',
                        headers: {'user-agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36'},
                        path: movie_path
                    }

                    https.get(options, function(res) {
                        res.setEncoding('utf8');
                        res.on('data', function (body) {
                            var lines = body.split(/\r?\n/);

                            for (var k = 0; k < lines.length; k++) {
                                (function (movie) {
                                    if (typeof lines[k] == "string" && lines[k].match(/.*Gross USA.*/)) {
                                        var gross = lines[k].replace(/^.*Gross USA.+?\$([0-9,]+).+$/i,"$1");
                                        gross = gross.replace(/\D/g,'');
                                        console.log(movie.name+' gross: '+gross);

                                        movie_doc = {
                                            _id: current_date+'-'+movie._id,
                                            movie_id: movie._id,
                                            scrape_date: current_date,
                                            gross: gross
                                        }

                                        db['value'].count({ _id: movie_doc._id }, function (err, count) {
                                            if (err) { console.log('Unable to insert value doc',err); process.exit(1); }

                                            if (count > 0) {
                                                db['value'].update( { _id: movie_doc._id }, { $set: { gross: gross }}, {}, function(err, num_updated) {
                                                    if (err) { console.log('Unable to update the last scrape date',err), process.exit(1); }
                                                    console.log('Updated the gross for '+num_updated+' value documents');
                                                })
                                            }
                                            else {
                                                db['value'].insert(movie_doc, function(err,newDoc) {
                                                    if (err) { console.log('Unable to insert value doc',err); process.exit(1); }
                                                    console.log('Value document inserted');
                                                });
                                            }
                                        });

                                        db['movie'].update( { _id: movie._id }, { $set: { last_gross: gross }}, {}, function(err, num_updated) {
                                            if (err) { console.log('Unable to update the last scrape date',err), process.exit(1); }

                                            console.log('Updated '+num_updated+' movie documents');

                                            // we write a tracking file. This will automatically cause the server to restart if using nodemon - this is desired behavior
                                            fs.writeFile("../modules/scrape_track.js", "var scrape_track = {}; scrape_track.last_scrape = "+current_date+"; module.exports = scrape_track;", function(err) {
                                                if (err) { console.log(err); }
                                                else { console.log("tracking file updated"); }
                                            });
                                        });
                                    }
                                })(movie);
                            }
                        });
                    }).on('error', function(err) {
                        console.log('error: ',err);
                    });
                },seconds);
            }
            scrapeDelayer(open_movies[j]);
        }

        callback(null,null);
    }
});
