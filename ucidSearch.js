var searchUtility = require("./searchUtility.js");
var oneAPISearchDomainMain = require("./oneAPISearchDomainMain.js");	
var retailSearch = require("./retailSearch.js");




var dynamicResponseSwitch;
var salesConsultantSearch;
var leadOrOpptyObject;
var salesConsultantFedIdInRequest;
	

var INDIVIDUALEXTLNKRECORDTYPEID = 'select sfid from herokusbox.recordtype where sobjecttype = \'Account_Link__c\' and Name = \'Individual Customer External Link\'';

String.prototype.equalsIgnoreCase = function (compareString) 
	{ return this.toUpperCase() === compareString.toUpperCase(); 
	};


function performValidations(request) {
	
	
        var isValidRequest = false;
		
		console.log('inside performValidations ucidSearch');
        
        //byPass the validations if external ids are there in request.
        var externalId = request.externalId;
        var externalSystem = request.externalSystem;
        //Boolean isSearchTypeAvailable = String.isNotEmpty(requestMap.get('searchType'));
		var isSearchTypeAvailable = Boolean(request.searchType);
        //Boolean isMarketAvailable = String.isNotEmpty(requestMap.get('market'));
		var isMarketAvailable = Boolean(request.market);
		console.log ("isMarketAvailable ::::::::::" + isMarketAvailable);
        //Boolean isApplicationNameAvailable = String.isNotEmpty(requestMap.get('applicationName'));
		var isApplicationNameAvailable = Boolean(request.applicationName);
        //Boolean isMessageIdAvailable = String.isNotEmpty(requestMap.get('messageId'));
		var isMessageIdAvailable = Boolean(request.messageId);
        
        if(Boolean(request.externalId) && Boolean(request.externalSystem)) {
            return isSearchTypeAvailable && isMarketAvailable && isApplicationNameAvailable && isMessageIdAvailable;
        }        
        
		//Boolean isUcidAvailable = String.isNotEmpty(requestMap.get('ucid'));
		var isUcidAvailable = Boolean(request.ucid);
        //Boolean isAccountIdAvailable = String.isNotEmpty(requestMap.get('accountId'));       
        var isAccountIdAvailable = Boolean(request.accountId);
		
        isValidRequest = isSearchTypeAvailable && (isUcidAvailable || isAccountIdAvailable) && isMarketAvailable && isApplicationNameAvailable && isMessageIdAvailable;
        
        return isValidRequest;
    }
	
	  //UCID search Process Begins Here
    function performSearch(newMetadataList, request, responseMap,dealerId,toRoleSet,accountListUcid) {
		
		console.log('inside performSearch ucidSearch');
		
        //var isValidRequest = false;
		var returnMap = new Map();
		
        dynamicResponseSwitch = newMetadataList[0].enabled_dynamic_response__c;
        salesConsultantSearch = newMetadataList[0].sales_consultant_search__c;
        leadOrOpptyObject = newMetadataList[0].lead_object__c;
        salesConsultantFedIdInRequest = request.salesConsultantFedId;
		
        returnMap = performUCIDSearch(newMetadataList, request, responseMap,dealerId,toRoleSet,accountListUcid);
		
		console.log("returnMap from performUCIDSearch:::::::::::::: " + returnMap);
		var isDealerRequest = returnMap.get('isDealerRequest');
		console.log("isDealerRequest from performUCIDSearch:::::::::::::: " + isDealerRequest);
		
		var queryMap = returnMap.get('accountQueryMap');
		var query = queryMap.get('accountBaseSoql');
		
		console.log("accountQuery from performUCIDSearch:::::::::::::: " + query);
		
		var dynamicUCIDResponseMap = queryMap.get('dynamicUCIDResponseMap');
				
		console.log ("dynamicUCIDResponseMap size in final map :::::::::::::::::" + dynamicUCIDResponseMap.size);
		 
		
        return returnMap;
    }

