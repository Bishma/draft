var async = require('async');
var express = require('express');
var router = express.Router();
var helpers = require(global.appRoot + '/modules/helpers.js');
var Datastore = require('nedb');
var db = new Object;
db.draft = new Datastore({ filename: 'data/draft.nedb', autoload: true });
db.movie = new Datastore({ filename: 'data/movie.nedb', autoload: true });
db.team = new Datastore({ filename: 'data/team.nedb', autoload: true });
db.value = new Datastore({ filename: 'data/value.nedb', autoload: true });

/* GET home page. */
router.get('/', function(req, res, next) {
    var selection_draft = helpers.currentDraft();

    db['movie'].find( selection_draft ).sort({ release_date: 1 }).exec( function(err, movie_docs) {
        if (err) { console.log("Unable to get movie documents",err); process.exit(1); };
        console.log(movie_docs);

        // get the draft details as well
        db['draft'].findOne( selection_draft ).exec(function(err, draft_doc) {
            if (err) { console.log("Unable to get movie documents",err); process.exit(1); };

            var current_draft = {};
            current_draft.season= selection_draft.season;
            current_draft.year = selection_draft.year;
            current_draft.draft_start = draft_doc.draft_start;
            current_draft.draft_end = draft_doc.draft_end;
            current_draft.season_start = draft_doc.season_start;
            current_draft.season_end = draft_doc.season_end;

            db['team'].find( selection_draft ).exec(function(err, team_docs) {
                res.render('index', { title: 'IDX Movie Draft', movies: movie_docs, current_draft: current_draft, teams: team_docs });
            });
        });
    });
});

// team addtions page
router.get('/team/' + ':id', function(req, res, next) {
    var selection_draft = helpers.currentDraft();
    var team_id = req.params.id;

    db['draft'].findOne( selection_draft ).exec(function (err, draft_doc) {
        if (draft_doc === null) {
            res.render('team', { title: 'Team not found', found: false });
        }
        else {
            db['movie'].find( selection_draft ).sort({ release_date: 1 }).exec( function(err, movie_docs) {
                db['team'].findOne({ _id: team_id }).sort({ release_date: 1 }).exec( function(err, team_doc) {
                    if (team_doc === null) {
                        var found = false;
                        var title = "Team not found";
                    }
                    else {
                        var found = true;
                        var title = team_doc.team_name

                        var owner_list = {};
                        for (var i = 0; i < team_doc.member.length; i++) {
                            // compute total gross for each person in the team
                            team_doc.member[i].total_gross = 0;

                            if (team_doc.member[i].hasOwnProperty('movies')) {
                                for (var j = 0; j < team_doc.member[i].movies.length; j++) {
                                    console.log(team_doc.member[i].movies);
                                    for (var k = 0; k < movie_docs.length; k++) {
                                        if (movie_docs[k]._id == team_doc.member[i].movies[j].movie_id) {
                                            if (movie_docs[k].hasOwnProperty('last_gross')) {
                                                team_doc.member[i].total_gross += parseInt(movie_docs[k].last_gross * (team_doc.member[i].movies[j].percent / 100));
                                            }
                                        }
                                    }

                                    owner_list[team_doc.member[i].movies[j].movie_id] = { 
                                        member_name: team_doc.member[i].name,
                                        bid: team_doc.member[i].movies[j].bid,
                                        percent: team_doc.member[i].movies[j].percent
                                    }
                                }
                            }
                        }
                    }
                    res.render('team', {title: title, found: found, draft: draft_doc, team: team_doc, movies: movie_docs, winner_info: owner_list, show_gross: true });
                });
            });
        }
    });
});

// process form submit from the draft page
router.post('/draft', function(req, res, next) {
    var team_id = req.body.team_id;
    var info = team_id.split('-');
    var draft_season = info[0];
    var draft_year = info[1];
    
    // lets double check that we're in a valid draft
    db['draft'].findOne({ season: draft_season, year: draft_year }).exec(function(err, draft_doc) {
        if (draft_doc == null) {
            res.statusCode = 400;
            res.send({});
        }
        // check to make sure we're in the current drafting period
        else if (false) {
        }
        // draft valid
        else {
            // get team from the information
            db['team'].findOne({ _id: team_id }).exec(function(err, team_doc) {
                if (team_doc == null) {
                    res.statusCode = 400;
                    res.send({});
                }
                else {
                    team_doc.draft_position = parseInt(team_doc.draft_position) + 1;

                    // make sure we have a valid percentage
                    var percent = (req.body.hasOwnProperty(percent)) ? req.body.percent : 100;

                    // find the winning member
                    var winner_found = false;
                    var has_bux = false;
                    for (var i = 0; i < team_doc.member.length; i++) {
                        if (team_doc.member[i]._id == req.body.winner) {
                            winner_found = true;

                            // total the existing bids for this member make sure it's greater than or equal to the bid
                            var total_bux = 100;
                            for (var m = 0; m < team_doc.member[i].movies.length; m++) {
                                total_bux -= parseInt(team_doc.member[i].movies[m].bid);
                            }

                            if (total_bux >= parseInt(req.body.bid)) {
                                team_doc.member[i].movies.push({ movie_id: req.body.movie_id, bid: req.body.bid, percent: percent });
                                has_bux = true;
                            }
                        }
                    }

                    // if final movie then set the team doc value
                    if (parseInt(req.body.final_movie) == 1) {
                        team_doc.draft_complete = true;
                    }
                    
                    // no winner found or winner doesn't have enough money
                    if (!winner_found) {
                        res.statusCode = 404;
                        res.send({});
                    }
                    else if (!has_bux) {
                        res.statusCode = 402;
                        res.send({});
                    }
                    // winner found
                    else {
                        db['team'].update({ _id: team_doc._id }, team_doc, function(err) {
                            if (err) {
                                console.log(err);
                                res.statusCode = 400;
                                res.send({});
                            }
                            else {
                                res.statusCode = 200;
                                res.send({});
                            }
                        });
                    }
                }
            });
        }
    });
});

