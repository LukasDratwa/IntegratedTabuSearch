var tabuController = angular.module('integratedTabuSearchApp', []);

function getRandomNumber(min, max) {
    return Math.floor((Math.random() * (max + 1)) + min);
}

function getMinOfPair(first, second) {
    if(first <= second) {
        return first;
    } else {
        return second;
    }
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


    this.getNextPaintGroupVehicle = function(vehicle) {
        var foundParamVehicle = false;

        for(var i in this.vehicles) {
            var v = this.vehicles[i];

            if(v._id === vehicle._id) {
                foundParamVehicle = true;
            }

            if(foundParamVehicle && v.paintColor != vehicle.paintColor) {
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

    this.updateActViolations = function() {
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
        var counterPaintGroups = 0;
        while(nextPaintGroupVehicle != null) {
            counterPaintGroups++;
            var restPaintGroupSize = nextPaintGroupVehicle.sizePaintGroup;

            while(restPaintGroupSize > paramLota.value) {
                restPaintGroupSize = restPaintGroupSize - paramLota.value;
                this.actColorViolations++;
            }

            nextPaintGroupVehicle = this.getNextPaintGroupVehicle(nextPaintGroupVehicle);
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

    this.obligatoryUpdateAfterEveryMove = function() {
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


        console.log("Performed obl. update after every move", this);
    };
    this.obligatoryUpdateAfterEveryMove();
    this.updateActViolations();

    this.insertVehicle = function(index, vehicle) {
        this.vehicles.splice(index, 0, vehicle);
        this.obligatoryUpdateAfterEveryMove();
        return this;
    };

    this.swapVehicles = function(firstIndex, secondIndex) {
        var tmpVehicle = this.vehicles[firstIndex];
        this.vehicles[firstIndex] = this.vehicles[secondIndex];
        this.vehicles[secondIndex] = this.vehicles[firstIndex];
        this.obligatoryUpdateAfterEveryMove();
        return this;
    };

    this.getIndexOfVehicleInS = function(vehicle) {
        for(var i in this.vehicles) {
            var tmp = this.vehicles[i];
            if(vehicle._id === tmp._id) {
                return tmp;
            }
        }

        return null;
    };
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

        result.push({
            activatedFeatures: cloneActivatedFeatures(v.activatedFeatures),
            dateString: v.dateString,
            ident: v.ident,
            orderNr: v.orderNr,
            paintColor: v.paintColor,
            seqRank: v.seqRank,
            _id: v._id,
            dataSetRef: v.dataSetRef
        });
    }

    return result;
}

function costFunctionG(s) {
    // Chapter 2.2.1: g(s) = f(s) + z * t(s)
    // --> f(s) = a * c(s) + b * FOR EVERY r: dr(s) + y * FOR EVERY r: dr(s)
    // ------> c(s) = number of colour changes; dr(s) = number of constraint violations
    // --> t(s) = number of paint constraint violations

    /** IMPORTANT NOTES
     * "At each iteration, the value of z is multiplied by 2 if the current solution is infeasible, and divided
     * by 2 otherwise." --> To get a mix of feasible and infeasible solutions.
     */
}

/**
 * Only a subset of all potential exchanges is considered through sampling.
 *
 * @param s - a given solution
 * @param iterationCounter - the actual iteration counter
 */
function getNeighbourhood(s, iterationCounter) {
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

        // Consider only if condition applies
        for(var j in s.vehicles) {
            var verhicleJ = s.vehicles[j];

            if(i != j && vehicleI.lockArray[j] == iterationCounter % eta) {
                // Re-assign random number
                vehicleI.lockArray[i] = getRandomNumber(0, eta - 1);
                console.log("Would look at: " + i + " " + j);
            }
        }
    }

    // Only swap a pair if you improve the current solution

    /* Re-Inserting into previous position is forbidden for o (Theta) iterations
    * --> If swapped, re-inserting is forbidden either (of both cars in both old positions)
    * --> Insertion is allowed, if this would lead to a better solution with lower costs
    * -----> Each car v has for every position i a value lambda vi, which is representing the cost of the best solution
    *        found during the search in which car v appeared in position i
    * -----> Swaps are only allowed if this criterion is met for both cars
    */


    neighbourhood.push(s); // FIXME delete me
    return neighbourhood;
}

// To escape a local optimum and reach new good solutions
function continuousDiversification() {
    /*
     * Insertion leads to worse solution
     * --> g(s) = g(s) + h(s) + p(s)
     * ----> h(s) = SQUARE(n) * SELECT ONE:
     *          1. number of times a car has moved from i to j
     *          2. number of times a car has moved from it's current position
     *       ---> Select multiplier method in every performed tabu search (TODO random?!)
     *       To penalize (bestrafen) frequently performed moves
     * ----> p(s) = 0 IF vi.color == vj.color && vi.paintGroupSize < vj.paintGroupSize
     *            = 0 IF vi.color == vj+1.color && vi.paintGroupSize < vj+1.paintGroupSize
     *            ELSE = a * PSI (i)
     *       Encourage the creation of big paint groups while satisfying l
     *
     *       We should point out that this term is considered only when it is theoretically possible to reduce the
     *       number of groups of cars of a given colour. This is not always the case since the number of groups in
     *       the current solution may already be equal to the lowest feasible number of groups.
     *
     */
}


function PertubationMechanisms() {
    this.randomSwaps = function() {

    };

    this.randomShufflingWithinSubSeq = function() {

    };

    this.mirrorTransformingOfSubSeq = function() {

    };

    this.randomMoveOfSubSeq = function() {

    };

    this.reinsertionOfPaintGroups = function() {

    };

    this.applyImprovingAndPiNeutralSwaps = function() {

    };

    this.performPertubation = function(solution) {
        return solution;
    };

    /* Pertubation is applied in 3a
     *
     * After every pertubation the parameters a, b and y are modified. Three different configurations:
     *  - f1 = (10^6, 10^3, 1)
     *  - f2 = (10^4, 10^2, 1)
     *  - f3 = 10^4, 10^4, 1)
     * Following structure is used: (f1, f2, f1, f3, f1, f2, ...)
     */
}

function solutionSatisfiesAcceptanceCriterion() {
    /*
     * - If f1 or f2 was used in the pertuabation and if a better solution in 3b was found, it replaces
     *   the current solution
     * - If f3 ... TODO ?!
     */

    return false;
}

function performTabuSearch(solution, iterationCounter) {
    var neighbourhood = getNeighbourhood(solution, iterationCounter);

    return neighbourhood[0];
}


function performIteratedTabuSearch(s) {
    var sImproved, sImprovedCosts, sCurrent, sLocalOptimum;
    var paramSet = s.parameterSet;
    var iterationCounter = 1;
    var pertubationMechanism = new PertubationMechanisms();

    // 1. Init
    var s0 = s;

    // 2. Apply tabu search on s0 to obtain improved solution sImproved
    sImproved = performTabuSearch(s0, iterationCounter);

    // 3. Perform till no improvement of f(s) since k (Kappa) iterations
    var iterationsWithoutImprovement = 0;
    while(iterationsWithoutImprovement < paramSet.getParamWithIdent("k").value - 1) {
        iterationCounter++;

        // a) Apply pertubation on sImproved to obtain sCurrent
        sCurrent = pertubationMechanism.performPertubation(sImproved);

        // b) Apply tabu search on sCurrent to obtain sLocalOptimum
        sLocalOptimum = performTabuSearch(sCurrent, iterationCounter);

        // c) If sLocalOptimum satisfies the acceptance criterion set it to sImproved
        if(solutionSatisfiesAcceptanceCriterion(sLocalOptimum)) {
            sImproved = sLocalOptimum;
            iterationsWithoutImprovement = 0;
        } else {
            iterationsWithoutImprovement++;
        }
    }

    // 4. Return the best found solution
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
            console.log("Solution ", s);
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