//UCID search Process Begins here
    function performUCIDSearch(newMetadataList, request, responseMap,dealerId,toRoleSet,accountListUcid) { 
		
		console.log('inside performUCIDSearch');
		
        var isValidRequest = false;
        
        var isDealerRequest = false;
        
        //Dynamic Way Implementation UCID ----step 1) Dealer Available in the Request <------- 
        var isDealerGCCodeEmpty  = Boolean(!request.dealerGcCode);
		console.log('isDealerGCCodeEmpty::::::::::::;;;;' + isDealerGCCodeEmpty);
        var isDealerNDCodeEmpty  = Boolean(!request.dealerNdCode);
		console.log('isDealerNDCodeEmpty::::::::::::;;;;' + isDealerNDCodeEmpty);
        var isDealerGSCodeEmpty  = Boolean(!request.dealerGsCode);
		console.log('isDealerGSCodeEmpty::::::::::::;;;;' + isDealerGSCodeEmpty);
        
        if(isDealerNDCodeEmpty && isDealerGSCodeEmpty  && isDealerGCCodeEmpty) {
            isDealerRequest = false;
        }
        else{
            isDealerRequest = true;
        }
        var accountFinal = [];
		var finalMap = new Map();
		
		var externalId = request.externalId;
        var externalSystem = request.externalSystem;
		var accountIdValue = request.accountId;
		var accountListUcid;
		
		try {
		
		  if(isDealerRequest) {
			
			console.log ('Inside if as isDealerRequest is true');			
			var accountQueryMap1=oneAPISearchDomainMain.getAccountRecords(newMetadataList,true,dealerId,request,toRoleSet,accountListUcid); 
			
			console.log ("accountQueryMap1:::::::::::::::::::" + accountQueryMap1);
			console.log ("creating final map");
			var query = accountQueryMap1.get('accountBaseSoql');
			console.log ("query in final map :::::::::::::::::" + query);
			
			finalMap.set('dealerId',dealerId);
			finalMap.set('accountQueryMap', accountQueryMap1); 
			console.log ("finalMap:::::::::::::::::::" + finalMap);
			isValidRequest = true;	
		
          }
            else {
				
				console.log ('Inside else as isDealerRequest is false');
				
                var accountQueryMap2 =  oneAPISearchDomainMain.getAccountRecords(newMetadataList,false,null,request,toRoleSet,accountListUcid); 
				
				console.log ("accountQueryMap2:::::::::::::::::::" + accountQueryMap2);
				console.log ("creating final map");
				var query = accountQueryMap2.get('accountBaseSoql');
				console.log ("query in final map :::::::::::::::::" + query);
				
				var dynamicUCIDResponseMap = accountQueryMap2.get('dynamicUCIDResponseMap');
				
				console.log ("dynamicUCIDResponseMap size in final map :::::::::::::::::" + dynamicUCIDResponseMap.size);
				
				finalMap.set('dealerId','');
				finalMap.set('accountQueryMap', accountQueryMap2); 
				console.log ("finalMap:::::::::::::::::::" + finalMap);
				isValidRequest = true;	
			
				}
		
		   finalMap.set('isDealerRequest',isDealerRequest);
			
			
        }catch(error) {
            isValidRequest = false;
            console.error( "error in try block of performUCIDSearch:::::::::" + error);
        }
		
		finalMap.set('isValidRequest',isValidRequest);
		
		return finalMap;
        
        //return isValidRequest;
    }
	
	
	//Retrieving Account details with all related entities except Lead/Opportunity and Interested Vehicles
    function getAccountDetails(newMetadataList,accUciddetails,request,dealerId,dynamicUCIDResponseMap) { 
	
        console.log('inside getAccountDetails method::::::::::::::::::');
		
		console.log('inside getAccountDetails method newMetadataList::::::::::::::::::' + newMetadataList.length);
		
        var responseMap = new Map();
        var noOfNotes;
        //String salesforceEnvironment;
        var docObjectEnabled = newMetadataList[0].enabled_doc_object__c;
		console.log('inside getAccountDetails method docObjectEnabled::::::::::::::::::' + docObjectEnabled);
        //Checking Dealer Info from the Request
		var isDealerGCCodeEmpty  = Boolean(!request.dealerGcCode);
		var isDealerNDCodeEmpty  = Boolean(!request.dealerNdCode);
		var isDealerGSCodeEmpty  = Boolean(!request.dealerGsCode);
		
        //Check for dynamic c2c's 
		var childEntity = newMetadataList[0].child_entities__c;
		console.log('inside getAccountDetails method childEntity::::::::::::::::::' + childEntity);
        var dynamicChildEntities = childEntity.split(',');
        var isRetailC2CEnabled = false;
        var isWholesaleC2CEnable = false;
        var retailC2CLimit = '1';
        var wholesaleC2CLimit = '1';
        
        var accountlinkChildEnabled =  false;
        var docChildEnabled = false; 
        var leadChildEnabled =  false;
        var addressChildEnabled =  false;
        var vrChildEnabled =  false;
        
              
        for(let childRecord of dynamicChildEntities) {
			
            var childRecordList = childRecord.split(':');
			
            if(childRecordList != null && childRecordList.length == 2) {
				
                if(childRecordList[0].trim().equalsIgnoreCase('retailC2C')) {
                    isRetailC2CEnabled = true;
                    retailC2CLimit = childRecordList[1].trim();
					
                } else if(childRecordList[0].trim().equalsIgnoreCase('wholesaleC2C')) {
                    isWholesaleC2CEnable = true;
                    wholesaleC2CLimit = childRecordList[1].trim();
					
                } else if(childRecordList[0].trim().equalsIgnoreCase('DOCs')){
                    docChildEnabled = true; 
					
                } else if(childRecordList[0].trim().equalsIgnoreCase('VehicleRelationships')) {
                    vrChildEnabled = true;
					
                } else if(childRecordList[0].trim().equalsIgnoreCase('Leads')) {
                    leadChildEnabled = true;
					
                } else if(childRecordList[0].trim().equalsIgnoreCase('Addresses')) {
                    addressChildEnabled = true;
					
                } else if(childRecordList[0].trim().equalsIgnoreCase('AccountLinks')) {
                    accountlinkChildEnabled = true;
                }
            }
        }
        console.log('Flags ----> retailC2C->'+isRetailC2CEnabled
                                +'--wholesaleC2C-->'+isWholesaleC2CEnable
                                +'--DOCs-->'+docChildEnabled
                                +'--VehicleRelationships-->'+vrChildEnabled
                                +'--Leads-->'+leadChildEnabled
                                +'--Addresses-->'+addressChildEnabled
                                +'--AccountLinks-->'+accountlinkChildEnabled);
        
        //Account with VR's
        if(vrChildEnabled == true) {
            
			var vehicleRelationshipList = getVRS(accUciddetails,dynamicUCIDResponseMap);
			
            if(vehicleRelationshipList != null && vehicleRelationshipList.length >0) {
                responseMap.set('vehicleRelationships',vehicleRelationshipList);  
            }
            else { 
                 responseMap.set('vehicleRelationships',vehicleRelationshipList);  
            }
        }
        //Account with DOC's
        if(docChildEnabled == true) {
			
             var docList = getDOCS(accUciddetails, docObjectEnabled,dynamicUCIDResponseMap);
            if(docList != null && docList.length>0) {
                responseMap.set('DOCs',docList);  
            }
            else { 
                 responseMap.set('DOCs',docList);  
            }
        }
        
        //Account Related Retail C2C's && Account Related WholeSale C2C's  here
        //Collect all Retail Copy records here //Ideally it should be only one record From retrieved Account Record.
        /*var retailCopies = [];
        var searchedAcountId = [];
        var relatedCompanyIdSet = [];
        if (accUciddetails[0].accountlink != null && accUciddetails[0].accountlink.length>0) {
            for(let accLnk of accUciddetails[0].accountlink) {
                retailCopies.push(accLnk);
                searchedAcountId.add(accLnk.toRole__c);
                if(accLnk.Retail_Related_Company__c != null) {
                    relatedCompanyIdSet.add(accLnk.Retail_Related_Company__c);
                }
            }
        }
        console.log('Collect all Retail Copy records here'+retailCopies);
		
        //Get ToRole Record id (Person Account/Company Account Id) as searchedAcountId
        set<ID> searchedAcountId = new set<ID>();
        if (retailCopies != null && retailCopies.size()>0) {
            for(Account_Link__c accLnk : retailCopies) {
                searchedAcountId.add(accLnk.toRole__c);
            }
        }*/
        //QUERY_ON_C2C //Retrieve all Account Link records where RecordType = 'C2C' and (FromRole = searchedAcountId OR toRole = searchedAcountId) 
		
		/*
		Skipping the below part as doing the basic search with basic elements
		
        List<Account_Link__c> retailC2CSList = new  List<Account_Link__c>();
        if(isWholesaleC2CEnable == true) {
            Schema.sObjectType.Account_Link__c.isAccessible();
            List<Account_Link__c> wholesalec2cList =  [select id
                                                       , toRole__c
                                                       , FromRole__c
                                                       FROM Account_Link__c
                                                       WHERE recordtypeid =: CONTACTTOCONTACTRECORDTYPEID 
                                                       AND (FromRole__c =:searchedAcountId OR toRole__c =: searchedAcountId) 
                                                       ORDER BY LastModifiedDate Limit 50 //here no need to add dynamic Limits
                                                      ]; 
            //If No ND/GS or GC codes (or No Dealer) in the request then  
            ////Add all retrieved 5 C2C record as wholesaleC2C tag in the response.
            //Else If ND/GS or GC (dealer request) there in the request then
            //Then do following steps:
            //1. Get all C2C records and identify fromTole/ToRole values (either person/company) which is not matching to the record being sdearched.
            //2. Retrieved all the Account Link records where FromRole = dealerId and ToRole = [Person/Company record ids identified in previous step].
            //3. Iterate from the retrieved C2C records and check if the person/companmy account is there in the set identified in setp#1 If yes then add the C2C into the response as WhiolesaleC2c.
            console.log('WHOLESALE C2C LIST'+wholesalec2cList);
            console.log('CODE-1-------->'+isDealerNDCodeEmpty);
            console.log('CODE-1-------->'+isDealerGSCodeEmpty);
            console.log('CODE-1-------->'+isDealerGCCodeEmpty);
            
            set<Id> fromOrToRoleIDSet = new set<Id>();
            for(Account_Link__c accountListC2C :wholesalec2cList) {
                if(searchedAcountId.contains(accountListC2C.FromRole__c) == false) {
                    fromOrToRoleIDSet.add(accountListC2C.FromRole__c);
                } else {
                    fromOrToRoleIDSet.add(accountListC2C.toRole__c);
                }
            }
            
            //WholesaleC2C - Without Dealer Info
            if(isDealerNDCodeEmpty && isDealerGSCodeEmpty  && isDealerGCCodeEmpty){
                console.log('------In WholesaleC2C - Without Dealer Info block---->');
                
                //Implementing Dynamic query creation changes
                console.log('------OneAPISearchDomainMain.wholesaleC2CWithoutDealerResponseTagAPIName---->'+ OneAPISearchDomainMain.wholesaleC2CWithoutDealerResponseTagAPIName);
                String wholesaleC2CDynamicFields = OneAPISearchDomainMain.wholesaleC2CWithoutDealerResponseTagAPIName;
                console.log('----- dynamicResponseSwitch ---->' + dynamicResponseSwitch);
                List<Account> c2cWholesaleAccountRecords;
                Integer limitValue = integer.valueOf(wholesaleC2CLimit);
                if(true == dynamicResponseSwitch){
                    console.log('------INSIDE c2cWholesaleAccountRecords DYNAMIC---->');
                    if(String.isNotBlank(wholesaleC2CDynamicFields)){
                        console.log('------wholesaleC2CDynamicFields---->'+ wholesaleC2CDynamicFields);
                        String queryStringWholesaleC2C = 'SELECT ' + wholesaleC2CDynamicFields + ' FROM Account ' + 
                            'WHERE (recordtypeid =: PERSONRECORDTYPEID OR recordtypeid =: COMPANYRECORDTYPEID) '+
                            'AND id IN :fromOrToRoleIDSet '+
                            'ORDER BY LastModifiedDate Limit :limitValue';
                        console.log('------queryStringWholesaleC2C---->'+ queryStringWholesaleC2C);
                        //Execute the query
                        c2cWholesaleAccountRecords = Database.query(queryStringWholesaleC2C);
                        console.log('------c2cWholesaleAccountRecords DYNAMIC---->'+ c2cWholesaleAccountRecords);
                    }
                }
                
                list<Object> wholeSaleC2CObjectList = new list<Object>();
                
                for(Account wholesaleC2C :c2cWholesaleAccountRecords) {
                    wholeSaleC2CObjectList.add(getwholeSaleC2C(wholesaleC2C));
                }
                responseMap.put('wholesaleC2C', wholeSaleC2CObjectList);
            }else {
                console.log('fromOrToRoleIDSet-------->'+fromOrToRoleIDSet);
                console.log('dealerID-------->'+dealerID);
                 
                //Implementing Dynamic query creation changes
                console.log('------OneAPISearchDomainMain.wholesaleC2CWithDealerResponseTagAPIName---->'+ OneAPISearchDomainMain.wholesaleC2CWithDealerResponseTagAPIName);
                String wholesaleC2CWithDealerDynamicFields = OneAPISearchDomainMain.wholesaleC2CWithDealerResponseTagAPIName;
                console.log('----- dynamicResponseSwitch ---->' + dynamicResponseSwitch);
                List<Account_Link__c> c2cRetailAccountRecord;
                Integer limitValue = integer.valueOf(wholesaleC2CLimit);
                if(true == dynamicResponseSwitch){
                    console.log('------INSIDE c2cRetailAccountRecord DYNAMIC---->');
                    if(String.isNotBlank(wholesaleC2CWithDealerDynamicFields)){
                        console.log('------wholesaleC2CWithDealerDynamicFields---->'+ wholesaleC2CWithDealerDynamicFields);
                        String queryStringWholesaleC2CWithDealer = 'SELECT ' + wholesaleC2CWithDealerDynamicFields + ' FROM Account_Link__c ' +
                            'WHERE (recordtypeid =: RETAILPERSONRECORDTYPEID OR recordtypeid =: RETAILCOMPANYRECORDTYPEID) ' +
                            'AND FromRole__c =:dealerID ' + 
                            'AND toRole__c IN :fromOrToRoleIDSet ' +
                            'ORDER BY LastModifiedDate Limit :limitValue';
                        
                        console.log('------queryStringWholesaleC2CWithDealer---->'+ queryStringWholesaleC2CWithDealer);
                        //Execute the query
                        c2cRetailAccountRecord = Database.query(queryStringWholesaleC2CWithDealer);
                        console.log('------c2cRetailAccountRecord DYNAMIC---->'+ c2cRetailAccountRecord);
                    }
                }
         
                list<Object> wholeSaleC2CObjectList = new list<Object>();
                
                for(Account_Link__c accountListC2C :c2cRetailAccountRecord) {
                    wholeSaleC2CObjectList.add(getwholeSaleC2C(accountListC2C));
                }
                responseMap.put('wholesaleC2C', wholeSaleC2CObjectList);
            }    
        }
        
        if(isRetailC2CEnabled == true) {
            if(isDealerNDCodeEmpty && isDealerGSCodeEmpty  && isDealerGCCodeEmpty) {
                responseMap.put('retailC2C',retailC2CSList); //nothing to send here  
            } else {
                set<Id> idS = new set<Id>(); 
    			List<Account_Link__c> accLinkRecords;
    			if(relatedCompanyIdSet != null && relatedCompanyIdSet.size() > 0) {
                    
                    //Implementing Dynamic query creatin for RetailC2C
                    console.log('------OneAPISearchDomainMain.retailC2CResponseTagAPIName---->'+ OneAPISearchDomainMain.retailC2CResponseTagAPIName);
                    String retailC2CQueryFields = OneAPISearchDomainMain.retailC2CResponseTagAPIName;
                    console.log('-----dynamicResponseSwitch---->'+ dynamicResponseSwitch);
                    console.log('-----retailC2CQueryFields---->'+ retailC2CQueryFields);
                    Integer limitValue = integer.valueOf(retailC2CLimit);
                    if(true == dynamicResponseSwitch){
                        console.log('-----INSIDE accLinkRecords DYNAMIC---->');
                        if(String.isNotBlank(retailC2CQueryFields)){
                            String queryStringRetailC2C = 'SELECT ' + retailC2CQueryFields + ' FROM Account_Link__c ' + 
                                'WHERE FromRole__c =: dealerID ' + 
                                'AND Id IN :relatedCompanyIdSet  limit :limitValue';
                            
                            console.log('-----queryStringRetailC2C---->'+ queryStringRetailC2C);
                            accLinkRecords = Database.query(queryStringRetailC2C);
                            console.log('-----accLinkRecords---->'+ accLinkRecords);
                        }
                    }
                }							
                List<object> retailC2Cs =  new List<object>();
    			if(accLinkRecords != null && accLinkRecords.size() > 0) {
    				for(Account_Link__c c2cRecords : accLinkRecords){
    					retailC2Cs.add(getRetailC2C(c2cRecords));
    				}
    			}
                console.log('c2cListTwo------>'+accLinkRecords);
                console.log('c2cListTwo------>'+retailC2Cs);
                responseMap.put('retailC2C',retailC2Cs); 
            }
        }
        */
        if(leadChildEnabled == true) {
            //Inserting the Response of  Leads related to Account && Interested Vehicles related to Lead
            //Removed param - ownerRecord
            //var getLeads = getLeads(accUciddetails);
			var getLeads = '';
            var leadEnabled = false;
            responseMap.set('leadList',getLeads);
			/*
            if(accUciddetails[0].recordtypeid == PERSONRECORDTYPEID  && accUciddetails[0].leadperson.length>0) {                                                     
                console.log('entered here');
                responseMap.set('leadList',getLeads);
                leadEnabled = true;
            } else if(accUciddetails[0].recordtypeid == COMPANYRECORDTYPEID  && accUciddetails[0].leadcompany.length>0) {                                                     
                responseMap.set('leadList',getLeads);
                leadEnabled = true;
            }
        
            // Inserting the Response of  Opportunities related to Account && Interested Vehicles related to Opportunities
            if(leadEnabled == false) {
                //Removed param - ownerRecord
                var getOpportunitiesAsLeads = getOpportunities(accUciddetails);
                if (accUciddetails[0].opportunity != null && accUciddetails[0].opportunity.length>0 ) {
                    responseMap.set('leadList',getOpportunitiesAsLeads); 
                } else {
                    responseMap.set('leadList',getOpportunitiesAsLeads); 
                }
            } 
            
            if(accUciddetails[0].leadperson.length == 0 && accUciddetails[0].leadcompany.length == 0 && accUciddetails[0].opportunity.length == 0) {
                responseMap.set('leadList',getLeads);
            } */
        }
        
        //Account Related Addresses
        if(addressChildEnabled == true) {
            var addressList = getAddresses(accUciddetails,dynamicUCIDResponseMap);
            if(addressList!= null && addressList.length>0) {
                responseMap.set('addressList',addressList);  
            } else {
                  responseMap.set('addressList',addressList);   
            }
        }
        
        //Account related retail Copies
        if(accountlinkChildEnabled == true) {
            //Removed param - ownerRecord
            var retailCopiesList = getRetailCopies(accUciddetails,request,dynamicUCIDResponseMap);
            if (retailCopiesList != null && retailCopiesList.length>0) {
                responseMap.set('retailCopies',retailCopiesList) ;
            } else { //No dealer In the Request this is Blank
                responseMap.set('retailCopies',retailCopiesList);
            }
        }
        
        //Parent Account Tags ---> Always Wholesale Details
       
        var isRetailCopyAtCompany;
        if(newMetadataList != null) {
            isRetailCopyAtCompany  = newMetadataList[0].retailcopyatcompany__c;
        }
        
		/*Schema.sObjectType.User.isAccessible();
		
        if(oneAPIMetadataList != null && oneAPIMetadataList.size()>0){
            if(oneAPIMetadataList[0].Salesforce_Environment__c != null && String.isNotBlank(oneAPIMetadataList[0].Salesforce_Environment__c)){
                console.log('noOfNotes BEFORE------>'+noOfNotes);
                noOfNotes = OneAPIUtilityHelper.noOfNotes(accUciddetails[0].id, oneAPIMetadataList[0].Salesforce_Environment__c);
                console.log('noOfNotes AFTER------>'+noOfNotes);
            }
        } */
        //noOfNotes = [SELECT count() FROM Note WHERE ParentId =: accUciddetails[0].Id];
        
        if(true == dynamicResponseSwitch){
            //User usr=[select id,federationIdentifier from User where id=:accUciddetails[0].OwnerId];
            responseMap.set(dynamicResponseMapping('accountDetails', accUciddetails[0],dynamicUCIDResponseMap)); 
            //responseMap.put('Owner', String.ISBlank(usr.federationIdentifier)? '' :usr.federationIdentifier);
            //responseMap.put('noOfNotes', noOfNotes);
            responseMap.set('messageId', request.messageId);
            responseMap.set('messageStatus', 'Success');
            responseMap.set('errorCode', '');
            responseMap.set('errorMessage', '');
            responseMap.set('errorCategory', '');
        }
      return responseMap;
    }
	
	//Method to Get VehicleRelationship's
    function getVRS(accUciddetails,dynamicUCIDResponseMap) {
        console.log('INSIDE getVRS ----- ');
        var vehicleRelationshipList = [];
        //Account Related Vehicle Relationships
        if(accUciddetails[0].vehicle != null && accUciddetails[0].vehicle.length>0) {
            for(let vehRelations of accUciddetails[0].vehicle){
                var vehicleMaps = getvehicleRelationships(vehRelations,dynamicUCIDResponseMap);
                vehicleRelationshipList.push(vehicleMaps);
            }
        }
         console.log('----- vehicleRelationshipList ------'+vehicleRelationshipList);
        return vehicleRelationshipList;
    }
	
	//Vehicle Relationship Mappings done here
    function getvehicleRelationships (vehRelations,dynamicUCIDResponseMap) {
        var vehMaps = new Map();
        if(true == dynamicResponseSwitch){
        	vehMaps.set(dynamicResponseMapping('vehicleRelationships', vehRelations,dynamicUCIDResponseMap));    
        }
        return vehMaps;
    }
	
	//Method to Get DOC's
    function getDOCS(accUciddetails, docObjectEnabled,dynamicUCIDResponseMap){
        var docList = [];
		var docInputList = [];
        var docMaps;
		docInputList = accUciddetails[0].doc;
		console.log('docInputList size==>' + docInputList.length); 
        console.log('DOC==>' + JSON.stringify(accUciddetails[0].doc)); 
		doclength = (JSON.stringify(accUciddetails[0].doc)).length;
		console.log('accUciddetails[0].doc.length==>'+ doclength); 
		
        if(docObjectEnabled == true && doclength > 0) {
			console.log('inside getDOCS if'); 
			
            //for(let docRecords of accUciddetails[0].doc){
                docMaps = getdocInformation(docInputList,dynamicUCIDResponseMap);
                docList.push(docMaps);
                console.log('docList based on docObjectEnabled as TRUE' + docList); 
            //}
        }else if(docObjectEnabled == false) {
            docMaps = getdocInformationDocEnabledFalse(accUciddetails[0],dynamicUCIDResponseMap);
            docList.push(docMaps);
            console.log('docList based on docObjectEnabled as FALSE' + docList);
        }
        return docList;
    }
    
    //Doc Mappings are done here
    function getdocInformation(docRecords,dynamicUCIDResponseMap){
        var docMaps = new Map();
		console.log('inside getdocInformation()'); 
        if(true == dynamicResponseSwitch){
        	docMaps.set(dynamicResponseMapping('DOC_Information_DOCs', docRecords,dynamicUCIDResponseMap));    
        }
        return docMaps;
    }
    
    //Doc Mappings - if doc child enabled false
    function getdocInformationDocEnabledFalse (accRecord,dynamicUCIDResponseMap){
        var docMaps = new Map();
        if(true == dynamicResponseSwitch){
        	docMaps.set(dynamicResponseMapping('Account_DOCs', accRecord,dynamicUCIDResponseMap));    
        }
        return docMaps;
    }
	
	//Method to Get Leads and Interested Vehicle Details
  /*
    function getleads(accUciddetails) {
        var accountrelatedLeadRecords = []; 
        var accountrelatedLeads =  [];
        var accountrelatedOpportunitievars = [];     
        var leadIdAndListOfLDsMap = new Map();
        var interestedvehicleNew = [];
        var oppList = [];
        
        //Getting Lead Id's Added Into a List
        if(accUciddetails[0].recordtypeid == PERSONRECORDTYPEID  && accUciddetails[0].leadperson.length>0) {                                                     
            for(let personaccountLeads of accUciddetails[0].leadperson) {
                accountrelatedLeads.add(personaccountLeads.id);
            }
        }
        else if(accUciddetails[0].recordtypeid == COMPANYRECORDTYPEID  && accUciddetails[0].Leads__r.size()>0) {                                                     
            for(Lead__c companyaccountLeads :  accUciddetails[0].Leads__r) {
                accountrelatedLeads.add(companyaccountLeads.id);
            }
        }
        //Passing Lead Id's to fetch Interested Vehicle Details
        if(accountrelatedLeads.size()>0) {
            
            //Implementing dynamic query creation
            console.log('------OneAPISearchDomainMain.interestedVehiclesResponseTagAPIName---->'+ OneAPISearchDomainMain.interestedVehiclesResponseTagAPIName);
            String interestedVehicleQueryFields = OneAPISearchDomainMain.interestedVehiclesResponseTagAPIName;
            console.log('-----dynamicResponseSwitch---->'+ dynamicResponseSwitch);
            List<Lead__c> leadList = new List<Lead__c>();
            if(true == dynamicResponseSwitch){
                console.log('-- INSIDE IF ---Interested Vehicle DYNAMIC ---->');
                if(String.isNotBlank(interestedVehicleQueryFields)){
                    String queryStringInterestedVehicle  = 'SELECT Id, (SELECT ' + interestedVehicleQueryFields +
                        ' FROM Lead_Vehicle_Details__r WHERE RecordTypeId =: LEADDETAILSINTVEHICLERTID order by CreatedDate DESC limit 5)' +
                        ' From Lead__c where ID In :accountrelatedLeads';
                    
                    console.log('-----queryStringInterestedVehicle---->'+ queryStringInterestedVehicle);
                    leadList = Database.query(queryStringInterestedVehicle);
                    console.log('-----leadList---->'+ leadList);
                }
                
                if(null != leadList && leadList.size()>0){
                    for(Lead__c objLead : leadList){
                        //All Interested Vehicles related to Lead
                        if(objLead.Lead_Vehicle_Details__r.size()>0) {
                            leadIdAndListOfLDsMap.put(objLead.Id, objLead.Lead_Vehicle_Details__r);
                        }
                    }
                }
            }
        }
        console.log('leadIdAndListOfLDsMap===>Lead'+leadIdAndListOfLDsMap);
        for(Id leadrelatedInterestedVehicle: leadIdAndListOfLDsMap.keyset()) {
            for(Lead_Details__c interestedVehicle : leadIdAndListOfLDsMap.get(leadrelatedInterestedVehicle)) {
                interestedvehicleNew.add(interestedVehicle);
            }
        }
        console.log('interestedvehicleNew==>Lead'+interestedvehicleNew);
        
        // Passing Person Account Leads and Interested Vehicle Details 
        if(accUciddetails[0].Lead_Contact__r != null && accUciddetails[0].Lead_Contact__r.size()>0 && accUciddetails[0].recordtypeid == PERSONRECORDTYPEID) {
            for(Lead__c personAccountLeads :  accUciddetails[0].Lead_Contact__r){
                Map<String,Object> personaccountLeadMaps = getleadorOpportunityDetails(personAccountLeads,null,leadIdAndListOfLDsMap.get(personAccountLeads.Id));
                accountrelatedLeadRecords.add(personaccountLeadMaps);
            }
            console.log('accountrelatedLeadRecords'+accountrelatedLeadRecords);
        }
        // Passing Company Account Leads and Interested Vehicle Details
        else if(accUciddetails[0].Leads__r != null && accUciddetails[0].Leads__r.size()>0 && accUciddetails[0].recordtypeid == COMPANYRECORDTYPEID) {
            for(Lead__c companyAccountLeads :  accUciddetails[0].Leads__r){
                Map<String,Object> companyaccountLeadMaps = getleadorOpportunityDetails(companyAccountLeads,null,leadIdAndListOfLDsMap.get(companyAccountLeads.Id));
                accountrelatedLeadRecords.add(companyaccountLeadMaps);
            }
        }
        return accountrelatedLeadRecords;
    }
    
    //Method to Get Opportunities and Interested Vehicle Details
    //removed param - User ownerRecord
    public static List<Object> getOpportunities (List<Account> accUciddetails) {
        List<Object> accountrelatedLeadRecords = new List<Object>(); 
        List<Id> accountrelatedOpportunities = new List<Id>();     
        Map<Id,List<Lead_Details__c>>leadIdAndListOfLDsMap = new Map<Id,List<Lead_Details__c>>();
        List<Lead_Details__c> interestedvehicleNew = new   List<Lead_Details__c>();
        
        if (accUciddetails[0].Opportunities.size()>0) {
            for(Opportunity accountwithOpportunities :  accUciddetails[0].Opportunities) {
                accountrelatedOpportunities.add(accountwithOpportunities.id);
            }
            // Opportunity related Interested Vehicle's
            if(accountrelatedOpportunities.size()>0){
                
                //Implementing dynamic query creation
                console.log('------OneAPISearchDomainMain.interestedVehiclesResponseTagAPIName---->'+ OneAPISearchDomainMain.interestedVehiclesResponseTagAPIName);
                String interestedVehicleQueryFields = OneAPISearchDomainMain.interestedVehiclesResponseTagAPIName;
                console.log('-----dynamicResponseSwitch---->'+ dynamicResponseSwitch);
                List<Opportunity> leadList = new List<Opportunity>();
                
                if(true == dynamicResponseSwitch){
                    console.log('-- INSIDE IF ---Interested Vehicle DYNAMIC Via Opportunity---->');
                    if(String.isNotBlank(interestedVehicleQueryFields)){
                        String queryStringInterestedVehicle  = 'SELECT Id, (SELECT ' + interestedVehicleQueryFields +
                            ' FROM Lead_Details__r WHERE RecordTypeId =: LEADDETAILSINTVEHICLERTID order by CreatedDate DESC limit 5)' +
                            ' From Opportunity WHERE Id IN :accountrelatedOpportunities';
                        
                        console.log('-----queryStringInterestedVehicle---->'+ queryStringInterestedVehicle);
                        leadList = Database.query(queryStringInterestedVehicle);
                        console.log('-----leadList---->'+ leadList);
                    }
                    
                    if(null != leadList && leadList.size()>0){
                        for(Opportunity objLead : leadList){
                            //All Interested Vehicles related to Lead
                            if(objLead.Lead_Details__r.size()>0) {
                                leadIdAndListOfLDsMap.put(objLead.Id, objLead.Lead_Details__r);    
                            }
                        }
                    }
                }
            }
            
            console.log('leadIdAndListOfLDsMap===>Opportunity'+leadIdAndListOfLDsMap);
            for(Id opportunityrelatedInterestedVehicle: leadIdAndListOfLDsMap.keyset()) {
                for(Lead_Details__c interestedVehicle : leadIdAndListOfLDsMap.get(opportunityrelatedInterestedVehicle)) {
                    interestedvehicleNew.add(interestedVehicle);
                }
            }
            console.log('interestedvehicleNew==>Opportunity'+interestedvehicleNew);
        }    
        
        if(accUciddetails[0].Opportunities != null && accUciddetails[0].Opportunities.size()>0 ) {
            for(Opportunity opporttunityRecords :  accUciddetails[0].Opportunities){
                Map<String,Object> accountopportunityMaps = getleadorOpportunityDetails(null,opporttunityRecords,leadIdAndListOfLDsMap.get(opporttunityRecords.Id));
                accountrelatedLeadRecords.add(accountopportunityMaps);
            } 
        }
        return accountrelatedLeadRecords;
    } */
	
	 //Method to Get Addresses
    function getAddresses(accUciddetails,dynamicUCIDResponseMap) {
        var addressList = [];
		var addressInput = accUciddetails[0].address;
		console.log("addressInput:::::::::" + addressInput);
		console.log("addressInput length:::::::::" + addressInput.length);
		
        if(accUciddetails[0].address.length>0) {
            for(let eachaddres of accUciddetails[0].address){
                var addressMaps = addressDetails(eachaddres,dynamicUCIDResponseMap);
                addressList.push(addressMaps);
            }
        }
        console.log('addresslist'+ addressList);
        return addressList;
    }
    
    //Address Mappings 
    function addressDetails(addres,dynamicUCIDResponseMap){
        var addressMaps=new Map();
        if(true == dynamicResponseSwitch){
            addressMaps.set(dynamicResponseMapping('addressList', addres,dynamicUCIDResponseMap));    
        }
        return addressMaps;
    }
	
	function getRetailCopies (accUciddetails,request,dynamicUCIDResponseMap) {
        //Boolean isDealerGCCodeEmpty  = requestMap.get('dealerGcCode') == null || String.isBlank(requestMap.get('dealerGcCode'));
        //Boolean isDealerNDCodeEmpty  = requestMap.get('dealerNdCode') == null || String.isBlank(requestMap.get('dealerNdCode'));
        //Boolean isDealerGSCodeEmpty  = requestMap.get('dealerGsCode') == null || String.isBlank(requestMap.get('dealerGsCode'));
		
		var isDealerGCCodeEmpty  = Boolean(!request.dealerGcCode);
		var isDealerNDCodeEmpty  = Boolean(!request.dealerNdCode);
		var isDealerGSCodeEmpty  = Boolean(!request.dealerGsCode);
        
        var retailCopiesList = [];
        if(!isDealerGCCodeEmpty || !isDealerNDCodeEmpty || !isDealerGSCodeEmpty){
              console.log('entered below--dealer --');  
            if (accUciddetails[0].accountlink != null && accUciddetails[0].accountlink.length>0) {
                for(let accLnk of accUciddetails[0].accountlink) {
                    console.log('insdie for Loop retailcopies');  
                    var retailMaps = getRetailCopiesMap(accLnk,dynamicUCIDResponseMap);
                    retailCopiesList.add(retailMaps);
                }
            }
        }
        else {
            return retailCopiesList;
        }
         console.log('retailCopiesList'+retailCopiesList);
        return retailCopiesList;
    }
    
    //RetailCopies  mappings
    //removed param - User ownerRecord
    function getRetailCopiesMap(retailCopies,dynamicUCIDResponseMap){
      console.log('entered into  retailcopies');
        //String name = 'retailCopies';
        var retailCopiesMap = new Map();
        if(true == dynamicResponseSwitch){
        	retailCopiesMap.set(dynamicResponseMapping('retailCopies',retailCopies,dynamicUCIDResponseMap));    
        }
        return retailCopiesMap;
    }

