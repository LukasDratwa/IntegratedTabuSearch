var express = require('express');
var router = express.Router();
var formidable = require('formidable');
var fs = require('fs');
var mongoose = require('mongoose');

var Parameter = mongoose.model('Parameter');

router.post('/fileupload', function(req, res, next) {
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        // upload is the name of the file-input-form
        fs.readFile(files.upload.path, function(err, data) {
            res.write(data);
            res.end();
        });
    });
});

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Iterated Tabu Search' });
});

router.get('/angular', function(req, res, next) {
    res.render('angular', { title: 'Iterated Tabu Search' });
});

router.get('/parameter', function (req, res, next) {
    var parameter = new Parameter(req.body);
    /*var parameter = new Parameter({
        "name": "test",
        "description": "test",
        "type": "Integer",
        "value": 1
    });*/


    parameter.save(function(err, param) {
        if(err) {
            console.log(err);
        }
        res.write(param);
        res.end();
    });
});

router.get('/datatest', function(req,res){
    res.json([{"id": 1, "name": "Mymm", "city": "Pantano do Sul"},
        {"id": 2, "name": "Skyble", "city": "Guilmaro"},
        {"id": 3, "name": "Tagfeed", "city": "Gnosjö"},
        {"id": 4, "name": "Realcube", "city": "Jrashen"},
        {"id": 5, "name": "Bluejam", "city": "Zhangjiawo"},
        {"id": 6, "name": "Jayo", "city": "Obonoma"},
        {"id": 7, "name": "Cogidoo", "city": "Sungsang"},
        {"id": 8, "name": "Avavee", "city": "Diawara"},
        {"id": 9, "name": "Tagtune", "city": "Monywa"},
        {"id": 10, "name": "Centimia", "city": "Retkovci"}]);
});

module.exports = router;