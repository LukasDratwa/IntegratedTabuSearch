var tabuController = angular.module('integratedTabuSearchApp', []);

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getMinOfPair(first, second) {
    if(first <= second) {
        return first;
    } else {
        return second;
    }
}

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffleArray(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
}

function getSubArray(array, start, end) {
    if(!end){
        end=-1;
    }

    return array.slice(start, array.length+1-(end*-1));
}

function ParameterSet(parameters) {
    this.parameters = parameters;

    this.getParamWithIdent = function(ident) {
        for(var i in this.parameters) {
            if(this.parameters[i].ident === ident) {
                return this.parameters[i];
            }
        }

        return null;
    };

    this.getWeightSet = function(number) {
        if(number < 1 || number > 3) {
            console.warn("The requested weight set should be in [1, 3]!");
        }

        var result = [];

        switch(number) {
            case 3:
                result.push(this.getParamWithIdent("a1"));
                result.push(this.getParamWithIdent("b1"));
                result.push(this.getParamWithIdent("y1"));
                break;

            case 2:
                result.push(this.getParamWithIdent("a2"));
                result.push(this.getParamWithIdent("b2"));
                result.push(this.getParamWithIdent("y2"));
                break;

            default:
            case 1:
                result.push(this.getParamWithIdent("a3"));
                result.push(this.getParamWithIdent("b3"));
                result.push(this.getParamWithIdent("y3"));
                break;
        }

        return result;
    }
}

function RatioSet(ratios) {
    this.ratios = ratios;

    this.getRatioIntValues = function(ratio) {
        var result = [];
        var splitted = ratio.ratio.split("/");
        result.push(parseInt(splitted[0]));
        result.push(parseInt(splitted[1]));

        return result;
    };

    this.countRatioInSubSeq = function(ratio, subSeq) {
        var counter = 0;

        for(var i in subSeq) {
            var vehicle = subSeq[i];

            activatedFeatureLoop: for(var x in vehicle.activatedFeatures) {
                if(vehicle.activatedFeatures[x].ident === ratio.ident) {
                    counter++;
                    break activatedFeatureLoop;
                }
            }
        }

        return counter;
    }
}

var Helper = function(vehicles) {
    this.vehicles = [];

    for(var i in vehicles) {
        var newV = {
            _id: vehicles[i]._id,
            movedFromCurrentToPositionArray: [],

            countMovesFromPositionToAnyOther: function(fromIndex) {
                var result = 0;

                for(var i in this.movedFromCurrentToPositionArray[fromIndex]) {
                    result += this.movedFromCurrentToPositionArray[fromIndex][i];
                }

                return result;
            },

            initMovedFromCurrentToPositionArray: function() {
                this.movedFromCurrentToPositionArray = [];

                for(var o=0; o<vehicles.length; o++) {
                    var toPositionArray = [];
                    for(var z=0; z<vehicles.length; z++) {
                        toPositionArray.push(0);
                    }
                    this.movedFromCurrentToPositionArray.push(toPositionArray);
                }
            }
        };
        newV.initMovedFromCurrentToPositionArray();
        this.vehicles.push(newV);
    }

    this.registerMove = function(_id, indexFrom, indexTo) {
        this.getVehicleWithId(_id).movedFromCurrentToPositionArray[indexFrom][indexTo] += 1;
    };

    this.getVehicleWithId = function(_id) {
        for(var i in this.vehicles) {
            if(this.vehicles[i]._id === _id) {
                return this.vehicles[i];
            }
        }

        return null;
    };
};

