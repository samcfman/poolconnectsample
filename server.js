var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;
var pg = require('pg');
var app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

//var auth = require("basic-auth");
//var user = auth.parse(req.getHeader('Proxy-Authorization'));

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;

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

/*const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
console.log('start');
//console.log("Database_URL", process.env.DATABASE_URL);

client.connect(err => {
  if (err) {
    console.error('connection error', err.stack)
  } else {
    console.log('connected')
  }
});
*/
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

app.post("/leadSearch1", function(req, res) {
	
	
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
	
	try {
				var metadata;
				var dealerId;

				var metadataApp = await getMetadataAppFunc (poolclient,request.market, request.applicationName);

				if(metadataApp.length > 0) {
					//console.log ('metadataApp :' + metadataApp);
					metadata = metadataApp;
				}	
				else {
				//	console.log ('metadataAll :' + metadataAll);
					metadata = await getMetadataAllFunc (poolclient,request.market);
				}
				
				if (metadata.length > 0) {
					isValidRequest = true;	
					var accrecordtype = await getAccountRecType(poolclient, request.accountId);	
					
					var searchType = request.searchType;
					
					if(searchType.length>0 && (searchType.equalsIgnoreCase('DealerOutletLeads') || searchType.equalsIgnoreCase('DealerCompanyLeads'))){
					
					dealerId = await getAccountDealerId(poolclient, request.market, request.dealerNdCode, request.dealerGcCode, request.dealerGsCode);	
					
					}
					
					console.log ('dealerId that is going to performLeadSearch :::::::::' + dealerId);		
					
					
					if(searchType.length>0 && (searchType.equalsIgnoreCase('SalesconsultantLeads')|| searchType.equalsIgnoreCase('DealerOutletLeads')
						|| searchType.equalsIgnoreCase('DealerCompanyLeads') || searchType.equalsIgnoreCase('CustomerLeads'))){
					
					if(isValidRequest == true){
							isValidRequest = leadSearch.performRequestValidations(request);
							console.log ("isValidRequest in lead serach after performRequestValidations():::::" + isValidRequest);
					
					}
	
	try{
	
		
		if(true == isValidRequest) {	
		
			console.log ('dealerId that is going to performLeadSearch :::::::::' + dealerId);
			var queryMap = leadSearch.performLeadSearch(metadata, request, accrecordtype, dealerId);
			var leadQuery = queryMap.get('leadquery');
			
			isValidRequest = queryMap.get('isValidRequest');
			
			console.log ("isValidRequest in lead serach after calling performLeadSearch():::::" + isValidRequest);

			if(true == isValidRequest){
			
				var query = leadQuery.get('leadQuery');
				var param = leadQuery.get('leadParam');
				
				var leadObjString = queryMap.get('leadObjString');
				
				poolclient.query(query, param)
				.then(reslead => {
				var leaddetails =  reslead.rows;
				//console.log("result from query :::::::::::");	
				//console.log(leaddetails);
				//res.json(leaddetails);
				if(leaddetails.length >0){
									
									var lstresponseMaplead = leadSearch.getleadDetails(leaddetails, request, leadObjString);
									
									var newList = [];
									for(var i=0; i<lstresponseMaplead.length; i++){				
										newList.push(Object.fromEntries(lstresponseMaplead[i]));
									}
										let response = {
										  leadList: newList,

										  toString() {
											return '{leadList: ${this.leadList}}';
										  }
										};	
										res.json(response);  
									
									}
									
									else{
										res.json({ messageId: request.messageId, messageStatus: 'Success',errorMessage: 'No Result Found'});
									}
		
		
								})	
		
							  }
		
							
			if(false == isValidRequest){
                        var errorDetails = 'No Search Result Found';
                    	handleError(res,request.messageId, null, null,errorDetails); 
                    	//erroResponse = OneApi_ErrorHandler.handleErrorMessageWithCategoryWithReqObject((String)requestMap.get('messageId'), null, null,errorDetails); 
                    }	
				
		} 
		else{
			    var errorDetails = 'Required Fields are Missing in Request payload for Lead Search operation (getLeads / getLeadDetails)';
                //map<String, Object> erroResponse = new map<String, Object> ();                    
                    if(searchType.equalsIgnoreCase('SalesconsultantLeads')|| searchType.equalsIgnoreCase('DealerOutletLeads')
              				|| searchType.equalsIgnoreCase('DealerCompanyLeads') || searchType.equalsIgnoreCase('CustomerLeads')){
							  
							  handleError(res,request.messageId, null, null,errorDetails); 
                            }
                    else if(searchType.equalsIgnoreCase('GetLeadDetails')){
                        
						      handleError(res,request.messageId, null, null,errorDetails);
                            }
		    }
	} 
	catch(err) {
                console.log('Exception found in Try '+ isValidRequest);
                console.log('Exception found in Try '+ err.message);
                
				if(searchType.equalsIgnoreCase('SalesconsultantLeads')|| searchType.equalsIgnoreCase('DealerOutletLeads')
              				|| searchType.equalsIgnoreCase('DealerCompanyLeads') || searchType.equalsIgnoreCase('CustomerLeads')){
                              
                             handleNewError(poolclient, res,request.messageId, err, null,err.message);
							 //responseMap.put('leadList', OneApi_ErrorHandler.handleErrorMessageWithCategoryWithReqObject((String)requestMap.get('messageId'), exp, null,exp.getMessage()));
                			 
                            }
                
            }
	
	}// to end searchtype if
	
		else {  
	        var errorDetails = 'Please provide a valid Search type for Lead Search operation (getLeads / getLeadDetails)';
            handleNewError(poolclient, res,request.messageId, null, null,errorDetails);   
         }
		 
				}
				else {  
								var errorDetails = 'Please provide a valid Search type for Lead Search operation (getLeads / getLeadDetails)';
								handleNewError(poolclient, res,request.messageId, null, null,errorDetails);   
							}
		 
			  } catch (e) {
							console.error (e);
							res.send ("Error " + e)
						} finally {
							release();
						}
					 
					 
				});
} catch (err) {
		console.log ('error in leadSearch : ' + err);
	} 
	
});




