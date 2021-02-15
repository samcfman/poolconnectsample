const express = require('express');
const app = express();
//const port = 3000;
const PORT = process.env.PORT || 5000;
const bodyParser = require('body-parser');
const { Pool } = require ('pg');
const pool = new Pool ({
	//connectionString: process.env.DATABASE_URL,
	connectionString: process.env.HEROKU_POSTGRESQL_AMBER_URL,
	
	ssl: {
		rejectUnauthorized: false
	  },
	//max: 500  	

});


//module.exports.client = client;
module.exports.client = poolConnectionClient;

//app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

// url: http://localhost:3000/
app.get('/', (request, response) => response.send('Hello World'));


var poolConnectionClient;

String.prototype.equalsIgnoreCase = function (compareString) 
	{ return this.toUpperCase() === compareString.toUpperCase(); 
};

var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});

app.post('/leadSearch', function(req, res) {

	var reqinput = req.body;
	console.log ("reqinput ::::" +JSON.stringify(reqinput));
	var request = reqinput.In_Data;
	console.log ("request ::::" +request);	
	var isValidRequest = false;

	try {
		pool.connect (async (err, poolclient, release) => {
			if (err) {
				var errorDetails = 'Error in Pool Connect';
				console.error ('pool.connect error :' + err );
				res.send("error in getting pool connect: " + err)
			}
			
			poolConnectionClient = poolclient;

			var metadata;
			var dealerId;

			var metadataApp = await getMetadataAppFunc (poolclient,request.market, request.applicationName);
			
			if(metadataApp.length > 0) {
				console.log ('metadataApp :' + metadataApp);
				metadata = metadataApp;
			}	
			else {
				//console.log ('metadataAll :' + metadataAll);
				metadata = await getMetadataAllCustFunc (poolclient,request.market);
			}

			if(metadata.length > 0)	
				isValidRequest = true;				
		});	
	}
	catch (err) {
		console.log ('error in leadSearch : ' + err);
	}		

	res.json({message:'success'});
});