var solutionCounter = 0;
function Solution(vehicles, parameters, ratios) {
    this.vehicles = cloneVehicles(vehicles);
    this.parameterSet = new ParameterSet(parameters);
    this.ratioSet = new RatioSet(ratios);

    this.actColorChanges = 0;
    this.actColorViolations = 0;
    this.actLowPrioViolations = 0;
    this.actHighPrioViolations = 0;
    this.actLowPrioViolationsExtended = [];
    this.actHighPrioViolationsExtended = [];
    this.solutionNr = solutionCounter++;

    this.solutionHasDuplicatedVehicles = function() {
        for(var i in this.vehicles) {
            var orderNr = this.vehicles[i];

            var foundOrderNumbers = 0 ;
            for(var z in this.vehicles) {
                if(this.vehicles[z].orderNr == orderNr) {
                    foundOrderNumbers++;
                }
            }

            if(foundOrderNumbers > 1) {
                return true;
            }
        }

        return false;
    };

    this.printOrderNrOfVehicleSubSeq = function(startIndex, endIndex) {
        var order = "";
        var counter = 0;
        for(var i=startIndex; i<=endIndex; i++) {
            order += this.vehicles[i].orderNr + " ";
            counter++;
        }
        console.log("[startI: " + startIndex + ", endI:" + endIndex + ", length:" + counter + "]: " + order);
        return order;
    };

    this.printOrderNrOfVehicles = function() {
        this.printOrderNrOfVehicleSubSeq(0, this.vehicles.length-1);
    };

    this.getIndexOfVehicleInS = function(vehicle) {
        for(var i in this.vehicles) {
            var tmp = this.vehicles[i];
            if(vehicle._id === tmp._id) {
                return parseInt(i);
            }
        }
        return null;
    };

    this.getNextPaintGroupVehicle = function(vehicle) {
        for(var i=this.getIndexOfVehicleInS(vehicle)+1; i<this.vehicles.length; i++) {
            var v = this.vehicles[i];

            if(typeof v !== "undefined" && v.paintColor != vehicle.paintColor) {
                return v;
            }
        }

        return null;
    };

    this.getSubSeq = function(startIndex, length) {
        var result = [];

        for(var i=startIndex; i<startIndex+length; i++) {
            if(result.length == length) {
                break;
            }

            if(i <= this.vehicles.length-1) {
                var vehicle = this.vehicles[i];
                result.push(vehicle);
            }
        }

        return result;
    };

    this.updateActViolations = function(moveId) {
        // 1. Count color changes
        var lastColor = -1;
        for(var i in this.vehicles) {
            var v = vehicles[i];

            if(lastColor == -1) {
                lastColor = v.paintColor;
                continue;
            }

            if(v.paintColor != lastColor) {
                this.actColorChanges++;
            }

            lastColor = v.paintColor;
        }

        // 2. Calc color violations
        var paramLota = this.parameterSet.getParamWithIdent("l");
        var nextPaintGroupVehicle = this.vehicles[0];
        var lastCheckedIndex = this.getIndexOfVehicleInS(nextPaintGroupVehicle);
        var counterPaintGroups = 0;
        while(nextPaintGroupVehicle != null) {
            counterPaintGroups++;
            var restPaintGroupSize = nextPaintGroupVehicle.sizePaintGroup;

            while(restPaintGroupSize > paramLota.value) {
                restPaintGroupSize = restPaintGroupSize - paramLota.value;
                this.actColorViolations++;
            }

            nextPaintGroupVehicle = this.getNextPaintGroupVehicle(nextPaintGroupVehicle);

            // FIXME From time to time the loop is stucked when following indexorder (f.e.) is analyzed: 8, 9, 8, 9, ...
            if(nextPaintGroupVehicle != null && this.getIndexOfVehicleInS(nextPaintGroupVehicle) < parseInt(lastCheckedIndex)) {
                console.warn("-----> Had to break counting of paint group (" + moveId
                    + ", duplicated v in s: " + this.solutionHasDuplicatedVehicles() + ", Indexes: "
                    + this.getIndexOfVehicleInS(nextPaintGroupVehicle) + " (now) < " + lastCheckedIndex + " (last checked)"
                    + " sNr: " + this.solutionNr + ")", this);
                this.printOrderNrOfVehicles();
                break;
            }

            lastCheckedIndex = nextPaintGroupVehicle != null ? this.getIndexOfVehicleInS(nextPaintGroupVehicle) : lastCheckedIndex;
        }
        // console.log("Checked " + counterPaintGroups + " paint groups");

        // 3. Calc low priority violations && 4. Calc high priority violations
        for(var i in this.ratioSet.ratios) {
            var ratio = this.ratioSet.ratios[i];

            // [0] = nr = max amount of features in pr; [1] = pr = length of sub sequence
            var ratioValues = this.ratioSet.getRatioIntValues(ratio);

            for(var x in this.vehicles) {
                var vehicle = this.vehicles[x];

                var subSequence = this.getSubSeq(x, ratioValues[1]);
                var endIndex = parseInt(x) + ratioValues[1] - 1;

                if(subSequence.length == ratioValues[1]) {
                    var amountOfActivatedRatioInSubSeq = this.ratioSet.countRatioInSubSeq(ratio, subSequence);

                    if(amountOfActivatedRatioInSubSeq > ratioValues[0]) {
                        if(ratio.prio == 0) {
                            // High priority ratio
                            this.actHighPrioViolations++;
                            this.actHighPrioViolationsExtended.push([parseInt(x), endIndex])
                        } else {
                            // Low priority ratio
                            this.actLowPrioViolations++;
                            this.actLowPrioViolationsExtended.push([parseInt(x), endIndex])
                        }
                    }
                }
            }
        }
    };

    this.obligatoryUpdateAfterEveryMove = function(moveId) {
        // 1. Every car should know how big their colour-group is
        var carsToUpdate = [];
        var actPaintGroupColour = -1;
        var paintGroupCounter = 1;

        for(var i in this.vehicles) {
            var v = this.vehicles[i];

            if(v.paintColor != actPaintGroupColour) {
                actPaintGroupColour = v.paintColor;

                for(var x in carsToUpdate) {
                    var index = carsToUpdate[x];
                    this.vehicles[index].sizePaintGroup = paintGroupCounter;
                }

                paintGroupCounter = 1;
                carsToUpdate = [];

                // Special case that the next car will be too in another colour
                if(i < this.vehicles.length-1 && this.vehicles[parseInt(i)+1].paintColor != actPaintGroupColour) {
                    v.sizePaintGroup = 1;
                } else if(i < this.vehicles.length-1 && this.vehicles[parseInt(i)+1].paintColor == actPaintGroupColour) {
                    // Fix that the first car of every paint group wasn't updated
                    carsToUpdate.push(i);
                }

                // Special case that the last car is alone in its paint group
                if(i == this.vehicles.length-1 && carsToUpdate.length == 0) {
                    v.sizePaintGroup = 1;
                }
            } else {
                carsToUpdate.push(i);
                paintGroupCounter++;
            }
        }

        if(carsToUpdate.length > 0) {
            for(var x in carsToUpdate) {
                var index = carsToUpdate[x];
                this.vehicles[index].sizePaintGroup = paintGroupCounter;
            }
        }
        // EOF 1.

        this.updateActViolations(moveId);
        // console.log("Performed obl. update after every move", this);
    };
    this.obligatoryUpdateAfterEveryMove("INIT UPDATE");

    this.addMovingProhibition = function(indexTo, vehicle) {
        if(typeof vehicle.movingProhibitions === "undefined") {
            vehicle.movingProhibitions = [];
        }

        vehicle.movingProhibitions.push(new MovingProhibition(indexTo, this.parameterSet.getParamWithIdent("o").value));
    };

    this.hasActiveMovingProhibitionForIndex = function(index, movingProhibitions) {
        for(var i in movingProhibitions) {
            var mP = movingProhibitions[i];

            if(mP.toIndex == index && mP.restTheta > 0) {
                return true;
            }
        }

        return false;
    };

    this.isInsertAllowed = function(index, vehicle) {
        if(index == this.getIndexOfVehicleInS(vehicle)) {
            return false;
        }

        if(this.hasActiveMovingProhibitionForIndex(index, vehicle.movingProhibitions)) {
            return false;
        } else {
            return true;
        }
    };

    this.isSwapAllowed = function(firstIndex, secondIndex) {
        if(firstIndex == secondIndex) {
            return false;
        }

        var firstV = this.vehicles[firstIndex];
        var secondV = this.vehicles[secondIndex];

        if(this.isInsertAllowed(secondIndex, firstV) && this.isInsertAllowed(firstIndex, secondV)) {
            return true;
        } else {
            return false;
        }
    };

    this.insertVehicle = function(index, vehicle) {
        index = parseInt(index);

        var vehicleOldIndex = this.getIndexOfVehicleInS(vehicle);
        this.addMovingProhibition(index, vehicle);

        /*console.log("-------- Start Insertion [iFrom: " + vehicleOldIndex + ", iTo: " + index
            + ", sNr: " + this.solutionNr + ", orderNr1: " + vehicle.orderNr + ", orderNr2: "
            + this.vehicles[index].orderNr + "]");
        this.printOrderNrOfVehicles();*/

        // from in tmp speichern
        if(vehicleOldIndex < index) {
            var tmp = vehicle;

            for(var i=vehicleOldIndex+1; i<this.vehicles.length; i++) {
                this.vehicles[i-1] = this.vehicles[i];

                if(i == index) {
                    this.vehicles[i] = tmp;
                    break;
                }
            }
        } else {
            var tmp = vehicle;

            for(var i=vehicleOldIndex-1; i>=0; i--) {
                this.vehicles[i+1] = this.vehicles[i];

                if(i == index) {
                    this.vehicles[i] = tmp;
                    break;
                }
            }
        }
        //this.printOrderNrOfVehicles();
        // console.log("-------- End Insertion");

        // TODO comment if not needed anymore
        if(this.solutionHasDuplicatedVehicles()) {
            console.warn("INSERT " + vehicleOldIndex + " -> " + index + ": Duplicated vehicles in solution!");
            this.printOrderNrOfVehicles();
        }
        this.obligatoryUpdateAfterEveryMove("INSERTION");

        return this;
    };

    this.swapVehicles = function(firstIndex, secondIndex, addMovingProhibition) {
        firstIndex = parseInt(firstIndex);
        secondIndex = parseInt(secondIndex);

        if(addMovingProhibition) {
            this.addMovingProhibition(secondIndex, this.vehicles[firstIndex]);
            this.addMovingProhibition(firstIndex, this.vehicles[secondIndex]);
        }

        /*console.log("-------- Start Swap [iFrom: " + firstIndex + ", iTo: " + secondIndex
            + ", sNr: " + this.solutionNr + ", orderNr1: " + this.vehicles[firstIndex].orderNr + ", orderNr2: "
            + this.vehicles[secondIndex].orderNr + "]");
        this.printOrderNrOfVehicles();*/
        var tmpVehicle = this.vehicles[firstIndex];
        this.vehicles[firstIndex] = this.vehicles[secondIndex];
        this.vehicles[secondIndex] = tmpVehicle;
        /*this.printOrderNrOfVehicles();
        console.log("-------- End Swap");*/

        if(this.vehicles[firstIndex].orderNr == this.vehicles[secondIndex].orderNr) {
            console.warn("SWAP " + firstIndex + " <-> " + secondIndex + ": Duplicated vehicles in solution!");
            this.printOrderNrOfVehicles();
        }

        this.obligatoryUpdateAfterEveryMove("SWAP");
        return this;
    };

    this.updateAspirationCriterion = function(indexNow, costFunctionValue) {
        if(this.vehicles.aspirationCriterionArray[indexNow] == -1
            || this.vehicles.aspirationCriterionArray[indexNow] > costFunctionValue) {
            this.vehicles.aspirationCriterionArray[indexNow] = costFunctionValue;
        }
    };

    this.aspirationCriterionSatisfiedForInsert = function(indexFrom, indexTo, costFunctionValue) {
        var aspCriterionValue = this.vehicles[indexFrom].aspirationCriterionArray[indexTo];

        if(aspCriterionValue != -1 && aspCriterionValue < costFunctionValue) {
            return true;
        }
    };

    this.aspirationCriterionSatisfiedForSwap = function(indexFrom, indexTo, costFunctionValue) {
        if(this.aspirationCriterionSatisfiedForInsert(indexFrom, indexTo, costFunctionValue)
            && this.aspirationCriterionSatisfiedForInsert(indexTo, indexFrom, costFunctionValue)) {
            return true;
        } else {
            return false;
        }
    };
}

