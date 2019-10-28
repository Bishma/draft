# Movie Draft Happy Fun Time <>
_Build a roster of upcoming films and compete for the highest gross earnings._

## What is a movie draft?
First, full credit to [Night Attack/NSFW Show](http://nightattack.tv/), [Diamond Club](http://diamondclub.tv/), and [Chat Relm](http://chatrelm.net). The idea of a movie draft is not my own; I simply wrote some software to help my coworkers and I conduct our own.

A movie draft is something like a fantasy sports draft… or so I’m told. Generally, there are two drafts per year: the Summer Block Buster Season and the Winter Oscar Bait Season. A group of friends get together with equal amounts of fake money to buy upcoming movies in an auction. Roughly 30 movies are generally included in the draft, and players bid to purchase them. The goal is to have the highest income from your owned movies using U.S. domestic grosses, ending two weeks after the final movie is released. This implementation is rather U.S.-centric.

## General Info
* There are 2 drafts per year:
  * Summer Blockbuster: Usually kicking off in May
  * Winter Oscar Bait: Usually kicking off in October
* Approximately 30 movies should be chosen per draft.
* Groups of 4–6 players are best, given the number of movies.
* The order of movies is randomized prior to drafting.
* Each week the (domestic) film grosses are updated using Box Office Mojo.
* The game ends 14 days after the final movie is released.

## Rules Per Team
* Drafting takes 1–2 hours and should occur sometime during the 2 weeks prior to the first film’s release.
* Each player gets 100 “Draft Bucks” used to bid on a major film studio release from the current season.
  * Each player has at most $100 to spend on all their combined purchases; they may not exceed $100.
* Films are put up for auction one at a time in random order to all players.
* Bidding on a film is open while its trailer plays. Players should speak loudly so that bids are heard during the video.
* Vigorous discussion is encouraged (and is a large part of the fun).
* Should the bidding for any film reach $100, players may continue bidding for a lower percentage of that film’s gross.
  * “I bid $100 at 70%” means the film's domestic gross would be multiplied by 0.7 before being applied to the player’s total. A subsequent bid of “$100 at 65%” would take the lead because the player is accepting less of the film’s gross total toward their score.
  * Players must reach $100 bids before bidding down the percentage.
  * Players who do not have $100 may not participate in percentage bidding.
* If multiple groups are playing (each an independent draft), the winners of each group will compete by drafting efficiency (total Adjusted Gross per Draft Buck spent). The group winner who also has the best efficiency will get ultimate bragging rights.
* If a large group (8–12) wants to play, players may pair up.

# Installation
Install Node.js
Fork the repo
```
git clone <...>
cd draft
npm install
```

# Setup
Insert draft and movie information into the database with CLI scripts prior to running the server.
Example:
```
cd draft/cli
node create_draft.js
```

## create_draft.js
Inserts a movie draft game in the database. You'll need to enter the season (`summer` or `winter`), the year, and the dates that the different phases start and stop.

## add_movies.js
Adds movies to an existing draft. This is the most time-consuming part. You'll need to have the following for each film:
* Title
* Release date
* Box Office Mojo ID
  * _Note: Due to changes by Box Office Mojo, this ID is deprecated. It is saved but never used in this app; you may enter any string ending with “.htm” to pass this requirement (e.g.“title.htm”)._
* IMDb ID
* YouTube ID for the film’s trailer
* Poster image URL

## edit_movies.js
Prompts for an existing draft, then cycles through the draft's movies one field at a time to make changes as desired.

#### Special Note
NeDB persists in memory, so you may need to restart the app (provided it was running) after using the CLI scripts.

# Running
Launch the server:
```
npm start
```

This is an app built on [Express](http://expressjs.com/). Like most Express apps, it defaults to port 3000 for development. To run on port 80 for production, you will need root permissions and run the server with the port environment variable:
```
PORT=80 npm start
```

I also recommend using nodemon to keep the app running and automatically restarting when monitored files are edited.
