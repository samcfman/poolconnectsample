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

app.post("/leadSearch", function(req, res) {
	res.response({message:'success'});
});