function MovingProhibition(toIndex, theta) {
    this.toIndex = toIndex;
    this.restTheta = theta;
}

function Iteration() {

}

function cloneActivatedFeatures(activatedFeatures) {
    var result = [];

    for(var i in activatedFeatures) {
        var f = activatedFeatures[i];

        result.push({
            dataSetRef: f.dataSetRef,
            ident: f.ident,
            prio: f.prio,
            ratio: f.ratio,
            _id: f._id
        });
    }

    return result;
}

function cloneVehicles(vehicles) {
    var result = [];

    for(var i in vehicles) {
        var v = vehicles[i];

        var newVehicle = {
            activatedFeatures: cloneActivatedFeatures(v.activatedFeatures),
            dateString: v.dateString,
            ident: v.ident,
            orderNr: v.orderNr,
            paintColor: v.paintColor,
            seqRank: v.seqRank,
            _id: v._id,
            dataSetRef: v.dataSetRef,
            movingProhibitions: v.movingProhibitions,
            aspirationCriterionArray: []
        };

        for(var j=0; j<vehicles.length; j++) {
            newVehicle.aspirationCriterionArray.push(-1);
        }

        result.push(newVehicle);
    }

    return result;
}

// To escape a local optimum and reach new good solutions
var continuousDiversificationValue = 0; // TODO Ask if this value should be resetted after every tabu search
function increaseContinuousDiversificationValue(s, indexFrom, indexTo, helper, hFunctionNumber, weightSetNumber) {
    /*
     * Method will return h(s) + p(s) and set it to 'continuousDiversificationValue'
     *
     * Insertion leads to worse solution
     * --> g(s) = g(s) + h(s) + p(s)
     * ----> h(s) = SQUARE(n) * SELECT ONE:
     *          1. number of times a car has moved from i to j
     *          2. number of times a car has moved from it's current position
     *       ---> Select multiplier method in every performed tabu search (TODO random?!)
     *       To penalize (bestrafen) frequently performed moves
     * ----> p(s) = 0 IF vi.color == vj.color && vi.paintGroupSize < vj.paintGroupSize
     *            = 0 IF vi.color == vj+1.color && vi.paintGroupSize < vj+1.paintGroupSize
     *            ELSE = alpha * Psi
     *       Encourage the creation of big paint groups while satisfying l
     *
     *       We should point out that this term is considered only when it is theoretically possible to reduce the
     *       number of groups of cars of a given colour. This is not always the case since the number of groups in
     *       the current solution may already be equal to the lowest feasible number of groups.
     */
    var h = 0;
    if(hFunctionNumber == 1) {
        h = Math.sqrt(s.vehicles.length)
            * helper.getVehicleWithId(s.vehicles[indexFrom]._id).movedFromCurrentToPositionArray[indexFrom][indexTo];
    } else {
        h = Math.sqrt(s.vehicles.length)
            * helper.getVehicleWithId(s.vehicles[indexFrom]._id).countMovesFromPositionToAnyOther(indexFrom);
    }

    var p = 0;
    var vehicleFrom = s.vehicles[indexFrom];
    var vehicleTo = s.vehicles[indexTo];

    var vehicleToNext = (indexTo < s.vehicles.length-1) ? s.vehicles[parseInt(indexTo) + 1] : null;

    if(vehicleFrom.paintColor == vehicleTo.paintColor && vehicleFrom.sizePaintGroup < vehicleTo.sizePaintGroup
        || vehicleToNext != null
            && vehicleFrom.paintColor == vehicleToNext.paintColor && vehicleFrom.sizePaintGroup < vehicleToNext.sizePaintGroup) {
        p = 0;
    } else {
        var alpha = s.parameterSet.getWeightSet(weightSetNumber)[0];
        var psi = s.parameterSet.getParamWithIdent("i");
        p = alpha.value * psi.value;
    }

    continuousDiversificationValue += (h + p);

    return continuousDiversificationValue;
}

