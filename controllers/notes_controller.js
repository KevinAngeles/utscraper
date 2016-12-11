/* notes_controller.js
 * 
 * This file will control all the operations 
 * associated with notes 
 * 
*/
// Dependencies
var express = require('express');
var router  = express.Router();
var models  = require('../models');
var Article = models.Article;
var Note = models.Note;

// Create a new note
router.post("/notes/:id", function(req, res) {
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
				// Or return a note
					res.send(nt);
				}
			});
		}
	});
});

module.exports = router;