//To set the dynamic response for object passed in aregumets
    function dynamicResponseMapping(tagName, objectName,dynamicUCIDResponseMap){
        console.log('INSIDE dynamicResponseMapping======= ');
        //sObject obj;
        var value='';
        var objectValue;
        var objName;
        //Vehicle_Relationship__c vehicleRelationshipObject;
        //Account_Link__c accLink;
        var responseMap = new Map();
        var apiNameList;
        var metadataFieldsMap ;
		
		 console.log('UCID dynamicUCIDResponseMap in dynamicResponseMapping -------------->' + dynamicUCIDResponseMap.size);
		 //console.log('UCID accountDetailsmap in dynamicResponseMapping -------------->' + dynamicUCIDResponseMap.get('accountDetails'));
		
        console.log('dynamicUCIDResponseMap.get(tagName) ====>' + dynamicUCIDResponseMap.get(tagName));
		console.log('tagname -------------->' + tagName);
		
		var ucidMap = new Map(Object.entries(objectName));
		console.log('ucidMap -------------->' + ucidMap);
		
        metadataFieldsMap = dynamicUCIDResponseMap.get(tagName);
		
		if(tagName.equalsIgnoreCase("DOC_Information_DOCs")){
            console.log('INSIDE DOC_INFORMATION_DOC====>');
            //obj = (Doc_Information__c) objectName;
            objName = 'Doc_Information__c';
        }
		
		else if(tagName.equalsIgnoreCase("addressList")){
            console.log('INSIDE ADDRESS_LIST --- Address__c ====>');
            //obj = (Address__c) objectName;
            objName = 'Address__c';
        }
		
		else if(tagName.equalsIgnoreCase("accountDetails")){
            console.log('INSIDE ACCOUNT_DETAILS====>');
            //obj = (Account) objectName;
            objName = 'Account';
        }
        /*if(tagName.equalsIgnoreCase(OneAPIUtilityHelper.VEHICLE_RELATIONSHIPS) && (objectName instanceof Vehicle_Relationship__c)){
            console.log('INSIDE VEHICLE_RELATIONSHIPS====>');
            obj = (Vehicle_Relationship__c) objectName;
            objName = 'Vehicle_Relationship__c';
        }else if(tagName.equalsIgnoreCase(OneAPIUtilityHelper.RETAIL_COPIES) && (objectName instanceof Account_Link__c)){
            console.log('INSIDE RETAIL_COPIES====>');
            obj = (Account_Link__c) objectName;
            objName = 'Account_Link__c';
        }else if(tagName.equalsIgnoreCase(OneAPIUtilityHelper.ACCOUNT_DETAILS) && (objectName instanceof Account)){
            console.log('INSIDE ACCOUNT_DETAILS====>');
            obj = (Account) objectName;
            objName = 'Account';
        }else if(tagName.equalsIgnoreCase(OneAPIUtilityHelper.DOC_INFORMATION_DOC) && (objectName instanceof Doc_Information__c)){
            console.log('INSIDE DOC_INFORMATION_DOC====>');
            obj = (Doc_Information__c) objectName;
            objName = 'Doc_Information__c';
        }else if(tagName.equalsIgnoreCase(OneAPIUtilityHelper.ACCOUNT_DOC) && (objectName instanceof Account)){
            console.log('INSIDE ACCOUNT_DOC====>');
            obj = (Account) objectName;
            objName = 'Account';
        }else if(tagName.equalsIgnoreCase(OneAPIUtilityHelper.LEAD_LIST) && (objectName instanceof Opportunity)){
            console.log('INSIDE LEAD_LIST --- Opportunity ====>');
            obj = (Opportunity) objectName;
            objName = 'Opportunity';
        }else if(tagName.equalsIgnoreCase(OneAPIUtilityHelper.LEAD_LIST) && (objectName instanceof Lead__c)){
            console.log('INSIDE LEAD_LIST --- Lead__c ====>');
            obj = (Lead__c) objectName;
            objName = 'Lead__c';
        }else if(tagName.equalsIgnoreCase(OneAPIUtilityHelper.ADDRESS_LIST) && (objectName instanceof Address__c)){
            console.log('INSIDE ADDRESS_LIST --- Address__c ====>');
            obj = (Address__c) objectName;
            objName = 'Address__c';
        }else if(tagName.equalsIgnoreCase(OneAPIUtilityHelper.INTERESTED_VEHICLES) && (objectName instanceof Lead_Details__c)){
            console.log('INSIDE INTERESTED_VEHICLES --- Lead_Details__c ====>');
            obj = (Lead_Details__c) objectName;
            objName = 'Lead_Details__c';
        }else if(tagName.equalsIgnoreCase(OneAPIUtilityHelper.WHOLESALE_C2C_WITH_DEALER) && (objectName instanceof Account_Link__c)){
            console.log('INSIDE WHOLESALE_C2C_WITH_DEALER --- Account_Link__c ====>');
            obj = (Account_Link__c) objectName;
            objName = 'Account_Link__c';
        }else if(tagName.equalsIgnoreCase(OneAPIUtilityHelper.WHOLESALE_C2C_WITHOUT_DEALER) && (objectName instanceof Account)){
            console.log('INSIDE WHOLESALE_C2C_WITHOUT_DEALER --- Account ====>');
            obj = (Account) objectName;
            objName = 'Account';
        }else if(tagName.equalsIgnoreCase(OneAPIUtilityHelper.RETAIL_C2C) && (objectName instanceof Account_Link__c)){
            console.log('INSIDE RETAIL_C2C --- Account ====>');
            obj = (Account_Link__c) objectName;
            objName = 'Account_Link__c';
        }
        
        //To handle Date format in response
        Schema.SObjectType t = Schema.getGlobalDescribe().get(objName);    
        Schema.DescribeSObjectResult r = t.getDescribe(); 
        Date dateValue; */
                
        //if(null != obj){
			if(null != objName){
            //console.log('obj value ====>' + obj);
			console.log('obj value ====>' + objName);
            console.log('metadataFieldsMap ====>' + metadataFieldsMap);
			
            if(metadataFieldsMap.size>0){
             
				
				for(let responseTag of metadataFieldsMap.keys()){
                    console.log('responseTag ====>' + responseTag);
                    if(responseTag.equalsIgnoreCase('salesConsultantFedId')){
                        responseMap.set(responseTag, '');
                    }
					else if (responseTag =='recordTypeName'){							
						responseMap.set(responseTag, ucidMap.get('rname'));				
					}
					else {
                        objectValue = metadataFieldsMap.get(responseTag);
						
                        console.log('objectValue ====>' + objectValue);
                        if(objectValue.equalsIgnoreCase('NA')){
                            console.log('INSIDE IF ====>');
                            responseMap.set(responseTag, '');                    
                        }else {
                            console.log('=== INSIDE ELSE ==');
                            if(objectValue.includes('-')){
                                apiNameList = objectValue.split('-');
                                console.log('apiNameList ====>' + apiNameList);
								
								
                                //if(null != obj.getSObject(apiNameList[0].trim())){
									
                                    if(apiNameList != null && apiNameList.length == 2){
										key = (apiNameList[1].toLowerCase()).trim();
										console.log('key ====>' + key);
                                        value = ucidMap.get(key);
										console.log('value ====>' + value);
                                        responseMap.set(responseTag, (value == null || value.length == 0) ? '' : value);
                                    }									
									
									else if(apiNameList != null && apiNameList.size() == 3){
                                        key = (apiNameList[2].toLowerCase()).trim();
										console.log('key ====>' + key);
                                        value = ucidMap.get(key);
										console.log('value ====>' + value);
                                        responseMap.set(responseTag, (value == null || value.length == 0) ? '' : value);
                                    }
									
									else if(apiNameList != null && apiNameList.size() == 4){
                                        key = (apiNameList[3].toLowerCase()).trim();
										console.log('key ====>' + key);
                                        value = ucidMap.get(key);
										console.log('value ====>' + value);
                                        responseMap.set(responseTag, (value == null || value.length == 0) ? '' : value);
                                    }
                                //}                                
                            }else {
                                /*Schema.DescribeFieldResult f = r.fields.getMap().get(metadataFieldsMap.get(responseTag)).getDescribe();
                                if(f.getType() == Schema.DisplayType.Date){
                                    dateValue = Date.valueOf(obj.get(metadataFieldsMap.get(responseTag))); 
                                    if(null == dateValue){
                                    	responseMap.put(responseTag, '');    
                                    }else{
                                        responseMap.put(responseTag, dateValue);
                                    }
                                }else { */
									console.log ('objectValue ::::::::::: ' + objectValue);
									if(objectValue != null)
									key = (objectValue.toLowerCase()).trim();
									
                                	value = ucidMap.get(key);
                                    responseMap.set(responseTag, (value == null || value.length == 0) ? '' : value);
                                //}
                            } 
                        }
                    }
                }
            }
        }
		console.log('responseMap created dynamically objName ====>' + objName)
        console.log('responseMap created dynamically ====>' + responseMap); 
        return responseMap;
    }	
	


module.exports = {
  performValidations,
  performSearch,
  getAccountDetails
};