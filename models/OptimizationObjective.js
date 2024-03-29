/**
 * @author Lukas Dratwa
 *
 * Created on 22.11.2017.
 */
var mongoose = require('mongoose');

var OptimizationObjectiveSchema = new mongoose.Schema({
    high_priority: Number,
    low_priority: Number,
    high_low_priority: Number,
    paint_color_batches: Number,
    orderArray: [String],
    orderDisplayingNames: [String]
});
mongoose.model("OptimizationObjective", OptimizationObjectiveSchema);