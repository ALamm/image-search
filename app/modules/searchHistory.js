module.exports = function (req,res) {
    
    var mongoose = require('mongoose');
    
	var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    
    var collection = db.collection("history");
    
//    var result = {};
    
    collection.find({},{ _id: 0, term: 1, when: 1}).toArray(function (err,docs) {
        if (err) console.error('find error');
        res.send(JSON.stringify(docs));
    });
    
};