function costFunctionF(s, numOfWeightSet) {
    // f(s) = a * c(s) + b * FOR EVERY r: dr(s) + y * FOR EVERY r: dr(s)
    // ------> c(s) = number of colour changes; dr(s) = number of constraint violations
    var weightSet = s.parameterSet.getWeightSet(numOfWeightSet);
    var alpha = weightSet[0].value;
    var beta = weightSet[1].value;
    var gamma = weightSet[2].value;

    return alpha * s.actColorChanges + beta * s.actHighPrioViolations + gamma * s.actLowPrioViolations;
}

function costFunctionG(s, numOfWeightSet) {
    // Chapter 2.2.1: g(s) = f(s) + z * t(s)
    // --> f(s) = a * c(s) + b * FOR EVERY r: dr(s) + y * FOR EVERY r: dr(s)
    // ------> c(s) = number of colour changes; dr(s) = number of constraint violations
    // --> t(s) = number of paint constraint violations

    /** IMPORTANT NOTES
     * "At each iteration, the value of Zeta (z) is multiplied by 2 if the current solution is infeasible, and divided
     * by 2 otherwise." --> To get a mix of feasible and infeasible solutions.
     */
    var zetaValue = s.parameterSet.getParamWithIdent("z").value;
    if(s.actColorViolations > 0) {
        zetaValue = zetaValue * 2;
    } else {
        zetaValue = zetaValue / 2;
    }

    var costFunctionFValue = costFunctionF(s, numOfWeightSet);
    var result = costFunctionFValue + zetaValue * (s.actColorViolations) + continuousDiversificationValue;
    s.actCostFunctionGResult = result;
    s.actCostFunctionFResult = costFunctionFValue;

    return result;
}

