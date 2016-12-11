/* News Scraper project
 * ===============================================
 */

/* Dependencies
 * ============
*/
var express = require("express");
var path = require('path');
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require('express-handlebars');
// Models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");
// Mongoose mpromise deprecated - use bluebird promises
var promise = require("bluebird");
mongoose.Promise = promise;

// Initialize Express
var app = express();

// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

//set up handlebars
var hbs = exphbs.create({
	// Specify helpers which are only registered on this instance. 
	defaultLayout: 'main'
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

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

/* Model Controllers 
 * app.use(base_route,controller_name) is a middleware that will prepend 
 * the base route base_route (in this case '/') to all the routes inside controller_name
 * controller_name returns a Router object with the routes 
 */
var articles_controller = require('./controllers/articles_controller');
var notes_controller = require('./controllers/notes_controller');
app.use('/', articles_controller);
app.use('/', notes_controller);

module.exports = app;