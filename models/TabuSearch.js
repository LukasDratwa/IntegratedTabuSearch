/**
 * @author Lukas Dratwa
 *
 * Created on 08.12.2017.
 */
var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate')(mongoose);

var TabuSearchSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    dataset: { type: mongoose.Schema.Types.ObjectId, ref: "DataSet" },
    optObjective: { type: mongoose.Schema.Types.ObjectId, ref: "OptimizationObjective" },
    parameters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Parameter" }]
});

TabuSearchSchema.plugin(deepPopulate, {});
mongoose.model("TabuSearch", TabuSearchSchema);