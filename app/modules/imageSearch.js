module.exports = function (req,res) {
    
	var url = require("url");
	var mongoose = require('mongoose');
	var moment = require('moment');
	var request = require("request");
	
	var historyLength = 10;
	var number = 5;   // set a default number of search items to be returned
    var regex = new RegExp(/([?])([a-z]{6})[=][0-9]+/);  // regex that searches for this pattern: '?offset=' 
    
    // Get the search parameter value (e.g. what you are searching for -example: 'cats') from the url entered
	var param = url.parse(req.url).pathname.split("").slice(1).join(''); //returns path e.g  api/imagesearch/'searchterm parameter'
    param = param.substr(param.lastIndexOf('/') + 1);  // strip the path - get only the searchterm from the last '/' onwards
    
    // format param to create a human readable version (for 'recent history'),  and a version for the Custom Search Engine
    var searchTerm = param.replace('%20',' ');  // replace %20 with a space - for use in recording recent search terms
    param = param.replace("%20", "+");  // replace spaces with a plus symbol - for use in Google Custom Search Engine

	// Check if the request url contains pagination - e.g  it contains '?offset=10' (or whatever number);
	if (regex.test(url.parse(req.url).search)) {  // use node's 'url' module to parse out a search term (starts with a '?') and test using regex for correct pattern
	    
	    console.log('includes pagination');
	    
	    // strip out the number from the end of the pagination request
	    number = url.parse(req.url).search;
        number = number.substr(number.lastIndexOf('=') + 1).split('');
        var numLength = number.length;
        number = number.slice(0,numLength-1).join('');  // remove the '&' character which seems to come along for the ride at the end of the string
	}
	else {
	    console.log('no pagination');
	}
	
	
	// CONNECT TO DB, INSERT SEARCH INTO RECENT HISTORY
	var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    
    var collection = db.collection("history");

    collection.find({},{ _id : 0, term: 1, when: 1}).toArray(function (err,docs) {
       
        if (err) console.error('find error');
       
        console.log('Recent History:\n', docs);
        
        // Remove Oldest Record
        if (docs.length === historyLength) {  
            // delete oldest record
        }

        // add newest record 
        var date = moment().format('MMMM Do YYYY, h:mm:ss a');
        collection.insertOne({term:searchTerm, when:date}, function (err,result) {   // callback function will return error or object if successful
            if (err) console.error('insert err');

            collection.find({},{ _id: 0, term: 1, when: 1}).toArray(function (err,docs) {
                if (err) console.error('find error');
                console.log("After Insert: \n", docs);
            });
            
        });

    });	

	// Google Custom Search Engine API & Custom Search key. The API key is safe for embedding in URLs, it doesn't need any encoding.
	var cseid = "AIzaSyBhq-DFox5DCEAkQTBq77bGWphV-8mc5cs";  // API key
	var cx = "005534600515625453000:ejzuuniklui"; // Custom Search key

	var path = 'https://www.googleapis.com/customsearch/v1?q=' + param + '&cx=' + cx + '&fileType=+bmp%2C+gif%2C+png%2C+jpg&num=' + number + '&fields=items(link%2Cpagemap%2Csnippet)' +'&key=' + cseid;
	console.log('path: ',path);
	
	// use the request module to make an http get request to Google's Custom search engine
	request( path, function(error, response, body) {
	    
	    if (error) console.error('error with request');
        
        // MUST parse the JSON that the Google API returns to remove "" from everything and access it via JS
        var result = JSON.parse(body);
        
        var arr = [];
        var url,snippet,thumbnail,context;

        // MAKE SURE that the returned results have the key/value's that you are looking for
	    for (var i = 0; i < result.items.length; i++) {
	        if(result.items[i].hasOwnProperty("pagemap")) {
	            if(result.items[i].pagemap.hasOwnProperty("cse_image")) {url = result.items[i].pagemap.cse_image[0].src;}
	            else { url = ''}
	        }
	        else { url = ''}
	        
	        if(result.items[i].hasOwnProperty("snippet")) {snippet = result.items[i].snippet;}
	        else { snippet = ''}	   
	        
	        if(result.items[i].hasOwnProperty("pagemap")) {
	            if(result.items[i].pagemap.hasOwnProperty("cse_thumbnail")) {thumbnail = result.items[i].pagemap.cse_thumbnail[0].src;}
	            else { thumbnail = ''}
	        }
	        else { thumbnail = ''}
	        
	        if(result.items[i].hasOwnProperty("link")) {context = result.items[i].link;}
	        else { context = ''}
	        
	        var obj =  {
        	            url: url,
        	            snippet:  snippet,
        	            thumbnail: thumbnail,
        	            context: context };
            	         
	         JSON.stringify(obj);
	         arr.push(obj);
	    }
	    
        console.log(arr);
	    res.send(JSON.stringify(arr));
	});        
};