/*
 * Only a subset of all potential exchanges is considered through sampling.
 *
 * @param s - a given solution
 * @param iterationCounter - the actual iteration counter
 * @param numOfWeightSet - the number of the weight set to select / use
 */
function getNeighbourhood(s, iterationCounter, numOfWeightSet, helper, hFunctionNumber) {
    var neighbourhood = [];

    // 1. Assign each pair of positions (i, j) an integer µij in [0, n-1] ([0, Eta-1]) and in each iteration t, consider
    //    this pair only if µij = t (mod n) <--> (mod Eta)
    //    --> Eta = min {n, 200}
    //    --> Re-assign µij every Eta iterations (when the pair was considered)
    var etaMax = s.parameterSet.getParamWithIdent("n");
    var eta = getMinOfPair(s.vehicles.length, etaMax.value);

    // Init of the lock array
    for(var i in s.vehicles) {
        var vehicleI = s.vehicles[i];

        if(typeof vehicleI.lockArray === "undefined") {
            vehicleI.lockArray = [];

            for(var j in s.vehicles) {
                vehicleI.lockArray.push(getRandomNumber(0, eta - 1));
            }
        }
    }

    for(var i in s.vehicles) {
        var vehicleI = s.vehicles[i];

        var length = typeof vehicleI.movingProhibitions !== "undefined" ? vehicleI.movingProhibitions.length : "undefined";
        // console.log(vehicleI.ident + " ----------> Moving prohibitions: " + length)

        // Consider only if condition applies
        for(var j in s.vehicles) {
            if(i != j && vehicleI.lockArray[j] == iterationCounter % eta) {

                // Re-assign random number
                vehicleI.lockArray[i] = getRandomNumber(0, eta - 1);

                // Generate neighbour solution
                // TODO Always do both moving methods if possible?
                // console.log("Would look at: " + i + " " + j);
                var newNeighbourhoodSolutionInsertion = new Solution(s.vehicles, s.parameterSet.parameters, s.ratioSet.ratios);
                if(newNeighbourhoodSolutionInsertion.isInsertAllowed(j, newNeighbourhoodSolutionInsertion.vehicles[i])) {
                    // Perform insertion
                    newNeighbourhoodSolutionInsertion.insertVehicle(j, newNeighbourhoodSolutionInsertion.vehicles[i]);
                    var costFunctionValue = costFunctionG(newNeighbourhoodSolutionInsertion, numOfWeightSet);
                    neighbourhood.push(newNeighbourhoodSolutionInsertion);

                    // For 2.2.4 Continuous diversification --> register moves and adapt 'continuousDiversificationValue'
                    helper.registerMove(vehicleI._id, i, j);
                    if(typeof hFunctionNumber != "undefined" && hFunctionNumber != -1 && costFunctionValue > s.actCostFunctionGResult) {
                        increaseContinuousDiversificationValue(s, i, j, helper, hFunctionNumber, numOfWeightSet);
                    }
                } else {
                    // Check for "Attribute based aspiration criterion (2.2.3)
                }

                // TODO Moving prohibitions from inserting are not in the second new solution object (swap)

                var newNeighbourhoodSolutionSwap = new Solution(s.vehicles, s.parameterSet.parameters, s.ratioSet.ratios);
                if(newNeighbourhoodSolutionSwap.isSwapAllowed(i, j)) {
                    // For 2.2.4 Continuous diversification --> register moves
                    helper.registerMove(newNeighbourhoodSolutionSwap.vehicles[i]._id, i, j);
                    helper.registerMove(newNeighbourhoodSolutionSwap.vehicles[j]._id, j, i);

                    // Perform swap
                    newNeighbourhoodSolutionSwap.swapVehicles(i, j, true);
                    var costFunctionValue = costFunctionG(newNeighbourhoodSolutionSwap, numOfWeightSet);

                    // Only add the swapped neighbour solution if it's better than the current one
                    if(newNeighbourhoodSolutionSwap.actCostFunctionGResult < s.actCostFunctionGResult) {
                        neighbourhood.push(newNeighbourhoodSolutionSwap);
                    }
                } else {
                    // Check for "Attribute based aspiration criterion (2.2.3)
                }
            }
        }

        /* Re-Inserting into previous position is forbidden for o (Theta) iterations
        * --> If swapped, re-inserting is forbidden either (of both cars in both old positions)
        * --> Insertion is allowed, if this would lead to a better solution with lower costs
        * -----> Each car v has for every position i a value lambda vi, which is representing the cost of the best solution
        *        found during the search in which car v appeared in position i
        * -----> Swaps are only allowed if this criterion is met for both cars
        */
        // Reduce the moving prohibition of every car
        if(typeof vehicleI !== "undefined") {
            for(var z in vehicleI.movingProhibitions) {
                var movingP = vehicleI.movingProhibitions[z];

                if(movingP.restTheta > 1) {
                    movingP.restTheta = movingP.restTheta-1;
                } else {
                    vehicleI.movingProhibitions.splice(parseInt(z), 1); // FIXME could cause errors?
                }
            }
        }
    }

    return neighbourhood;
}