// this is a sequential route used for drafting
router.get('/draft/' + ':team_id' + '/' + ':movie_number', function(req, res, next) {
    var info = req.params.team_id.split('-');
    var draft_season = info[0];
    var draft_year = info[1];
    var team_id = req.params.team_id;
    var movie_number = parseInt(req.params.movie_number);
    var not_found = [];

    // get the draft doc and make sure it's drafting time
    db['draft'].findOne({ season: draft_season, year: draft_year }).exec(function (err, draft_doc) {
        if (draft_doc === null) {
            res.render('draft', { title: 'Drafting: Draft Not Found', not_found: 'draft' });
        } else {
            // if we have a valid draft
            // find the requested team
            db['team'].findOne({ _id: team_id }).exec(function (err, team_doc) {
                if (team_doc === null) {
                    res.render('draft', { title: 'Drafting: Team Not Found', not_found: 'team' });
                } else {
                    // if we have a valid team
                    // count the total movies this draft
                    db['movie'].count({ season: draft_season, year: draft_year }, function (err, count) {
                        if (err) {
                            res.render('draft', { title: 'Drafting: Movie Not Found', not_found: 'movie' });
                        }

                        var last_movie = count - 1;
                        if (movie_number != last_movie) {
                            var final_movie = 0;
                        }
                        else {
                            var final_movie = 1;
                        }

                        // get the requested movie
                        db['movie'].findOne({ season: draft_season, year: draft_year, order: movie_number }).exec(function (err, movie_doc) {
                            if (movie_doc === null) {
                                res.render('draft', { title: 'Drafting: Movie Not Found', not_found: 'movie' });
                            // if we have a valid movie
                            // render the full page content
                            } else {
                                res.render('draft', { title: 'Drafting: '+movie_doc.name, draft: draft_doc, movie: movie_doc, team: team_doc, not_found: null, movie_number: movie_number, final_movie: final_movie, show_gross: false });
                            }
                        });
                    });
                }
            });
        }
    });
});

// team addtions page
router.get('/add_team', function(req, res, next) {
    var selection_draft = helpers.currentDraft();

    // create a bool to decide if required fields should be highlighted
    if (req.query.hasOwnProperty("required")) {
        var highlight_required = true;
    } else {
        var highlight_required = false;
    }

    res.render('add_team', {title: 'Add a drafting team', current_draft: selection_draft, highlight_required: highlight_required});
});

// add_team processor
router.post('/add_team', function(req, res, next) {
    var required = [
        req.body.team_name,
        req.body.member[0],
        req.body.member[1],
        req.body.member[2]
    ].forEach(function (elm) {
        if (typeof elm != "string" || elm.length == 0) {
            res.statusCode = 400;
            res.send({});
        }
    });

    // there's a number of steps we want to do in series
    async.waterfall([
        async.apply(makeID,req.body),
        checkName,
        translateMembers,
        insertTeam
    ],
    function (errs,final_res) {
        if (errs) { console.log("An error has occured ",errs); process.exit(1); } 

        if (typeof final_res == "object") {
            res.statusCode = 200;
            res.send({});
        }
    });

    // make the teams ID and add it to the body
    function makeID (body, callback) {
        body._id = helpers.makeID([ body.season, body.year, body.team_name ]);

        if (typeof body._id != "string") {
            callback("Did not get string from makeID",null);
        }
        else {
            callback(null,body);
        }
    }

    // check to see if the name is taken
    function checkName (body, callback) {
        db['team'].count({ _id: body._id }).exec(function(err, count) {
            if (err) {
                callback(err,null);
            }
            else if (count !== 0) {
                callback("Team name already exists", null);
            }
            else {
                callback(null,body);
            }
        })
    }

    // turn the members array into an object
    function translateMembers (body, callback) {
        // make the members into objects
        var members = [];
        for (var i = 0; i < 8; i++) {
            // remove empty elements
            if (typeof body.member[i] == 'string' && body.member[i].length != 0) {
                members.push( { _id: helpers.makeID(body.member[i]), name: body.member[i], movies: []} );
            }
        }
        body.member = members;
        callback(null,body);
    }

    // insert into the database
    function insertTeam(body, callback) {
        // one last set, adding draft tracking
        body.draft_position = 0;
        body.draft_complete = false;

        db['team'].insert(body, function(err) {
            if (err) { callback("Unable to insert team into database. " + err, null); process.exit(1); }
        });

        callback(null,body);
    }
});

module.exports = router;
