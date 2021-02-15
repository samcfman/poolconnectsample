var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");

var app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

// ** TUNE **
var poolConnectionClient;

String.prototype.equalsIgnoreCase = function (compareString) 
	{ return this.toUpperCase() === compareString.toUpperCase(); 
	};


var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });

var retailSearch = require("./retailSearch.js");
var ucidSearch = require("./ucidSearch.js");
var dedupSearch = require("./dedupSearch.js");
var wholesaleSearch = require("./wholesaleSearch.js");
var leadSearch = require("./leadSearch.js");
var leadDetailsSearch = require("./leadDetailsSearch.js");


// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}
//const { Client } = require ('pg');

const { Client, Pool } = require ('pg');
const { release } = require("os");


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

function basicAuth(req, res, cb) {

	console.log('Inside basic auth:::::::::::');
    // make authenticate path public
    if (req.path === '/users/authenticate') {
        return next();
    }
	return cb(null, true);

    // check for basic auth header
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
        return res.status(401).json({ message: 'Missing Authorization Header' });
    }

    // verify auth credentials
    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    //const user = await userService.authenticate({ username, password });
	//console.log("username ::::::::::" + username);
	//console.log("password ::::::::::" + password);
	if(username == 'test' && password == 'password'){
		 //res.end('Authorization successful!!');
		 console.log('Authorization successful!!');
		 return cb(null, true);
	}
	else
        return res.status(401).json({ message: 'Invalid Authentication Credentials' });
    
}

app.use(basicAuth);


var cacheMetaDataAllCustomerMap = new Map ();
var cacheMetaDataAppCustomerMap = new Map ();


// ** TUNE **
async function getMetadataAllCustFunc (client,market) {
	const getMetadataAll = 'select sourcesystem__c, enabled_doc_object__c, child_entities__c, wholesale_search_handler__c,dedup_search_handler__c, ecosystem_enabled__c,dynamic_exact_search__c, use_dealer_default_flag__c, dynamic_person_search_fields__c, dynamic_company_search_fields__c,dynamic_person_search_retail_fields__c, dynamic_company_search_retail_fields__c, market__c, ucid_search_handler__c, closed_lead_stages__c,lead_object__c, order_by_field__c, RetailCopyAtCompany__c, Retail_Search_Handler__c, Enabled_Customer_Type__c, Request_Payload_Fields__c, Request_Mapping_Fields__c, Use_Matching_Rules__c, Account_Link_Base_Query__c, Account_Base_Query__c, Enabled_Golden_UCID_Check__c, Salesforce_Environment__c, Sales_Consultant_Search__c, Retail_Response_Mapping__c, Wholesale_Response_Mapping__c, UCID_Response_Mapping__c, Country_Code__c, Convert_Phone_Number_Format__c,Enabled_Dynamic_Response__c, External_IDs__c from herokusbox.one_api_search_configuration_obj__c where market__c = $1 and sourcesystem__c = $2';
	const systemAll = 'All';
	const paramsMetadataAll = [market, systemAll];
	var cacheKey = market;
	var cacheMetaDataAll = cacheMetaDataAllCustomerMap.get (cacheKey);
	
	if (cacheMetaDataAll === undefined) {
		const result = await client.query(getMetadataAll, paramsMetadataAll);
	//	console.log ('SAM: metedataall cache load');
		cacheMetaDataAll = result.rows;
		cacheMetaDataAllCustomerMap.set (cacheKey, cacheMetaDataAll);
	} else {
	//	console.log ('SAM: metedataall cache hit');
	}

	return cacheMetaDataAll;	
	//return result.rows;
}