function PertubationMechanisms() {
    this.randomSwaps = function(s) {
        var chi = s.parameterSet.getParamWithIdent("x");

        for(var i=0; i<chi.value; i++) {
            var randomI = getRandomNumber(0, s.vehicles.length-1);
            var randomJ = getRandomNumber(0, s.vehicles.length-1);

            while(randomI == randomJ) {
                var randomI = getRandomNumber(0, s.vehicles.length-1);
                var randomJ = getRandomNumber(0, s.vehicles.length-1);
            }

            s.swapVehicles(randomI, randomJ, false);
        }
    };

    this.randomShufflingWithinSubSeq = function(s) {
        var tau = s.parameterSet.getParamWithIdent("t");
        var randomStartIndex = getRandomNumber(0, s.vehicles.length - tau.value);

        // Shuffle sub sequence randomly
        //console.log("----------- PERTUBATION RANDOM SHUFFLING -----------");
        //s.printOrderNrOfVehicleSubSeq(randomStartIndex, randomStartIndex + tau.value - 1);
        for(var x=0; x<50; x++) {
            var randomI = getRandomNumber(randomStartIndex, randomStartIndex + tau.value - 1);
            var randomJ = getRandomNumber(randomStartIndex, randomStartIndex + tau.value - 1);

            while(randomI == randomJ) {
                var randomI = getRandomNumber(randomStartIndex, randomStartIndex + tau.value - 1);
                var randomJ = getRandomNumber(randomStartIndex, randomStartIndex + tau.value - 1);
            }

            s.swapVehicles(randomI, randomJ, false);
        }
        //s.printOrderNrOfVehicleSubSeq(randomStartIndex, randomStartIndex + tau.value - 1);
        //console.log("----------- EOF PERTUBATION RANDOM SHUFFLING -----------");
    };

    this.mirrorTransformingOfSubSeq = function(s) {
        var tau = s.parameterSet.getParamWithIdent("t");

        var randomStartIndex = getRandomNumber(0, s.vehicles.length - tau.value);
        var subSeqEndIndex = randomStartIndex + tau.value - 1;

        var iterationsToPerform = tau.value;
        if(iterationsToPerform % 2 == 1) {
            iterationsToPerform--;
        }

        //console.log("----------- PERTUBATION MIRROR TRANSFORMING -----------");
        //s.printOrderNrOfVehicleSubSeq(randomStartIndex, randomStartIndex + tau.value - 1);
        for(var z=0; z<iterationsToPerform/2; z++) {
            var i = randomStartIndex+z;
            var j = subSeqEndIndex-z;

            s.swapVehicles(i, j, false);
        }
        //s.printOrderNrOfVehicleSubSeq(randomStartIndex, randomStartIndex + tau.value - 1);
        //console.log("----------- EOF PERTUBATION MIRROR TRANSFORMING -----------");
    };

    this.moveSubsequence = function(s, subSeqStartIndex, subSeqEndIndex, insertAfterIndex) {
        var newOrder = [];
        if(insertAfterIndex < subSeqStartIndex) {
            console.log("first");
            // Insert all cars untouched till (inclusive) insertAfterIndex
            for(var i=0; i<=insertAfterIndex; i++) {
                newOrder.push(s.vehicles[i]);
            }

            // Add subSeq
            for(var i=subSeqStartIndex; i<=subSeqEndIndex; i++) {
                newOrder.push(s.vehicles[i]);
            }

            // Add rest
            for(var i=insertAfterIndex+1; i<=s.vehicles.length-1; i++) {
                if(i < subSeqStartIndex || i > subSeqEndIndex) {
                    newOrder.push(s.vehicles[i]);
                }
            }
        } else {
            console.log("second");
            // Add all cars from the left
            for(var i=0; i<subSeqStartIndex; i++) {
                newOrder.push(s.vehicles[i]);
            }

            // All cars after the sub seq till the insertAfterIndex (incl)
            for(var i=subSeqEndIndex+1; i<=insertAfterIndex; i++) {
                newOrder.push(s.vehicles[i]);
            }

            // Add sub seq
            for(var i=subSeqStartIndex; i<=subSeqEndIndex; i++) {
                newOrder.push(s.vehicles[i]);
            }

            // Add end (all vehicles after insertAfterIndex)
            for(var i=insertAfterIndex+1; i<=s.vehicles.length-1; i++) {
                newOrder.push(s.vehicles[i])
            }
        }
        s.vehicles = newOrder;
        s.obligatoryUpdateAfterEveryMove();
    };

    this.removingAndReinsertionOfPaintGroups = function(s) {
        // Pick random vehicle and get indexes of this consecutive color group
        var initRandomIndex = getRandomNumber(0, s.vehicles.length-1);
        var paintGroupStartIndex = initRandomIndex;
        var paintGroupEndIndex = initRandomIndex;
        var randomV = s.vehicles[initRandomIndex];

        // Search start index
        for(var i=initRandomIndex-1; i>=0; i--) {
            if(s.vehicles[i].paintColor == randomV.paintColor) {
                paintGroupStartIndex = i;
            } else {
                break;
            }
        }

        // Search end index
        for(var i=initRandomIndex+1; i<=s.vehicles.length-1; i++) {
            if(s.vehicles[i].paintColor == randomV.paintColor) {
                paintGroupEndIndex = i;
            } else {
                break;
            }
        }

        // Get i outside this group
        var i = getRandomNumber(0, s.vehicles.length-1);
        while(i >= paintGroupStartIndex && i <= paintGroupEndIndex) {
            i = getRandomNumber(0, s.vehicles.length-1);
        }

        // Find j >= i, where the car in j and j+1 have different colors
        var foundJ = -1;
        for(var j=i; j<=s.vehicles.length-1; j++) {
            if(j != s.vehicles.length-1) {
                if(s.vehicles[j].paintColor != s.vehicles[j+1].paintColor) {
                    foundJ = j;
                    break;
                }
            }
        }

        // If j was found, insert the color group between j and j+1
        if(foundJ != -1) {
            /*console.log("----------- PERTUBATION RANDOM MOVE SUB SEQ -----------");
            s.printOrderNrOfVehicles();
            s.printOrderNrOfVehicleSubSeq(randomStartIndex, randomStartIndex + tau.value - 1);
            console.log("Will be inserted after orderNr: " + s.vehicles[insertAfterIndex].orderNr);*/
            this.moveSubsequence(s, paintGroupStartIndex, paintGroupEndIndex, j);
            /*s.printOrderNrOfVehicles();
            console.log("----------- EOF PERTUBATION RANDOM MOVE SUB SEQ -----------");*/
        } else {
            console.warn("Couldn't find j within permutation: removal and reinsertion of paint group! No p. performed!");
        }
    };

    this.applyImprovingAndPiNeutralSwaps = function(s) {

    };

    this.randomMoveOfSubSeq = function(s) {
        var tau = s.parameterSet.getParamWithIdent("t");
        var randomStartIndex = getRandomNumber(0, s.vehicles.length - tau.value);
        var subSeqEndIndex = randomStartIndex + tau.value - 1;
        var insertAfterIndex = randomStartIndex; // Just that while loop is triggered initially

        while(insertAfterIndex >= randomStartIndex-1 && insertAfterIndex <= subSeqEndIndex) {
            insertAfterIndex = getRandomNumber(0, s.vehicles.length-1);
        }

        /*console.log("----------- PERTUBATION RANDOM MOVE SUB SEQ -----------");
        s.printOrderNrOfVehicles();
        s.printOrderNrOfVehicleSubSeq(randomStartIndex, randomStartIndex + tau.value - 1);
        console.log("Will be inserted after orderNr: " + s.vehicles[insertAfterIndex].orderNr);*/
        this.moveSubsequence(s, randomStartIndex, subSeqEndIndex, insertAfterIndex);
        /*s.printOrderNrOfVehicles();
        console.log("----------- EOF PERTUBATION RANDOM MOVE SUB SEQ -----------");*/
    };

    this.performPertubation = function(solution) {
        /*switch(getRandomNumber(0, 5)) {
            case 0:
                this.randomSwaps(solution);
                break;

            case 1:
                this.randomShufflingWithinSubSeq(solution);
                break;

            case 2:
                this.mirrorTransformingOfSubSeq(solution);
                break;

            case 3:
                this.randomMoveOfSubSeq(solution);
                break;

            case 4:
                this.reinsertionOfPaintGroups(solution);
                break;

            case 5:
                this.applyImprovingAndPiNeutralSwaps(solution);
                break;
        }*/

        this.removingAndReinsertionOfPaintGroups(solution);

        return solution;
    };
}

