/**
 * @author Lukas Dratwa
 *
 * Created on 22.11.2017.
 */
var mongoose = require('mongoose');

var DataSetSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    ratios: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ratio" }],
    vehicles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" }]
});
mongoose.model("DataSet", DataSetSchema);