/* articles_controller.js
 * 
 * This file will control all the operations 
 * associated with articles 
 * 
*/
// Dependencies
var express = require('express');
var router  = express.Router();
var models  = require('../models');
var Article = models.Article;
var Note = models.Note;
// Scraping tools
var request = require("request");
var cheerio = require("cheerio");

// A GET request to scrape the new york times website and save the news into the db
router.get("/", function(req, res) {
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
});

// This will get the articles we scraped from the mongoDB
router.get("/articles", function(req, res) {
	// find every article with their respective notes array
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
router.get("/articles/:id", function(req, res) {
	// Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
	Article.findOne({ "_id": req.params.id })
	// ..and populate all of the notes associated with it
	.populate('note')
	// now, execute the query
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

module.exports = router;