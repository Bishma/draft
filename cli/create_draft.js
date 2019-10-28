var Datastore = require('nedb')
  , db = new Datastore({ filename: '../data/draft.nedb', autoload: true });
var prompt = require('prompt');

// this governs the user prompts and valid responses
var schema = {
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
        },
        draft_start: {
            description: "Drafting Starts (YYYYMMDD)",
            pattern: /^20\d{6}$/,
            message: "YYYYMMDD format.",
            required: true
        },
        draft_end: {
            description: "Drafting Ends (YYYYMMDD)",
            pattern: /^20\d{6}$/,
            message: "YYYYMMDD format.",
            required: true
        },
        season_start: {
            description: "Season Starts (YYYYMMDD)",
            pattern: /^20\d{6}$/,
            message: "YYYYMMDD format.",
            required: true
        },
        season_end: {
            description: "Season Ends (YYYYMMDD)",
            pattern: /^20\d{6}$/,
            message: "YYYYMMDD format.",
            required: true
        }
    }
};

prompt.start();

// welocome the people
console.log("Hello and welcome to new draft setup. We'll just need to answer a few questions\n");

prompt.get(schema, function(err,result) {
    // @todo err to error.log
    if (err) { console.log("Unable to get prompt response",err); process.exit(1); };

    // lets see if the specified draft exists
    db.find({ season: result.season, year: result.year }, function (err, docs) {
        if (err) { console.log("Unable to get search database",err); process.exit(1); };

        // check to see if there's aleady a draft for this season and year
        if (docs.length != 0) {
            console.log("There is already a draft for this season and year. Overwrite (and lose movie list)? (Y/N)");

            // prompt to see if we should overwrite the existing season information
            prompt.get(['overwrite'], function (err,ynresp) {
                if (err) { console.log("Unable to get search database",err); process.exit(1); };

                // if we got a yes prompt then add the ID we found so the DB knows to replace instead of add new
                if (ynresp.overwrite === 'y' || ynresp.overwrite === 'Y') {
					db.remove({season:result.season,year:result.year},{multi:true},function(err,numRemoved) {
						if (err || !numRemoved) {console.log("Unable to remove old draft",err?err:"");process.exit(1);}
						db.persistence.compactDatafile();
						db.insert(result,function(err,resp) {
							if (err) {console.log("Unable to get insert new draft",err);process.exit(1);}
						});
					});
					console.log("Draft replaced. God speed. You'll need it.");
                } else {
                    // if we got something other than a yes response then we stop insertion
                    console.log("Draft creation halted.");
                }
            });
        } else {
            db.insert(result,function(err,resp) {
                if (err) { console.log("Unable to get insert new draft",err); process.exit(1); };
        
                console.log("Draft created. All hail George Lucas, king of the pizza buffet.");
            });
        }
    });
});