function performTabuSearch(solution, iterationCounter, numOfWeightSet, helper) {
    // Perform before every search:
    solution.aspirationCriterionArray = [];
    for(var i in helper.vehicles) {
        // console.log(helper.vehicles[i].countMovesFromPositionToAnyOther(i));
    }
    continuousDiversificationValue = 0;

    // For 2.2.4 Continuous diversification --> Select random hFunctionNumber
    var hFunctionNumber = getRandomNumber(1, 2);

    var neighbourhood = getNeighbourhood(solution, iterationCounter, numOfWeightSet, helper, hFunctionNumber);

    var bestS = null;
    for(var i in neighbourhood) {
        if(bestS == null) {
            bestS = neighbourhood[i];
        } else if(neighbourhood[i].actCostFunctionFResult < bestS.actCostFunctionFResult){ // TODO Ask - with g or f function?!
            bestS = neighbourhood[i];
        }
    }

    return bestS;
}

var tookF3LastTime = true;
function getNextWeightSetNumber(iterationCounter) {
    /* Pertubation is applied in 3a
     *
     * After every pertubation the parameters a, b and y are modified. Three different configurations:
     *  - f1 = (10^6, 10^3, 1)
     *  - f2 = (10^4, 10^2, 1)
     *  - f3 = 10^4, 10^4, 1)
     * Following structure is used: (f1, f2, f1, f3, f1, f2, ...)
     */

    if(iterationCounter % 2 == 0) {
        // Take f1
        return 1;
    } else {
        // take f2 or f3
        if(tookF3LastTime) {
            tookF3LastTime = false;
            return 2;
        } else {
            tookF3LastTime = true;
            return 3;
        }
    }
}