// ** TUNE **
async function getMetadataAppCustFunc (client,market, applicationName) {
	
	const getMetadata = 'select sourcesystem__c, enabled_doc_object__c, child_entities__c, wholesale_search_handler__c,dedup_search_handler__c, ecosystem_enabled__c,dynamic_exact_search__c, use_dealer_default_flag__c, dynamic_person_search_fields__c, dynamic_company_search_fields__c,dynamic_person_search_retail_fields__c, dynamic_company_search_retail_fields__c, market__c, ucid_search_handler__c, closed_lead_stages__c,lead_object__c, order_by_field__c, RetailCopyAtCompany__c, Retail_Search_Handler__c, Enabled_Customer_Type__c, Request_Payload_Fields__c, Request_Mapping_Fields__c, Use_Matching_Rules__c, Account_Link_Base_Query__c, Account_Base_Query__c, Enabled_Golden_UCID_Check__c, Salesforce_Environment__c, Sales_Consultant_Search__c, Retail_Response_Mapping__c, Wholesale_Response_Mapping__c, UCID_Response_Mapping__c, Country_Code__c, Convert_Phone_Number_Format__c,Enabled_Dynamic_Response__c, External_IDs__c from herokusbox.one_api_search_configuration_obj__c where market__c = $1 and sourcesystem__c = $2';
	
	const paramsMetadata = [market, applicationName];

	var cacheKey = market + '-' + applicationName;
	var cacheMetaDataApp = cacheMetaDataAppCustomerMap.get (cacheKey);

	if (cacheMetaDataApp === undefined) { 
		const result = await client.query(getMetadata, paramsMetadata);
	//	console.log ('SAM: metedataapp cache load');
		cacheMetaDataApp = result.rows;
		cacheMetaDataAppCustomerMap.set (cacheKey, cacheMetaDataApp);		
	} else {
		//console.log ('SAM: metedataapp cache hit');	
	}	

	return cacheMetaDataApp;
}

async function getDealerRecord (client,isRetailCopyAtCompanyEnabled, isDealerDefaultFlag, request) {
	
	console.log('inside getDealerRecord :::::::::');	
	
	var dealerId = '';
	
	var queryMap = retailSearch.getDealerRecord(isRetailCopyAtCompanyEnabled, isDealerDefaultFlag, request);
		
	var tempqueryExist = queryMap.get('tempAccountListQuery');
		console.log ("tempqueryExist ::::::::::::" + Boolean(tempqueryExist));
	
	if(Boolean(tempqueryExist)){
		
	  const tmpdealerQuery = queryMap.get('tempAccountListQuery');
	  const tmpdealerQueryParam = queryMap.get('tempAccountListQueryParam');
			
	  const restmpdealer = await client.query(tmpdealerQuery, tmpdealerQueryParam);		
	  var tmpdealerDetails =  restmpdealer.rows;
	
	  if(Boolean(tmpdealerDetails[0].dealer_gc_code__c)){
		  
		const dealerQuery = queryMap.get('dealerAccountListquery');
		var dealerQueryParam = queryMap.get('dealerAccountListqueryParam');	
		console.log ("using dealercode to get dealer records ::::::::::::");
		if(!dealerQueryParam.includes('request.market'))
			dealerQueryParam = [tmpdealerDetails[0].dealer_gc_code__c, request.market];
		
		const resdealer = await client.query(dealerQuery, dealerQueryParam);	
		
		var dealerDetails =  resdealer.rows;  
		
		dealerId = dealerDetails[0].sfid;
		
		  
	  }
	  else{
		 dealerId = '';
	  }
	  
	  console.log("dealer id from if :::::::::" + dealerId);	
	
	
	}
	
	else{
		   
		const dealerQuery = queryMap.get('dealerAccountListquery');
		const dealerQueryParam = queryMap.get('dealerAccountListqueryParam');
		
		console.log('dealerQueryParam in server.js :::::::::::::' + dealerQueryParam);
		
		const resdealer = await client.query(dealerQuery, dealerQueryParam);
		
		var dealerDetails =  resdealer.rows;
		
		console.log("number of records in dealerDetails ::::::" + dealerDetails.length);
		
		if(dealerDetails != null && dealerDetails.length > 1){
			if(isDealerDefaultFlag == true){
				console.log("get the id from dealer record whose defalult flag true:::::::::::;");
				for(var i=0; i<dealerDetails.length; i++){
					if(dealerDetails[i].dealer_default_flag__c == true){
						dealerId = dealerDetails[i].sfid;
						break;
					}
						
				}
			} else{
				console.log("get the id from first dealer record as no dealer flag true found in the list:::::")
				dealerId = dealerDetails[0].sfid;
			}
			
		}
		else if(dealerDetails != null &&dealerDetails.length == 1){
			console.log('-----GSCode/ GCCode present && isDealerDefaultFlag is false -------' );
			dealerId = dealerDetails[0].sfid;
			
		}
		else{
			dealerId = '';
		}
		
		console.log("dealer id from else :::::::::" + dealerId);	
		
	}
	
	console.log("dealer id from getDealerRecord method :::::::::" + dealerId);
	 
	return dealerId;
	
}

