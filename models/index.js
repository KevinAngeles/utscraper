/* index.js 
 *
 * When a folder is required, express will look for
 * a file called "index.js" inside the required folder 
 * 
*/
exports.Article = require("./Article.js");
exports.Note = require("./Note.js");