function performIteratedTabuSearch(s) {
    var sImproved, sCurrent, sLocalOptimum, sBestSolution;
    var paramSet = s.parameterSet;
    var iterationCounter = 1;
    var pertubationMechanism = new PertubationMechanisms();
    var startingTimestamp = new Date();
    var helper = new Helper(s.vehicles);
    var logSolCostValues = false;

    // 1. Init
    var s0 = s;
    costFunctionG(s0, 1);
    console.log(s0);
    if(logSolCostValues) {
        console.log("Initial s: g=" + s.actCostFunctionGResult + "; f=" + s.actCostFunctionFResult);
    }

    // 2. Apply tabu search on s0 to obtain improved solution sImproved
    sImproved = performTabuSearch(s0, iterationCounter, 1, helper);
    sBestSolution = sImproved;
    if(logSolCostValues) {
        console.log("Improved s: g=" + sBestSolution.actCostFunctionGResult + "; f=" + sBestSolution.actCostFunctionFResult);
    }

    // 3. Perform till no improvement of f(s) since k (Kappa) iterations
    var iterationsWithoutImprovement = 0;
    var secondCaseOfAcceptanceCriterionWasMatched = false;
    var secondCaseOfAcceptanceCriterionWasMatchedSImprovedSave = null;
    while(iterationsWithoutImprovement < paramSet.getParamWithIdent("k").value - 1) {
        iterationCounter++;

        // Select numOfWeightSet
        var numOfWeightSet = getNextWeightSetNumber(iterationCounter);

        console.log("###### ITERATION " + iterationCounter + " (Without impr.: " + iterationsWithoutImprovement
            + "; Weighset: " + numOfWeightSet + ") ######");

        // a) Apply pertubation on sImproved to obtain sCurrent
        sCurrent = pertubationMechanism.performPertubation(sImproved);


        // b) Apply tabu search on sCurrent to obtain sLocalOptimum
        sLocalOptimum = performTabuSearch(sCurrent, iterationCounter, numOfWeightSet, helper);
        // console.log("new costs sLocalOpt: g=" + sLocalOptimum.actCostFunctionGResult + "; f=" + sLocalOptimum.actCostFunctionFResult);

        // Update best found solution
        if(sLocalOptimum != null && sLocalOptimum.actCostFunctionFResult < sBestSolution.actCostFunctionFResult) {
            sBestSolution = sLocalOptimum;
            iterationsWithoutImprovement = 0;

            if(logSolCostValues) {
                console.log("Found new best s: g=" + sBestSolution.actCostFunctionGResult + "; f=" + sBestSolution.actCostFunctionFResult);
            }
        } else {
            iterationsWithoutImprovement++;
        }

        // c) If sLocalOptimum satisfies the acceptance criterion set it to sImproved
        if(sLocalOptimum != null) {
            /*
             * - If f1 or f2 was used in the pertuabation and if a worse solution (than the best one) in 3b was found,
             *   it will replace the current solution
             * - SECOND CASE: If f3 was used in the pertuabation and if a better solution (than the best) in 3b was found,
             *   it will NOT directly replace the current solution
             *   --> Next pertubation with sLocalOptimum
             *   --> If acceptance criterion will not be satisfied, continue with old sImproved
             */
            if(numOfWeightSet == 1 || numOfWeightSet == 2) {
                // TODO really accept if the f function value is bigger than the best found solution?
                if(sLocalOptimum.actCostFunctionFResult > sBestSolution.actCostFunctionFResult) {
                    sImproved = sLocalOptimum;

                    secondCaseOfAcceptanceCriterionWasMatched = false;
                    secondCaseOfAcceptanceCriterionWasMatchedSImprovedSave = null;
                } else if(secondCaseOfAcceptanceCriterionWasMatched) {
                    // Was not satisfied, return to old s
                    secondCaseOfAcceptanceCriterionWasMatched = false;
                    sImproved = secondCaseOfAcceptanceCriterionWasMatchedSImprovedSave;
                    secondCaseOfAcceptanceCriterionWasMatchedSImprovedSave = null;
                }
            } else {
                if(sLocalOptimum.actCostFunctionFResult < sBestSolution.actCostFunctionFResult) {
                    secondCaseOfAcceptanceCriterionWasMatched = true;
                    secondCaseOfAcceptanceCriterionWasMatchedSImprovedSave = sImproved;
                    sImproved = sLocalOptimum;
                }
            }
        }

        if(iterationCounter == 20) {
            break;
        }
    }

    console.log("Calculation time needed: " + (new Date().valueOf() - startingTimestamp.valueOf()));

    // 4. Return the best found solution
    if(logSolCostValues) {
        console.log("Result s: g=" + sBestSolution.actCostFunctionGResult + "; f=" + sBestSolution.actCostFunctionFResult);
    }
    return sImproved;
}

tabuController.controller("integratedTabuSearchController", function ($scope, $http, $location) {
    var id = $location.search().id;
    $scope.performTabuSearch = false;
    $scope.selectedDatasetId = "";
    $scope.datasets = [];
    $scope.standardParameters = [];

    if(typeof id === "string") {
        // Performed Start of tabu search
        $scope.performTabuSearch = true;
        var tabuSearchRequest = $http.get('/gettabusearch?id=' + id);
        tabuSearchRequest.success(function(data) {
            // !! Sort the vehicles
            data.dataset.vehicles.sort(function(a, b) {
                if(a.orderNr > b.orderNr) {
                    return 1;
                } else if(a.orderNr < b.orderNr) {
                    return -1;
                } else {
                    return 0;
                }
            });

            console.log("Start ITS: " , data);

            $scope.standardParameters = data.parameters;
            $scope.dataset = data.dataset;
            $scope.optObjectives = data.optObjective;
            $scope.optObjectivesNames = data.optObjective.orderDisplayingNames;

            var s = new Solution(data.dataset.vehicles, data.parameters, data.dataset.ratios);
            performIteratedTabuSearch(s);
        });
        tabuSearchRequest.error(function(err){
            console.log('Error: ' + err);
        });
    } else {
        // Config add in view
        var datasetRequest = $http.get('/alldatasetids');
        datasetRequest.success(function(data) {
            for(var i in data) {
                $scope.datasets.push(data[i]);
            }
        });
        datasetRequest.error(function(err){
            console.log('Error: ' + err);
        });

        var standardParameterRequest = $http.get('/standardparameters');
        standardParameterRequest.success(function(data) {
            for(var i in data) {
                $scope.standardParameters.push(data[i]);
            }

            console.log("StandardParameters " , $scope.standardParameters);
        });
        standardParameterRequest.error(function(err){
            console.log('Error: ' + err);
        });
    }
});