var cacheMetaDataAllMap = new Map ();
var cacheMetaDataAppMap = new Map ();


// ** TUNE **
async function getMetadataAllFunc (client,market) {
	const getMetadataAll = 'SELECT source_system__c, market__c, lead_object__c, request_mapping_fields__c, request_payload_fields__c,response_mapping_fields__c, response_payload_fields__c  , closed_lead_stages__c, order_by_field__c, get_leads_search_handler__c, include_closed_leads__c, include_van_leads__c, restrict_source_system_leads__c, lead_base_query__c, get_lead_details_search_handler__c, lead_detail_search_query__c, interested_vehicle_search_query__c, booking_search_query__c, salesforce_environment__c, sales_lead_search__c,after_sales_lead_search__c, search_leads_response_mappings__c, enabled_dynamic_response__c, search_lead_details_response_mappings__c from herokusbox.One_API_Lead_Search_Configuration_Obj__c where market__c = $1 and source_system__c = $2';
	const systemAll = 'All';
	const paramsMetadataAll = [market, systemAll];
	var cacheKey = market;
	var cacheMetaDataAll = cacheMetaDataAllMap.get (cacheKey);
	
	if (cacheMetaDataAll === undefined) {
		const result = await client.query(getMetadataAll, paramsMetadataAll);
	//	console.log ('SAM: metedataall cache load');
		cacheMetaDataAll = result.rows;
		cacheMetaDataAllMap.set (cacheKey, cacheMetaDataAll);
	} else {
	//	console.log ('SAM: metedataall cache hit');
	}

	return cacheMetaDataAll;	
	//return result.rows;
}

// ** TUNE **
async function getMetadataAppFunc (client,market, applicationName) {
	
	const getMetadata = 'SELECT source_system__c, market__c, lead_object__c, request_mapping_fields__c, request_payload_fields__c,response_mapping_fields__c, response_payload_fields__c  , closed_lead_stages__c, order_by_field__c, get_leads_search_handler__c, include_closed_leads__c, include_van_leads__c, restrict_source_system_leads__c, lead_base_query__c, get_lead_details_search_handler__c, lead_detail_search_query__c, interested_vehicle_search_query__c, booking_search_query__c, salesforce_environment__c, sales_lead_search__c,after_sales_lead_search__c, search_leads_response_mappings__c, enabled_dynamic_response__c, search_lead_details_response_mappings__c from herokusbox.One_API_Lead_Search_Configuration_Obj__c where market__c = $1 and source_system__c = $2';
	
	const paramsMetadata = [market, applicationName];

	var cacheKey = market + '-' + applicationName;
	var cacheMetaDataApp = cacheMetaDataAppMap.get (cacheKey);

	if (cacheMetaDataApp === undefined) { 
		const result = await client.query(getMetadata, paramsMetadata);
	//	console.log ('SAM: metedataapp cache load');
		cacheMetaDataApp = result.rows;
		cacheMetaDataAppMap.set (cacheKey, cacheMetaDataApp);		
	} else {
		//console.log ('SAM: metedataapp cache hit');	
	}	

	return cacheMetaDataApp;
}

