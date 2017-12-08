/**
 * @author Lukas Dratwa
 *
 * Created on 22.11.2017.
 */
var mongoose = require('mongoose');

var OptimizationObjectiveSchema = new mongoose.Schema({
    high_priority: Number,
    low_priority: Number,
    paint_color_batches: String
});
mongoose.model("OptimizationObjective", OptimizationObjectiveSchema);