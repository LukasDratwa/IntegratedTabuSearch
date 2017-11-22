/**
 * @author Lukas Dratwa
 *
 * Created on 22.11.2017.
 */
var mongoose = require('mongoose');

var VehicleSchema = new mongoose.Schema({
    dateString: String,
    seqRank: Number,
    ident: String,
    paintColor: Number,
    activatedFeatures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Feature" }],
    dataSetRef: String
});
mongoose.model("Vehicle", VehicleSchema);