function handleError(res, messageId, exp, responseCode, errorDescription) {
  console.log("Inside handleError");
  
  var errorMap = new Map();
        
        var errorCategory = null;
        if(messageId != null && messageId.length>0){
            errorMap.set('messageId',messageId);
        }
        
        errorMap.set('messageStatus','Error');
               
        if(exp != null){
            if((exp.message).includes('unexpected token')){
                errorMap.set('errorMessage','Metadata configuration is not inline with the Request payload, please verify metadata configuration.');
            }else {
                errorMap.set('errorMessage',exp.message);
            }
        }else {
            errorMap.set('errorMessage',errorDescription);
        }     
        
		const query = 'select sfid,name,Error_Categorization__c,Error_Description__c from herokusbox.error_code_mapping_obj__c';
		const param = [];
	
		client.query(query, param)
		.then(reserror => {
			var ecmList = reserror.rows;
        
		//list<Error_Codes_Mapping__mdt> ecm_List = [select id,MasterLabel,Error_Categorization__c,Error_Description__c from Error_Codes_Mapping__mdt];  
        
		
		var codeDetailsFound = false;
		
        if(responseCode != null && responseCode.length>0){            
            for(let ecm of ecmList){
                if(ecm.name != null && (ecm.name).length>0 && ecm.name.trim().equalsIgnoreCase(responseCode)){                    
                    errorCategory = ecm.error_categorization__c;
                    errorMap.set('errorCode',ecm.name);
                    errorMap.set('errorCategory',errorCategory);
                    codeDetailsFound = true;
                }
        	}            
        }else if(errorDescription != null && errorDescription.length>0){
            for(let ecm of ecmList){
                if(ecm.error_description__c != null && (ecm.error_description__c).length>0 && ecm.error_description__c.includes(errorDescription)){
                    errorCategory = ecm.error_categorization__c;
                    errorMap.set('errorCode',ecm.name);
                    errorMap.set('errorCategory',errorCategory);
                    codeDetailsFound = true;
                }
            }            
        }else{
            for(let ecm of ecmList){
                if(ecm.name != null && (ecm.name).length>0 && ecm.name.equalsIgnoreCase('Unknown')){
                    errorCategory = ecm.error_categorization__c;
                    errorMap.set('errorCode',ecm.name);
                    errorMap.set('errorCategory',errorCategory);
                    codeDetailsFound = true;
                }
            }            
        }
        console.log('codeDetailsFound===================>'+codeDetailsFound);
        //If no error code and category found then set "Unknown" as default
        if(codeDetailsFound == false) {
            errorMap.set('errorCode','Unknown');
            errorMap.set('errorCategory','Unknown');
        }
        console.log('errorMap===================>'+errorMap);
        
		var newList = [];					
		newList.push(Object.fromEntries(errorMap));
				
				let response = {leadList: newList, toString() {
										return '{leadList: ${this.leadList}}';
									  }
									};	
									res.json(response);
    })    
}

