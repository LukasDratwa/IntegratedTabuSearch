/**
 * @author Lukas Dratwa
 *
 * Created on 22.11.2017.
 */
var mongoose = require('mongoose');

var OptimizationObjectiveSchema = new mongoose.Schema({
    rank: Number,
    name: String
});
mongoose.model("OptimizationObjective", OptimizationObjectiveSchema);