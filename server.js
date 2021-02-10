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

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl:true,
});
console.log('start');
client.connect(err => {
  if (err) {
    console.error('connection error', err.stack)
  } else {
    console.log('connected')
  }
});

const pool = new Pool ({
	connectionString: process.env.DATABASE_URL,
	//connectionString: process.env.HEROKU_POSTGRESQL_BLUE_URL,
	
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



app.post("/searchAccount", function(req, res) {
	
	var isValidRequest = false;	
	
	try{
	var reqinput = req.body;
	console.log ("reqinput ::::" +JSON.stringify(reqinput));
	var request = reqinput.In_Data;
	console.log ("request ::::" +request);
	
	//const requestObject = JSON.parse(request);
	
	
	//console.log ("request map length ::::" +requestMap.size);
	//console.log ("applicationName in request::::" + requestMap.get('applicationName'));
	
	
	try {
		pool.connect (async (err, poolclient, release) => {
			console.log ("Inside try");
			if (err) {
				var errorDetails = 'Error in Pool Connect';
				console.error ('pool.connect error :' + err );
				res.send("error in getting pool connect: " + err)
			}
			
			poolConnectionClient = poolclient;
			
		try{	
			var metadata;;
				console.log ("Inside getmetadata try");

				var metadataApp = await getMetadataAppCustFunc (poolclient,request.market, request.applicationName);

				if(metadataApp.length > 0) {
					console.log ('metadataApp :' + metadataApp);
					metadata = metadataApp;
				}	
				else {
					console.log ('metadataAll :' + metadataAll);
					metadata = await getMetadataAllCustFunc (poolclient,request.market);
				}
	
					if(metadata.length > 0)	
					isValidRequest = true;		
					
					
					if(true == isValidRequest) {
					
					var searchType = request.searchType;
					console.log ("searchType in server.js :::::" + searchType);
					
					var requestMap = new Map();
					
					if(searchType.length > 0){
						
					if(searchType =='Retail' || searchType == 'Ucid' || searchType =='Wholesale' || searchType =='Dedup'){
					
					//*************************************Retail search starts here *****************************************************
					if(searchType =='Retail'){
					
					var dealerId;
					
					
					isValidRequest = retailSearch.performValidations(request);
					console.log ("isValidRequest in serach after performValidations():::::" + isValidRequest);
					
					if(true == isValidRequest) {
					
					var performSearch = new Map();
					
					
					//Dealer Identification Flow Implementation
					
					console.log ("calling getDealerRecord" );
					
					var isRetailCopyAtCompanyEnabled = metadata[0].retailcopyatcompany__c;
					var isDealerDefaultFlag = metadata[0].use_dealer_default_flag__c;
					
					//var queryMap = retailSearch.getDealerRecord(isRetailCopyAtCompanyEnabled, isDealerDefaultFlag, request);
					
					dealerId = await getDealerRecord (client,isRetailCopyAtCompanyEnabled, isDealerDefaultFlag, request);
					
					console.log("dealer id from query that goes to performSearch :::::::::" + dealerId);		
					
					
					performSearch = retailSearch.performSearch(metadata, request, res, dealerId);		
					
					isValidRequest = performSearch.get('isValidRequest');
					console.log ("isValidRequest in search after performSearch():::::" + isValidRequest);
						
					console.log('performSearch in server.js :::::::::::::' + performSearch);	
						
					if(true == isValidRequest) {
					
					console.log('performSearch in server.js :::::::::::::' + performSearch);	
					
					
					var queryMap = performSearch.get('finalQueryMap');
					var accountlinkQueryParamdata = queryMap.get('finalQueryParam');
					console.log('length of accountlinkQueryParamdata in server.js :::::::::::::' + accountlinkQueryParamdata.length);
					var accountlinkQuery = queryMap.get('finalQuery');	
					
					var accountlinkQueryParam = [];
					
					requestMap = new Map(Object.entries(request));
					
					for(var i=0; i<accountlinkQueryParamdata.length; i++)
						
					{	
					
						requestMap.get(accountlinkQueryParamdata[i].trim());
						
						var value = accountlinkQueryParamdata[i];
						console.log ('value :::::::::::::' + accountlinkQueryParamdata[i]);
						if(value.trim().equalsIgnoreCase('firstname') || value.trim().equalsIgnoreCase('lastname') || value.trim().equalsIgnoreCase('mobilePhone') || value.trim().equalsIgnoreCase('homePhone') || value.trim().equalsIgnoreCase('workPhone'))			
							accountlinkQueryParam.push('%' + requestMap.get(accountlinkQueryParamdata[i].trim()) + '%');
						else
							accountlinkQueryParam.push(requestMap.get(accountlinkQueryParamdata[i].trim()));	
						
						
						console.log ('request.value :::::::::::::' + requestMap.get(accountlinkQueryParamdata[i].trim()));
					}
					
					
					
					console.log('account link query in server.js :::::::::::::' + accountlinkQuery);
					console.log('account link query param in server.js :::::::::::::' + accountlinkQueryParam);
				   
				   
				   client.query(accountlinkQuery, accountlinkQueryParam)   
				   .then(resAccount => {
					var accdetails = resAccount.rows;
					//res.json(accdetails); 
					
					console.log ("result ::::::" + accdetails);
					//console.log ('response.id in server js::::::::::' +  accdetails[0].id);
					
					//const response = new Map(Object.entries(accdetails));
					//console.log ("response ::::::" + response);
					
					//var responseMap = new Map();
					var responseMapAcc = new Map();
					
					if(accdetails.length > 0){
					
					var lstresponseMapAcc = retailSearch.getAccountLinkDetails(metadata, accdetails, request);
					
					var newList = [];
					for(var i=0; i<lstresponseMapAcc.length; i++){
						newList.push(Object.fromEntries(lstresponseMapAcc[i]));
					}
							let response = {accountList: newList,
												  toString() {
													return '{accountList: ${this.leadList}}';
												  }
												};	
												res.json(response); 
					}
						else{
						res.json({ messageId: request.messageId, messageStatus: 'Success',errorMessage: 'No Result Found'});
							}
									
						})
									
							
					}if(false == isValidRequest){
									var errorDetails = 'No Search Result Found';
									handleErrorMessageWithCategory(res,request.messageId, null, null,errorDetails); 
									
								}
					
					}
					else{
							var errorDetails = 'Required Fields are Missing in Request payload';
							handleErrorMessageWithCategory(res,request.messageId, null, null,errorDetails);
						}
					} //*************************************Retail search ends here *****************************************************
					
							//********************************************* ucid search starts here ******************************************************		
					else if(searchType == 'Ucid'){
						
					console.log('entered here to perform ucid search');
											
						
					isValidRequest = ucidSearch.performValidations(request);
					
					console.log('isValidRequest from ucidSearch performValidations:::::::::::::' + isValidRequest);
					
					if(true == isValidRequest) {
						
					var performUcidSearch = new Map();
					var responseMap = new Map();
					var externalId = request.externalId;
					var externalSystem = request.externalSystem;
					var accountIdValue = request.accountId;
					var accountListUcid;
					var ucidValue = request.ucid;
					var accountIdValue = request.accountId;
					var dealerId = '';
					var INDIVIDUALEXTLNKRECORDTYPEID = 'select sfid from herokusbox.recordtype where sobjecttype = \'Account_Link__c\' and Name = \'Individual Customer External Link\'';
					
					/* this is to get toRoleSet and pass to getAccountRecords method */
					var externalAccountLinkListquery = 'Select sfid, toRole__c FROM herokusbox.Account_Link__c WHERE Name = $1 AND System__c = $2 AND recordTypeId = ' + '(' + INDIVIDUALEXTLNKRECORDTYPEID + ')';
					var externalAccountLinkListqueryparam = [externalId, externalSystem]; 
					var externalAccountLinkList;
					var toRoleSet = [];
					
					client.query(externalAccountLinkListquery, externalAccountLinkListqueryparam)   
				   .then(resAl => {
					externalAccountLinkList = resAl.rows;
					console.log('externalAccountLinkList ==>'+externalAccountLinkList);	
					
					for(var i=0; i < externalAccountLinkList.length; i++)
					{
						if(externalAccountLinkList[i].toRole__c != null)
							toRoleSet.push(exal.toRole__c);
					}
					
					/* this is to get ucid using account id and pass to getAccountRecords method */
					
					var accountListquery = 'SELECT UCID__c FROM herokusbox.Account WHERE sfid = $1';
					var accountListparam = [accountIdValue];
					var accountList = [];
					
					client.query(accountListquery, accountListparam)   
				   .then(resAcc => {
					accountList = resAcc.rows;
					console.log('accountList ==>'+accountList);
					
					if(accountList.length > 0){
							accountListUcid = accountList[0].ucid__c;
					}
					
					console.log('accountListUcid::::::::::::::' + accountListUcid);
					
					var PerformUcidSearch = new Map();
					
					PerformUcidSearch = ucidSearch.performSearch(metadata, request, responseMap,dealerId,toRoleSet,accountListUcid);
					 
					 isValidRequest = PerformUcidSearch.get('isValidRequest');
					 
					 console.log('isValidRequest from ucidSearch performSearch:::::::::::::' + isValidRequest);
					 
					 if(true == isValidRequest) {
					 
					 var isDealerRequest = PerformUcidSearch.get('isDealerRequest');
					
					console.log ("isDealerRequest in server.js :::::::::::::::::::::::::::::::" + isDealerRequest);
					
					if(isDealerRequest == true){
					
					//***********************isDealerRequest true *****************************************************	
					 console.log ("inside if as isDealerRequest is true");
					
					var isRetailCopyAtCompany = metadata[0].retailcopyatcompany__c;
					var dealerDefaultFlag = metadata[0].use_dealer_default_flag__c;
					
					
					
					var queryMap = retailSearch.getDealerRecord(isRetailCopyAtCompany, dealerDefaultFlag, request);
					
					var tempqueryExist = queryMap.get('tempAccountListQuery');
					console.log ("tempqueryExist ::::::::::::" + Boolean(tempqueryExist));
					
					if(Boolean(tempqueryExist)){
					
					console.log("inside if as tempqueryExist true"); 
						
					const tmpdealerQuery = queryMap.get('tempAccountListQuery');
					const tmpdealerQueryParam = queryMap.get('tempAccountListQueryParam');
						
					client.query(tmpdealerQuery, tmpdealerQueryParam)
					.then(restmpdealer => {
						var tmpdealerDetails =  restmpdealer.rows;
					
					if(Boolean(tmpdealerDetails[0].dealer_gc_code__c)){
						
					const dealerQuery = queryMap.get('dealerAccountListquery');
					var dealerQueryParam = queryMap.get('dealerAccountListqueryParam');	
					console.log ("using delaercode to get dealer records ::::::::::::");
					if(!dealerQueryParam.includes('request.market'))
						dealerQueryParam = [tmpdealerDetails[0].dealer_gc_code__c, request.market];
					
					client.query(dealerQuery, dealerQueryParam)
					.then(resdealer => {
						
						var dealerDetails =  resdealer.rows;			
						dealerId = dealerDetails[0].sfid;	
						
						PerformUcidSearch = ucidSearch.performSearch(metadata, request, responseMap,dealerId,toRoleSet,accountListUcid);			
						
						
						var dealerid = PerformUcidSearch.get('dealerId');
						var queryMap = PerformUcidSearch.get('accountQueryMap');
						
						var accountBaseSoql = queryMap.get('accountBaseSoql');
						
						console.log('accountBaseSoql in server.js :::::::::::::' + accountBaseSoql);
						
						var isExtenalIdQuery = queryMap.get('isExtenalIdQuery');
						var externalIdAccountSOQL = queryMap.get('externalIdAccountSOQL');
						var queryParam = [request.ucid, request.market];
						var accUciddetails;
						var uciddetail;
						var isGoldenUCIDEnabled = metadata[0].enabled_golden_ucid_check__c;
						
						if((accountIdValue != null) || (ucidValue != null)) {
							
							console.log("inside if");
							
						client.query(accountBaseSoql, queryParam)   
					   .then(resAccount => {
						accUciddetails = resAccount.rows;		
						console.log('accountList ==>'+accUciddetails);				
						
						if(accUciddetails != null && accUciddetails.length > 0) {
									//responseMap.put('accountList',ucidSearch.getAccountDetails(newMetadataList,accUciddetails,request,dealerId)); 
									//isValidRequest = true;
									res.json(resAccount.rows); 
								} 
								
						if(accUciddetails.length == 0 && isExtenalIdQuery == true){
						
						client.query(externalIdAccountSOQL, queryParam)   
					   .then(resAccount => {
						accUciddetails = resAccount.rows;
						console.log('accountList with externalId ==>'+accUciddetails);
						
						if(accUciddetails != null && accUciddetails.length > 0) {
									//responseMap.put('accountList',ucidSearch.getAccountDetails(newMetadataList,accUciddetails,request,dealerId)); 
									//isValidRequest = true;
									res.json(resAccount.rows); 
								}
						
						if(accUciddetails.length == 0 && isGoldenUCIDEnabled) {
						 var  goldenUcid;
						 
						var query = 'SELECT Id, Master_UCID__c, Duplicate_UCID__c FROM Duplicate_Merge_Info__c where Duplicate_UCID__c = $1';
						var param = [request.ucid]; 
							
						client.query(query, param)   
					   .then(resucid => {
						uciddetail = resucid.rows;
						
						if(uciddetail.length > 0){
								if(uciddetail[0].master_ucid__c != null) {
									
									goldenUcid = uciddetail[0].master_ucid__c; 
									
									//accountBaseSoql = accountBaseSoql.replace(':ucid', ':goldenUcid');
									queryParam = [request.market, goldenUcid];					
									//accountFinalList =  database.query(accountBaseSoql);
									
									client.query(accountBaseSoql, queryParam)   
									.then(resAccount => {
									accUciddetails = resAccount.rows;
									
									console.log('accountList with goldenUcid ==>'+accUciddetails);
									
									
									if(accUciddetails != null && accUciddetails.length > 0) {
									//responseMap.put('accountList',ucidSearch.getAccountDetails(newMetadataList,accUciddetails,request,dealerId)); 
									//isValidRequest = true;
									res.json(resAccount.rows); 
								}
									
									
									
									
					   
								})
								}  
							}												   
										
										
							})				
										
										
						}

						})
						}		
							
						})		
							
						}        
								
										
							})	
						}
							
						})		
						
						
					} //if end
					
					else{
						
					 console.log("inside else as tempqueryExist false");       		
						
					const dealerQuery = queryMap.get('dealerAccountListquery');
					const dealerQueryParam = queryMap.get('dealerAccountListqueryParam');
					
					console.log('dealerQueryParam in ucidSearch.js :::::::::::::' + dealerQueryParam);
					
					client.query(dealerQuery, dealerQueryParam)
					.then(resdealer => {
					var dealerDetails =  resdealer.rows;
					//console.log("dealerDetails from query :::::::::::");	
					//console.log(dealerDetails);
					
					//console.log("id in dealerDetails ::::::" + dealerDetails[0].sfid);
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
					
					console.log("dealer id from query that goes to performSearch :::::::::" + dealerId); 
					
					
					PerformUcidSearch = ucidSearch.performSearch(metadata, request, responseMap,dealerId,toRoleSet,accountListUcid);	
					
						
						var dealerid = PerformUcidSearch.get('dealerId');
						var queryMap = PerformUcidSearch.get('accountQueryMap');
						
						var accountBaseSoql = queryMap.get('accountBaseSoql');
						
						console.log('accountBaseSoql in server.js :::::::::::::' + accountBaseSoql);
						
						var isExtenalIdQuery = queryMap.get('isExtenalIdQuery');
						var externalIdAccountSOQL = queryMap.get('externalIdAccountSOQL');
						var queryParam = [request.ucid, request.market];
						var accUciddetails;
						var uciddetail;
						var isGoldenUCIDEnabled = metadata[0].enabled_golden_ucid_check__c;
						
						if((accountIdValue != null) || (ucidValue != null)) {
							
							console.log("inside if");
							
						client.query(accountBaseSoql, queryParam)   
					   .then(resAccount => {
						accUciddetails = resAccount.rows;		
						console.log('accountList ==>'+accUciddetails);				
						
						if(accUciddetails != null && accUciddetails.length > 0) {
									//responseMap.put('accountList',ucidSearch.getAccountDetails(newMetadataList,accUciddetails,request,dealerId)); 
									//isValidRequest = true;
									res.json(resAccount.rows); 
								} 
								
						if(accUciddetails.length == 0 && isExtenalIdQuery == true){
						
						client.query(externalIdAccountSOQL, queryParam)   
					   .then(resAccount => {
						accUciddetails = resAccount.rows;
						console.log('accountList with externalId ==>'+accUciddetails);
						
						if(accUciddetails != null && accUciddetails.length > 0) {
									//responseMap.put('accountList',ucidSearch.getAccountDetails(newMetadataList,accUciddetails,request,dealerId)); 
									//isValidRequest = true;
									res.json(resAccount.rows); 
								}
						
						if(accUciddetails.length == 0 && isGoldenUCIDEnabled) {
						 var  goldenUcid;
						 
						var query = 'SELECT Id, Master_UCID__c, Duplicate_UCID__c FROM Duplicate_Merge_Info__c where Duplicate_UCID__c = $1';
						var param = [request.ucid]; 
							
						client.query(query, param)   
					   .then(resucid => {
						uciddetail = resucid.rows;
						
						if(uciddetail.length > 0){
								if(uciddetail[0].master_ucid__c != null) {
									
									goldenUcid = uciddetail[0].master_ucid__c; 
									
									//accountBaseSoql = accountBaseSoql.replace(':ucid', ':goldenUcid');
									queryParam = [request.market, goldenUcid];					
									//accountFinalList =  database.query(accountBaseSoql);
									
									client.query(accountBaseSoql, queryParam)   
									.then(resAccount => {
									accUciddetails = resAccount.rows;
									
									console.log('accountList with goldenUcid ==>'+accUciddetails);
									
									
									if(accUciddetails != null && accUciddetails.length > 0) {
									//responseMap.put('accountList',ucidSearch.getAccountDetails(newMetadataList,accUciddetails,request,dealerId)); 
									//isValidRequest = true;
									res.json(resAccount.rows); 
								}
									
									
									
									
					   
								})
								}  
							}												   
										
										
							})				
										
										
						}

						})
						}		
							
						})		
							
						}
					
					
					
					
						}) 
						
						} //else end
						
					 }	//dealerrequest true end
					 
					 else{ //***********************isDealerRequest false ***************************************************** 
						
						console.log ("inside else as isDealerRequest is false"); 
						
						//PerformUcidSearch = ucidSearch.performSearch(metadata, request, responseMap,dealerId,toRoleSet,accountListUcid);
						
						var dealerid = PerformUcidSearch.get('dealerId');
						var queryMap = PerformUcidSearch.get('accountQueryMap');
						var dynamicUCIDResponseMap = queryMap.get('dynamicUCIDResponseMap');
						
						console.log('dynamicUCIDResponseMap size in server.js :::::::::::::' + dynamicUCIDResponseMap.size);
						
						console.log('dynamicUCIDResponseMap DOC_Information_DOCs in server.js :::::::::::::' + dynamicUCIDResponseMap.get('DOC_Information_DOCs'));
						
						var accountBaseSoql = queryMap.get('accountBaseSoql');
						
						console.log('accountBaseSoql in server.js :::::::::::::' + accountBaseSoql);
						
						var isExtenalIdQuery = queryMap.get('isExtenalIdQuery');
						var externalIdAccountSOQL = queryMap.get('externalIdAccountSOQL');
						var queryParam = [request.ucid, request.market];
						var accUciddetails;
						var uciddetail;
						var isGoldenUCIDEnabled = metadata[0].enabled_golden_ucid_check__c;
						
						if((accountIdValue != null) || (ucidValue != null)) {
							
							console.log("inside if");
							
						client.query(accountBaseSoql, queryParam)   
					   .then(resAccount => {
						accUciddetails = resAccount.rows;		
						console.log('accountList ==>'+accUciddetails);				
						
						if(accUciddetails != null && accUciddetails.length > 0) {
							
									res.json(resAccount.rows);
									
									//responseMap.set('accountList',ucidSearch.getAccountDetails(metadata,accUciddetails,request,dealerId,dynamicUCIDResponseMap)); 
									/*var responseMapAcc = ucidSearch.getAccountDetails(metadata,accUciddetails,request,dealerId,dynamicUCIDResponseMap);
									
									var responseucidmap = {};
										responseucidmap["accountList"] = Object.fromEntries(responseMapAcc);					
										console.log(responseucidmap);						
										res.json(responseucidmap); */
								
								} 
								
						if(accUciddetails.length == 0 && isExtenalIdQuery == true){
						
						client.query(externalIdAccountSOQL, queryParam)   
					   .then(resAccount => {
						accUciddetails = resAccount.rows;
						console.log('accountList with externalId ==>'+accUciddetails);
						
						if(accUciddetails != null && accUciddetails.length > 0) {
								//responseMap.put('accountList',ucidSearch.getAccountDetails(newMetadataList,accUciddetails,request,dealerId,dynamicUCIDResponseMap)); 
									//isValidRequest = true;
									res.json(resAccount.rows); 
								}
						
						if(accUciddetails.length == 0 && isGoldenUCIDEnabled) {
						 var  goldenUcid;
						 
						var query = 'SELECT Id, Master_UCID__c, Duplicate_UCID__c FROM Duplicate_Merge_Info__c where Duplicate_UCID__c = $1';
						var param = [request.ucid]; 
							
						client.query(query, param)   
					   .then(resucid => {
						uciddetail = resucid.rows;
						
						if(uciddetail.length > 0){
								if(uciddetail[0].master_ucid__c != null) {
									
									goldenUcid = uciddetail[0].master_ucid__c; 
									
									//accountBaseSoql = accountBaseSoql.replace(':ucid', ':goldenUcid');
									queryParam = [request.market, goldenUcid];					
									//accountFinalList =  database.query(accountBaseSoql);
									
									client.query(accountBaseSoql, queryParam)   
									.then(resAccount => {
									accUciddetails = resAccount.rows;
									
									console.log('accountList with goldenUcid ==>'+accUciddetails);
									
									
									if(accUciddetails != null && accUciddetails.length > 0) {
									//responseMap.put('accountList',ucidSearch.getAccountDetails(newMetadataList,accUciddetails,request,dealerId)); 
									//isValidRequest = true;
									res.json(resAccount.rows); 
								}
									
									
									
									
					   
								})
								}  
							}												   
										
										
							})				
										
										
						}

						})
						}		
							
						})		
							
						}	
						 
					 } //dealerrequest false end
						
					
					 }
					 if(false == isValidRequest){
									var errorDetails = 'No Search Result Found';
									handleErrorMessageWithCategory(res,request.messageId, null, null,errorDetails); 
									//erroResponse = OneApi_ErrorHandler.handleErrorMessageWithCategoryWithReqObject((String)requestMap.get('messageId'), null, null,errorDetails); 
								}
					
					
							}) // accountListUcid end
					
						})// toRoleSet end
					
					}
					else{
						  var errorDetails = 'Required Fields are Missing in Request payload';
						  handleErrorMessageWithCategory(res,request.messageId, null, null,errorDetails);
					}
						
					} //*************************************Ucid search ends here ****************************************************
					
					
						
						
					else if(searchType =='Wholesale'){
							
						isValidRequest = wholesaleSearch.performValidations(request);
						console.log ("isValidRequest in wholesale serach after performValidations():::::" + isValidRequest);
					
						if(true == isValidRequest) {
						
						var performSearch = new Map();
						
						performSearch = wholesaleSearch.performSearch(metadata, request);
						
						isValidRequest = performSearch.get('isValidRequest');
						console.log ("isValidRequest in wholesale serach after performSearch():::::" + isValidRequest);
						
						if(true == isValidRequest) {
						
						var queryMap = performSearch.get('finalQueryMap');
						
						var wholesaleQueryParamdata = queryMap.get('finalQueryParam');
						console.log('length of wholesaleQueryParamdata in server.js :::::::::::::' + wholesaleQueryParamdata.length);
						var wholesaleQuery = queryMap.get('finalQuery');	
						
						requestMap = new Map(Object.entries(request));
						
						var wholesaleQueryParam = [];
						
						for(var i=0; i<wholesaleQueryParamdata.length; i++)
							
						{	
						
							requestMap.get(wholesaleQueryParamdata[i].trim());
							
							var value = wholesaleQueryParamdata[i];
							console.log ('value :::::::::::::' + wholesaleQueryParamdata[i]);
							if(value.trim().equalsIgnoreCase('firstname') || value.trim().equalsIgnoreCase('lastname') || value.trim().equalsIgnoreCase('mobilePhone') || value.trim().equalsIgnoreCase('homePhone') || value.trim().equalsIgnoreCase('workPhone'))			
								wholesaleQueryParam.push('%' + requestMap.get(wholesaleQueryParamdata[i].trim()) + '%');
							else
								wholesaleQueryParam.push(requestMap.get(wholesaleQueryParamdata[i].trim()));	
							
							
							console.log ('request.value :::::::::::::' + requestMap.get(wholesaleQueryParamdata[i].trim()));
						}
						
						
						
						console.log('wholesale query in server.js :::::::::::::' + wholesaleQuery);
						console.log('wholesale query param in server.js :::::::::::::' + wholesaleQueryParam);
								
						client.query(wholesaleQuery, wholesaleQueryParam)   
					   .then(resAccount => {
						var accdetails = resAccount.rows;
						//res.json(accdetails); 
						
						var responseMapAcc = new Map();
						
						if(accdetails.length > 0){
						
						var lstresponseMapwholesale = wholesaleSearch.getAccountDetails(metadata, accdetails, request);
						
						var newList = [];
						for(var i=0; i<lstresponseMapwholesale.length; i++){				
							newList.push(Object.fromEntries(lstresponseMapwholesale[i]));
						}
						let response = {accountList: newList,
											toString() {
													return '{accountList: ${this.accountList}}';
												  }
												};	
												res.json(response); 
						}
						else{
							res.json({ messageId: request.messageId, messageStatus: 'Success',errorMessage: 'No Result Found'});
							}
						
					
						});
					  }
					  if(false == isValidRequest){
									var errorDetails = 'No Search Result Found';
									handleErrorMessageWithCategory(res,request.messageId, null, null,errorDetails); 
									//erroResponse = OneApi_ErrorHandler.handleErrorMessageWithCategoryWithReqObject((String)requestMap.get('messageId'), null, null,errorDetails); 
								}
					}
					else{
							var errorDetails = 'Required Fields are Missing in Request payload';
							handleErrorMessageWithCategory(res,request.messageId, null, null,errorDetails);
					}
					
					}  //*************************************Wholesale search ends here *****************************************************
					
					else if(searchType =='Dedup'){
						
						isValidRequest = dedupSearch.performValidations(request);
						console.log ("isValidRequest in Dedup serach after performValidations():::::" + isValidRequest);
						
						if(true == isValidRequest){
							
						var performSearch = dedupSearch.performSearch(metadata, request, dealerId);	
						isValidRequest = performSearch.get('isValidRequest');
						console.log ("isValidRequest in Dedup serach after performSearch():::::" + isValidRequest);
						
						if(true == isValidRequest){
						
						var dealerId = '';		
						
						var isRetailCopyAtCompany = metadata[0].retailcopyatcompany__c;
						var isDealerDefaultFlag = metadata[0].use_dealer_default_flag__c;
						
						var isDealerGSCodeEmpty  = Boolean(!request.dealerGsCode);
						var isDealerGCCodeEmpty  = Boolean(!request.dealerGcCode);
						var isDealerNDCodeEmpty  = Boolean(!request.dealerNdCode);
						
						var isDealerInfoAvailable = false;
						var queryMap = new Map();
					
						if((isDealerNDCodeEmpty == false || isDealerGSCodeEmpty == false) || isDealerGCCodeEmpty == false) {
						isDealerInfoAvailable = true;
						
						console.log ("calling getDealerRecord" );			
						//queryMap = retailSearch.getDealerRecord(isRetailCopyAtCompany, isDealerDefaultFlag, request);
						
						dealerId = await getDealerRecord (client,isRetailCopyAtCompany, isDealerDefaultFlag, request);
						
						}
						
						if(dealerId.length >0)	{
							
								console.log("dealer id from getDealerRecord that goes to dedupSearch :::::::::" + dealerId);
										
										var performSearch = new Map();
										var queryMap = new Map();
										var reatailMap = new Map();
										var wholesaleMap = new Map();
						
										performSearch = dedupSearch.performSearch(metadata, request, dealerId);
																	
										queryMap = performSearch.get('finalQueryMap');
										
										reatailMap = queryMap.get('retailQueryMap');
										wholesaleMap = queryMap.get('wholesaleQueryMap');
										
										requestMap = new Map(Object.entries(request));
										
										if(reatailMap.size >0)
										{
											var retailQueryParamdata = reatailMap.get('finalQueryParam');
											console.log('length of retailQueryParamdata in server.js :::::::::::::' + retailQueryParamdata.length);
											var retailQuery = reatailMap.get('finalQuery');	
											
											var retailQueryParam = [];
											
											for(var i=0; i<retailQueryParamdata.length; i++)
												
											{	
											
												requestMap.get(retailQueryParamdata[i].trim());
												
												var value = retailQueryParamdata[i];
												console.log ('value :::::::::::::' + retailQueryParamdata[i]);
												if(value.trim().equalsIgnoreCase('firstname') || value.trim().equalsIgnoreCase('lastname') || value.trim().equalsIgnoreCase('mobilePhone') || value.trim().equalsIgnoreCase('homePhone') || value.trim().equalsIgnoreCase('workPhone'))			
													retailQueryParam.push('%' + requestMap.get(retailQueryParamdata[i].trim()) + '%');
												else
													retailQueryParam.push(requestMap.get(retailQueryParamdata[i].trim()));	
												
												
												console.log ('request.value :::::::::::::' + requestMap.get(retailQueryParamdata[i].trim()));
											}
												console.log ('retailQuery :::::::::::::' + retailQuery);
												console.log ('retailQueryParam :::::::::::::' + retailQueryParam);
											
												client.query(retailQuery, retailQueryParam)   
											   .then(resAccount => {
												var accdetails = resAccount.rows;
												
												if(accdetails.length >0){
												console.log('accdetails');	
												console.log(accdetails);
												var queryString = '';
												var accountId = (accdetails[0].sfid).toString();
												console.log('accountId -------------->' + accountId);	
												
												queryString = wholesaleMap.get('queryString');
												
												var query = queryString + ' and a.sfid = $1';
												var param = [accdetails[0].sfid];
												
												client.query(query, param)   
											   .then(resAccount => {
													var acdetails = resAccount.rows;
													
													if(acdetails.length >0){
														//res.json(acdetails); 
														var lstresponseMapwholesale = dedupSearch.getAccountDetails(metadata, acdetails, request);
						
														var newList = [];
																		
															newList.push(Object.fromEntries(lstresponseMapwholesale[0]));
														
															let response = {accountList: newList,
																			toString() {
																					return '{accountList: ${this.accountList}}';
																				  }
																				};	
																				res.json(response); 
														}
													else{
														res.json({ messageId: request.messageId, messageStatus: 'Success',errorMessage: 'No Result Found' });
														
													}
												
													})
												
												}
												
												else if(accdetails.length == 0)
												{
													console.log ('inside else as retailsearch returned no results');
													
													var wholesaleQueryParamdata = wholesaleMap.get('finalQueryParam');
													console.log('length of wholesaleQueryParamdata in server.js :::::::::::::' + wholesaleQueryParamdata.length);
													var wholesaleQuery = wholesaleMap.get('finalQuery');	
													
													var wholesaleQueryParam = [];
													
													for(var i=0; i<wholesaleQueryParamdata.length; i++)
														
													{	
													
														requestMap.get(wholesaleQueryParamdata[i].trim());
														
														var value = wholesaleQueryParamdata[i];
														console.log ('value :::::::::::::' + wholesaleQueryParamdata[i]);
														if(value.trim().equalsIgnoreCase('firstname') || value.trim().equalsIgnoreCase('lastname') || value.trim().equalsIgnoreCase('mobilePhone') || value.trim().equalsIgnoreCase('homePhone') || value.trim().equalsIgnoreCase('workPhone'))			
															wholesaleQueryParam.push('%' + requestMap.get(wholesaleQueryParamdata[i].trim()) + '%');
														else
															wholesaleQueryParam.push(requestMap.get(wholesaleQueryParamdata[i].trim()));	
														
														
														console.log ('request.value :::::::::::::' + requestMap.get(wholesaleQueryParamdata[i].trim()));
													}
													
													console.log ('wholesaleQuery :::::::::::::' + wholesaleQuery);
													console.log ('wholesaleQueryParam :::::::::::::' + wholesaleQueryParam);
													
													client.query(wholesaleQuery, wholesaleQueryParam)   
													.then(resAccount => {
														var accdetails = resAccount.rows;
														
														if(accdetails.length >0){
														  accdetails[0].dealer_nd_code__c = null;
														  accdetails[0].dealer_gs_code__c = null;
														  accdetails[0].dealer_gc_code__c = null;
															
														  //res.json(accdetails); 
														  
															var lstresponseMapwholesale = dedupSearch.getAccountDetails(metadata, accdetails, request);
						
															var newList = [];
																		
															newList.push(Object.fromEntries(lstresponseMapwholesale[0]));
														
															let response = {accountList: newList,
																			toString() {
																					return '{accountList: ${this.accountList}}';
																				  }
																				};	
																				res.json(response);
														}else{
															res.json({ messageId: request.messageId, messageStatus: 'Success',errorMessage: 'No Result Found' });
															
														}
														
													})
													
													
												}
												
												});
										
											
											
											
										}
										else if (reatailMap.size == 0){
											
											console.log ('inside else if as reatailMap is empty');
											
											var wholesaleQueryParamdata = wholesaleMap.get('finalQueryParam');
													console.log('length of wholesaleQueryParamdata in server.js :::::::::::::' + wholesaleQueryParamdata.length);
													var wholesaleQuery = wholesaleMap.get('finalQuery');	
													
													var wholesaleQueryParam = [];
													
													for(var i=0; i<wholesaleQueryParamdata.length; i++)
														
													{	
													
														requestMap.get(wholesaleQueryParamdata[i].trim());
														
														var value = wholesaleQueryParamdata[i];
														console.log ('value :::::::::::::' + wholesaleQueryParamdata[i]);
														if(value.trim().equalsIgnoreCase('firstname') || value.trim().equalsIgnoreCase('lastname') || value.trim().equalsIgnoreCase('mobilePhone') || value.trim().equalsIgnoreCase('homePhone') || value.trim().equalsIgnoreCase('workPhone'))			
															wholesaleQueryParam.push('%' + requestMap.get(wholesaleQueryParamdata[i].trim()) + '%');
														else
															wholesaleQueryParam.push(requestMap.get(wholesaleQueryParamdata[i].trim()));	
														
														
														console.log ('request.value :::::::::::::' + requestMap.get(wholesaleQueryParamdata[i].trim()));
													}
													
													client.query(wholesaleQuery, wholesaleQueryParam)   
													.then(resAccount => {
														var accdetails = resAccount.rows;
														
														if(accdetails.length >0){
														  accdetails[0].dealer_nd_code__c = null;
														  accdetails[0].dealer_gs_code__c = null;
														  accdetails[0].dealer_gc_code__c = null;
															
														  //res.json(accdetails); 
															var lstresponseMapwholesale = dedupSearch.getAccountDetails(metadata, accdetails, request);
						
															var newList = [];
																		
															newList.push(Object.fromEntries(lstresponseMapwholesale[0]));
														
															let response = {accountList: newList,
																			toString() {
																					return '{accountList: ${this.accountList}}';
																				  }
																				};	
																				res.json(response);
														}else{
															res.json({ messageId: request.messageId, messageStatus: 'Success',errorMessage: 'No Result Found' });
															
														}
														
													})
											
										}
										
								
								
								//})
						
								//}

							}
							else{
								
								var performSearch = new Map();
								performSearch = dedupSearch.performSearch(metadata, request, dealerId);
									queryMap = performSearch.get('finalQueryMap');
										
										reatailMap = queryMap.get('retailQueryMap');
										wholesaleMap = queryMap.get('wholesaleQueryMap');
								
								var wholesaleQueryParamdata = wholesaleMap.get('finalQueryParam');
								console.log('length of wholesaleQueryParamdata in server.js :::::::::::::' + wholesaleQueryParamdata.length);
								var wholesaleQuery = wholesaleMap.get('finalQuery');

								requestMap = new Map(Object.entries(request));
													
								var wholesaleQueryParam = [];
													
								for(var i=0; i<wholesaleQueryParamdata.length; i++)
														
									{	requestMap.get(wholesaleQueryParamdata[i].trim());
														
										var value = wholesaleQueryParamdata[i];
										console.log ('value :::::::::::::' + wholesaleQueryParamdata[i]);
										if(value.trim().equalsIgnoreCase('firstname') || value.trim().equalsIgnoreCase('lastname') || value.trim().equalsIgnoreCase('mobilePhone') || value.trim().equalsIgnoreCase('homePhone') || value.trim().equalsIgnoreCase('workPhone'))			
											wholesaleQueryParam.push('%' + requestMap.get(wholesaleQueryParamdata[i].trim()) + '%');
										else
											wholesaleQueryParam.push(requestMap.get(wholesaleQueryParamdata[i].trim()));
										
											console.log ('request.value :::::::::::::' + requestMap.get(wholesaleQueryParamdata[i].trim()));
													}
													
										client.query(wholesaleQuery, wholesaleQueryParam)   
													.then(resAccount => {
										var accdetails = resAccount.rows;
														
										if(accdetails.length >0){
											accdetails[0].dealer_nd_code__c = null;
											accdetails[0].dealer_gs_code__c = null;
											accdetails[0].dealer_gc_code__c = null;
											//res.json(accdetails); 
											var lstresponseMapwholesale = dedupSearch.getAccountDetails(metadata, accdetails, request);
						
											var newList = [];
																		
											newList.push(Object.fromEntries(lstresponseMapwholesale[0]));
														
											let response = {accountList: newList,
													toString() {
																	return '{accountList: ${this.accountList}}';
															   }
															};	
													res.json(response);
											}
														
										else{res.json({ messageId: request.messageId, messageStatus: 'Success',errorMessage: 'No Result Found' });												
											}
														
									})
								
							}
						
						
						
						}
						if(false == isValidRequest){
									var errorDetails = 'No Search Result Found';
									handleErrorMessageWithCategory(res,request.messageId, null, null,errorDetails); 
									//erroResponse = OneApi_ErrorHandler.handleErrorMessageWithCategoryWithReqObject((String)requestMap.get('messageId'), null, null,errorDetails); 
								}
						}
						else{
							  var errorDetails = 'Required Fields are Missing in Request payload';
							  handleErrorMessageWithCategory(res,request.messageId, null, null,errorDetails);				
						}
						
							} //*************************************dedup search ends here *****************************************************
					
					
						}
						else{
							   console.log('--------INSIDE Search Type Wrong ELSE Loop-------');
							   var errorDetails = 'Please provide a valid searchType value in request payload (Dedup/ Wholesale/ Retail/ ucid).';
							   handleErrorMessageWithCategory(res,request.messageId, null, null,errorDetails);
							}			
					
					   }		
					else{
						   console.log('--------INSIDE Search Type Missing ELSE Loop-------');
						   var errorDetails = 'Please provide a valid searchType value in request payload (Dedup/ Wholesale/ Retail/ ucid).';
						   handleErrorMessageWithCategory(res,request.messageId, null, null,errorDetails);                    
						}
					
					}
					else {
							console.log('--------INSIDE Market ELSE Loop-------');
							var errorDetails = 'Please verify Market value and Metadata configuration for specified market in Request.';
							handleErrorMessageWithCategory(res,request.messageId, null, null,errorDetails);                
						}
	 } catch (e) {console.error (e);
					res.send ("Error " + e)
						} finally {
							release();
						}
	});
	
	}catch (err) {
		console.log ('error in CustomerSearch : ' + err);
	} 
  }
  catch(err) {
            	console.log('Exception found in Try '+isValidRequest);
                handleErrorMessageWithCategory(res,request.messageId, err, null, err.message);          
            }

});




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

app.post("/leadSearch", function(req, res) {
	
	
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
				
				client.query(query, param)
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
                              
                             handleError(res,request.messageId, err, null,err.message);
							 //responseMap.put('leadList', OneApi_ErrorHandler.handleErrorMessageWithCategoryWithReqObject((String)requestMap.get('messageId'), exp, null,exp.getMessage()));
                			 
                            }
                
            }
	
	}// to end searchtype if
	
		else {  
	        var errorDetails = 'Please provide a valid Search type for Lead Search operation (getLeads / getLeadDetails)';
            handleError(res,request.messageId, null, null,errorDetails);   
         }
		 
				}
				else {  
								var errorDetails = 'Please provide a valid Search type for Lead Search operation (getLeads / getLeadDetails)';
								handleError(res,request.messageId, null, null,errorDetails);   
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