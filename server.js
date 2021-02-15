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

var cacheMetaDataAllMap = new Map ();
var cacheMetaDataAppMap = new Map ();
var cacheMetaDataAllCustomerMap = new Map ();
var cacheMetaDataAppCustomerMap = new Map ();


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

			if(metadata.length > 0)	{
				isValidRequest = true;
				console.log ('metedata found : ' + metadata);
			}					
		});	
	}
	catch (err) {
		console.log ('error in leadSearch : ' + err);
		//res.json({error: err})
	} finally {
		release();
	}		

	res.json({message:'success'});
});


async function getMetadataAppFunc (client,market, applicationName) {
	
	const getMetadata = 'SELECT source_system__c, market__c, lead_object__c, request_mapping_fields__c, request_payload_fields__c,response_mapping_fields__c, response_payload_fields__c  , closed_lead_stages__c, order_by_field__c, get_leads_search_handler__c, include_closed_leads__c, include_van_leads__c, restrict_source_system_leads__c, lead_base_query__c, get_lead_details_search_handler__c, lead_detail_search_query__c, interested_vehicle_search_query__c, booking_search_query__c, salesforce_environment__c, sales_lead_search__c,after_sales_lead_search__c, search_leads_response_mappings__c, enabled_dynamic_response__c, search_lead_details_response_mappings__c from herokusbox.One_API_Lead_Search_Configuration_Obj__c where market__c = $1 and source_system__c = $2';
	
	const paramsMetadata = [market, applicationName];

	var cacheKey = market + '-' + applicationName;
	var cacheMetaDataApp = cacheMetaDataAppMap.get (cacheKey);

	if (cacheMetaDataApp === undefined) { 
		const result = await client.query(getMetadata, paramsMetadata);
	//	console.log ('SAM: metedataapp cache load');

		console.log ('metadataAppfunc' + JSON.stringify(result));
		cacheMetaDataApp = result.rows;
		cacheMetaDataAppMap.set (cacheKey, cacheMetaDataApp);		
	} else {
		//console.log ('SAM: metedataapp cache hit');	
	}	

	return cacheMetaDataApp;
}

async function getMetadataAllCustFunc (client,market) {
	const getMetadataAll = 'select sourcesystem__c, enabled_doc_object__c, child_entities__c, wholesale_search_handler__c,dedup_search_handler__c, ecosystem_enabled__c,dynamic_exact_search__c, use_dealer_default_flag__c, dynamic_person_search_fields__c, dynamic_company_search_fields__c,dynamic_person_search_retail_fields__c, dynamic_company_search_retail_fields__c, market__c, ucid_search_handler__c, closed_lead_stages__c,lead_object__c, order_by_field__c, RetailCopyAtCompany__c, Retail_Search_Handler__c, Enabled_Customer_Type__c, Request_Payload_Fields__c, Request_Mapping_Fields__c, Use_Matching_Rules__c, Account_Link_Base_Query__c, Account_Base_Query__c, Enabled_Golden_UCID_Check__c, Salesforce_Environment__c, Sales_Consultant_Search__c, Retail_Response_Mapping__c, Wholesale_Response_Mapping__c, UCID_Response_Mapping__c, Country_Code__c, Convert_Phone_Number_Format__c,Enabled_Dynamic_Response__c, External_IDs__c from herokusbox.one_api_search_configuration_obj__c where market__c = $1 and sourcesystem__c = $2';
	const systemAll = 'All';
	const paramsMetadataAll = [market, systemAll];
	var cacheKey = market;
	var cacheMetaDataAll = cacheMetaDataAllCustomerMap.get (cacheKey);
	
	if (cacheMetaDataAll === undefined) {
		const result = await client.query(getMetadataAll, paramsMetadataAll);
	//	console.log ('SAM: metedataall cache load');
	console.log ('getMetadataAllCustFunc' + JSON.stringify(result));
		cacheMetaDataAll = result.rows;
		cacheMetaDataAllCustomerMap.set (cacheKey, cacheMetaDataAll);
	} else {
	//	console.log ('SAM: metedataall cache hit');
	}

	return cacheMetaDataAll;	
	//return result.rows;
}
