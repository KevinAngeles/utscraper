/* News Scraper project
 * ===============================================
 */

/* Dependencies
 * ============
*/
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require('express-handlebars');
// Models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");
// Scraping tools
var request = require("request");
var cheerio = require("cheerio");
var path = require('path');
// Mongoose mpromise deprecated - use bluebird promises
var promise = require("bluebird");
mongoose.Promise = promise;

// Initialize Express
var app = express();

var portApp = process.env.PORT || 3000;
// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
	extended: false
}));

//set up handlebars
var hbs = exphbs.create({
	// Specify helpers which are only registered on this instance. 
	defaultLayout: 'main'
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.use(express.static(path.join(__dirname, 'public')));

// Database configuration with mongoose
var dbConnection = process.env.MONGODB_URI || "mongodb://localhost/newscraper";
mongoose.connect(dbConnection);
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
	console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
	console.log("Mongoose connection successful.");
});

// Routes
// ======

// A GET request to scrape the echojs website
app.get("/", function(req, res) {
	// First, we grab the body of the html with request
	request("http://www.nytimes.com/", function(error, response, html) {
		// Then, we load that into cheerio and save it to $ for a shorthand selector
		var $ = cheerio.load(html);
		// Now, we grab every h2 within an article tag, and do the following:
		$("article").each(function(i, element) {
			// Save an empty result object
			var result = {};
			// Add the text and href of every link, and save them as properties of the result object
			result.title = $(this).children("h2.story-heading").children("a").text();
			result.link = $(this).children("h2.story-heading").children("a").attr("href");
			result.summary = $(this).children("p.summary").text();
			var problemsDetected = false;
			if( result.summary == null || result.summary == "" )
				problemsDetected = true;
			// Using our Article model, create a new entry
			// This effectively passes the result object to the entry (and the title and link)
			var entry = new Article(result);
			if(!problemsDetected)
			{
				// Now, save that entry to the db
				entry.save(function(err, doc) {
					// Log any errors
					if (err) console.log(err);
				});
			}
		});
		Article
		.find()
		.populate('note')
		.exec(function(er, articles) {
			if (er) throw er;
			// return a json with articles and notes
			var arts = articles.reverse();
			var articleArr = [];
			// Grab the articles as a json
			for (var i = 0; i < arts.length; i++) {
				// Display the apropos information on the page
				var articleTxt = "<p data-id='" + arts[i]._id + "'><a href='" + arts[i].link +"'>" + arts[i].title + "</a><br />" + arts[i].summary + "<br />";
				if( arts[i].hasOwnProperty("note") )
				{
					arts[i]["note"].forEach(
						function(note)
						{
							articleTxt = articleTxt + "Notes: " + note["body"] + "<br />" + "</p>";
						}
					);
				}
				articleArr.push(articleTxt);
			}
			res.render('index', { articles:articleArr });
		});
	});
	// Tell the browser that we finished scraping the text
});

// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
	// // find every article with their respective notes array
	Article
		.find()
		.populate('note')
		.exec(function(err, articles) {
			if (err) throw err;
			// return a json with articles and notes
			res.json(articles.reverse());
		});
});

// Grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {
	// Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
	Article.findOne({ "_id": req.params.id })
	// ..and populate all of the notes associated with it
	.populate('note')
	// now, execute our query
	.exec(function(error, doc) {
		// Log any errors
		if (error) {
			console.log(error);
		}
		// Otherwise, send the doc to the browser as a json object
		else {
			res.json(doc);
		}
	});
});

// Create a new note
app.post("/articles/:id", function(req, res) {
	// Create a new note and pass the req.body to the entry
	var newNote = new Note(req.body);
	// And save the new note the db
	newNote.save(function(error, note) {
		// Log any errors
		if (error) {
			console.log(error);
		}
		// Otherwise
		else {
			// Use the article id to find and update its notes
			Article.findOneAndUpdate(
				{ "_id": req.params.id },
				{ $push: { note: note._id } },
				{ safe: true, new : true }
			)
			// Execute the above query
			.exec(function(err, nt) {
				// Log any errors
				if (err) {
					console.log(err);
				}
				else {
				// Or send the document to the browser
					res.send(nt);
				}
			});
		}
	});
});

/* ERROR HANDLER */
// =============
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Listen on port 3000
app.listen(portApp, function() {
	console.log("App running on port " + portApp + "!");
});
