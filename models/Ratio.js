/**
 * @author Lukas Dratwa
 *
 * Created on 22.11.2017.
 */
var mongoose = require('mongoose');

var RatioSchema = new mongoose.Schema({
    ratio: String,
    prio: Number,
    ident: String
});
mongoose.model("Ratio", RatioSchema);