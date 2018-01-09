/**
 * @author Lukas Dratwa
 *
 * Created on 15.11.2017.
 */
var mongoose = require('mongoose');

var ParameterSchema = new mongoose.Schema({
    standard: Boolean,
    ident: String,
    name: String,
    description: String,
    type: String,
    value: Number,
    orderNr: Number
});
mongoose.model("Parameter", ParameterSchema);