async function getAccountRecType (client,accountId) {
	const PERSONRECORDTYPEID = '(select sfid from herokusbox.recordtype where sobjecttype = \'Account\' and Name = \'Person Account\')';
	const COMPANYRECORDTYPEID = '(select sfid from herokusbox.recordtype where sobjecttype = \'Account\' and Name = \'Company\')';

	const getaccid = 'select RecordTypeId FROM herokusbox.ACCOUNT WHERE Id =$1 and RecordTypeId =' + PERSONRECORDTYPEID;
	const param = [accountId];
	var accrecordtype;
//	console.log ('in getAccountRecType');
	const result = await client.query(getaccid, param);
//	console.log ('in getAccountRecType result:'+ result.rows);
	var recordtypeid =  result.rows;
	if(recordtypeid.length > 0)
		accrecordtype = 'Person Account';
	else if(recordtypeid.length == 0){ 
		const getaccidCompany = 'select RecordTypeId FROM herokusbox.ACCOUNT WHERE Id =$1 and RecordTypeId =' + COMPANYRECORDTYPEID;
		const resultcompany = await client.query(getaccidCompany, param);
		recordtypeidCompany = resultcompany.rows;
		if (recordtypeidCompany.length > 0) 
			accrecordtype = 'Company';
	}

//	console.log (result.rows);
	return accrecordtype;
}

async function getAccountDealerId (client,market, DealerNDCode, DealerGCCode, DealerGSCode) {
	
	console.log ('inside getAccountDealerId');
	
	console.log ('DealerNDCode ::::::::::: ' + DealerNDCode);
	console.log ('DealerGCCode ::::::::::: ' + DealerGCCode);
	console.log ('DealerGSCode ::::::::::: ' + DealerGSCode);
	
	var getaccid;
	var param;
	
	if(DealerNDCode != null && DealerNDCode.length>0){
		
	console.log ('inside DealerNDCode if');
		
	getaccid = 'SELECT SfId FROM herokusbox.account  WHERE RecordTypeId = (select sfid from herokusbox.recordtype where sobjecttype = \'Account\' and Name = \'Dealer\')AND Dealer_ND_Code__c = $2 AND Market__c = $1 AND Dealer_Active__c = true AND Dealer_Rollout_Status__c = \'Done\'';
	
	param = [market, DealerNDCode];
	
	}
	
	if(DealerGSCode != null && DealerGSCode.length>0){
		
	console.log ('inside DealerGSCode if');
	
	getaccid = 'SELECT SfId FROM herokusbox.account  WHERE RecordTypeId = (select sfid from herokusbox.recordtype where sobjecttype = \'Account\' and Name = \'Dealer\')AND Dealer_GS_Code__c = $2 AND Market__c = $1 AND Dealer_Active__c = true AND Dealer_Rollout_Status__c = \'Done\'';
	
	param = [market, DealerGSCode];
	
	}
	
	if(DealerGCCode != null && DealerGCCode.length>0){
		
	console.log ('inside DealerGCCode if');
		
	getaccid = 'SELECT SfId FROM herokusbox.account  WHERE RecordTypeId = (select sfid from herokusbox.recordtype where sobjecttype = \'Account\' and Name = \'Dealer\')AND Dealer_GC_Code__c = $2 AND Market__c = $1 AND Dealer_Active__c = true AND Dealer_Rollout_Status__c = \'Done\''; 
			
	param = [market, DealerGCCode];
		
	}
	
	const result = await client.query(getaccid, param);
	var resultacc = result.rows;
	if((result.rows).length >0){
	var dealerId = resultacc[0].sfid;
	}
	console.log ('dealerId');
	console.log (dealerId);
	
	return dealerId;
}

app.post("/leadSearch"), function(req, res) {
	var reqinput = req.body;
	console.log ("reqinput ::::" +JSON.stringify(reqinput));
	var request = reqinput.In_Data;
	console.log ("request ::::" +request);	
	res.send("success ");
//	res.json({ messageId: request.messageId, messageStatus: 'Success',errorMessage: 'No Result Found'});	

}
