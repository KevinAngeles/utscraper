// Require mongoose
var mongoose = require("mongoose");
// Create Schema class
var Schema = mongoose.Schema;
// Create article schema
var ArticleSchema = new Schema({
	// title is a required string
	title: {
		type: String,
		required: true
	},
	// link is a required string
	link: {
		type: String,
		unique: true,
		required: true
	},
	summary: {
		type: String,
		required: true
	},
	// This saves an array of note's ObjectId, ref refers to the Note model
	note: [{
		type: Schema.Types.ObjectId,
		ref: "Note"
	}]
});
// Create the Article model with the ArticleSchema
var Article = mongoose.model("Article", ArticleSchema,"Article");
// Export the model
module.exports = Article;