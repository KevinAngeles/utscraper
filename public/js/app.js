// Whenever someone clicks a p tag
$(document).on("click", "p", function() {
	// Empty the notes from the note section
	$("#notes").empty();
	// Save the id from the p tag
	var thisId = $(this).attr("data-id");
	// Now make an ajax call for the Article
	$.ajax({
		method: "GET",
		url: "/articles/" + thisId
	})
	// With that done, add the note information to the page
	.done(function(data) {
		console.log(data);
		// The title of the article
		$("#notes").append("<h2>" + data.title + "</h2>");
		// An input to enter a new title
		$("#notes").append("<input id='titleinput' name='title' >");
		// A textarea to add a new note body
		$("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
		// A button to submit a new note, with the id of the article saved to it
		$("#notes").append("<button data-id='" + data._id + "' id='savenote'>Save Note</button>");
		// If there's a note in the article
		if ( data.hasOwnProperty("note") ) {
			var noteString = "";
			data.note.forEach(function(note){
				noteString = noteString + "<p>" + note.body + "</p>"
			});
			$("#bodyinput").val(noteString);
		}
	});
});
// When you click the savenote button
$(document).on("click", "#savenote", function() {
	// Grab the id associated with the article from the submit button
	var thisId = $(this).attr("data-id");
	var bodyTxt = $("#titleinput").val();
	// Run a POST request to change the note, using what's entered in the inputs
	$.ajax({
		method: "POST",
		url: "/notes/" + thisId,
		data: {
			// Value taken from title input
			body: bodyTxt
		}
	})
	// With that done
	.done(function(data) {
		// Log the response
		console.log(data);
		// Update the section
		$("#bodyinput").val($("#bodyinput").val()+"<p>" + bodyTxt + "</p>");
		// Also, remove the values entered in the input and textarea for note entry
		$("#titleinput").val("");
	});
});