function handleNewError(client, res, messageId, exp, responseCode, errorDescription) {
	console.log("Inside handleError");
	
	var errorMap = new Map();
		  
		  var errorCategory = null;
		  if(messageId != null && messageId.length>0){
			  errorMap.set('messageId',messageId);
		  }
		  
		  errorMap.set('messageStatus','Error');
				 
		  if(exp != null){
			  if((exp.message).includes('unexpected token')){
				  errorMap.set('errorMessage','Metadata configuration is not inline with the Request payload, please verify metadata configuration.');
			  }else {
				  errorMap.set('errorMessage',exp.message);
			  }
		  }else {
			  errorMap.set('errorMessage',errorDescription);
		  }     
		  
		  const query = 'select sfid,name,Error_Categorization__c,Error_Description__c from herokusbox.error_code_mapping_obj__c';
		  const param = [];
	  
		  client.query(query, param)
		  .then(reserror => {
			  var ecmList = reserror.rows;
		  
		  //list<Error_Codes_Mapping__mdt> ecm_List = [select id,MasterLabel,Error_Categorization__c,Error_Description__c from Error_Codes_Mapping__mdt];  
		  
		  
		  var codeDetailsFound = false;
		  
		  if(responseCode != null && responseCode.length>0){            
			  for(let ecm of ecmList){
				  if(ecm.name != null && (ecm.name).length>0 && ecm.name.trim().equalsIgnoreCase(responseCode)){                    
					  errorCategory = ecm.error_categorization__c;
					  errorMap.set('errorCode',ecm.name);
					  errorMap.set('errorCategory',errorCategory);
					  codeDetailsFound = true;
				  }
			  }            
		  }else if(errorDescription != null && errorDescription.length>0){
			  for(let ecm of ecmList){
				  if(ecm.error_description__c != null && (ecm.error_description__c).length>0 && ecm.error_description__c.includes(errorDescription)){
					  errorCategory = ecm.error_categorization__c;
					  errorMap.set('errorCode',ecm.name);
					  errorMap.set('errorCategory',errorCategory);
					  codeDetailsFound = true;
				  }
			  }            
		  }else{
			  for(let ecm of ecmList){
				  if(ecm.name != null && (ecm.name).length>0 && ecm.name.equalsIgnoreCase('Unknown')){
					  errorCategory = ecm.error_categorization__c;
					  errorMap.set('errorCode',ecm.name);
					  errorMap.set('errorCategory',errorCategory);
					  codeDetailsFound = true;
				  }
			  }            
		  }
		  console.log('codeDetailsFound===================>'+codeDetailsFound);
		  //If no error code and category found then set "Unknown" as default
		  if(codeDetailsFound == false) {
			  errorMap.set('errorCode','Unknown');
			  errorMap.set('errorCategory','Unknown');
		  }
		  console.log('errorMap===================>'+errorMap);
		  
		  var newList = [];					
		  newList.push(Object.fromEntries(errorMap));
				  
				  let response = {leadList: newList, toString() {
										  return '{leadList: ${this.leadList}}';
										}
									  };	
									  res.json(response);
	  })    
  }

function handleErrorMessageWithCategory(res, messageId, exp, responseCode, errorDescription){
        
        var errorMap = new Map();
		
        var errorCategory = null;
        if(messageId != null && messageId.length>0){
            errorMap.set('messageId',messageId);
        }
        
        errorMap.set('messageStatus','Failure'); 
               
        if(exp != null){
            if((exp.message).includes('unexpected token')){
                errorMap.set('errorMessage','Metadata configuration is not inline with the Request payload, please verify metadata configuration.');
            }else {
                errorMap.set('errorMessage',exp.message);
            }
        }else {
            errorMap.set('errorMessage',errorDescription);
        }      
        
        const query = 'select sfid,name,Error_Categorization__c,Error_Description__c from herokusbox.error_code_mapping_obj__c';
		const param = [];
	
		client.query(query, param)
		.then(reserror => {
			var ecmList = reserror.rows;
		
		//list<Error_Codes_Mapping__mdt> ecm_List = [select id,MasterLabel,Error_Categorization__c,Error_Description__c from Error_Codes_Mapping__mdt];
        
		var codeDetailsFound = false;
		
        if(responseCode != null && responseCode.length>0){            
            for(let ecm of ecmList){
                if(ecm.name != null && (ecm.name).length>0 && ecm.name.trim().equalsIgnoreCase(responseCode)){                     
                    errorCategory = ecm.error_categorization__c;
                    errorMap.set('errorCode',ecm.name);
                    errorMap.set('errorCategory',errorCategory);
                    codeDetailsFound = true;
                }
        	}            
        }else if(errorDescription != null && errorDescription.length>0){
            for(let ecm of ecmList){
                if(ecm.error_description__c != null && (ecm.error_description__c).length>0 && ecm.error_description__c.includes(errorDescription)){
                    errorCategory = ecm.error_categorization__c;
                    errorMap.set('errorCode',ecm.name);
                    errorMap.set('errorCategory',errorCategory);
                    codeDetailsFound = true;
                }
            }            
        }else{
            for(let ecm of ecmList){
                if(ecm.name != null && (ecm.name).length>0 && ecm.name.equalsIgnoreCase('Unknown')){
                    errorCategory = ecm.error_categorization__c;
                    errorMap.set('errorCode',ecm.name);
                    errorMap.set('errorCategory',errorCategory);
                    codeDetailsFound = true;
                }
            }
        }
        //If no error code and category found then set "Unknown" as default
        if(codeDetailsFound == false) {
            errorMap.set('errorCode','Unknown');
            errorMap.set('errorCategory','Unknown');
        }
        
		console.log('errorMap===================>'+errorMap);
        
		var newList = [];					
		newList.push(Object.fromEntries(errorMap));
				
				let response = {accountList: newList, toString() {
										return '{accountList: ${this.accountList}}';
									  }
									};	
									res.json(response);
	  })
	  
    }