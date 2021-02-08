var interestedVehicleDetailsResponseTagAPIName = '';
var leadDetailsResponseTagAPIName = '';
var bookingDetailsResponseTagAPIName = '';
var dynamicResponseMap = new Map();
var enabledDynamicResponse; 
	
	
String.prototype.equalsIgnoreCase = function (compareString) 
	{ return this.toUpperCase() === compareString.toUpperCase(); 
	};
 
function performRequestValidations(request) {
    
        var isValidRequest = false;
        
        var isApplicationNameAvailable = Boolean(request.applicationName);
        var isMessageIdAvailable = Boolean(request.messageId);
        var isMarketAvailable = Boolean(request.market);
        var isSearchTypeAvailable = Boolean(request.searchType);
        var isLeadIdAvailable = Boolean(request.leadId);
        var isLeadNoAvailable = Boolean(request.leadNo);
        var isBookingIdAvailable = Boolean(request.bookingId);
        var isGetLeadDetailsSearch = isSearchTypeAvailable && ((request.searchType).equalsIgnoreCase('GetLeadDetails'));
        
        if(isGetLeadDetailsSearch){
            isValidRequest =  isApplicationNameAvailable && isMessageIdAvailable && isMarketAvailable && isSearchTypeAvailable &&
                              (isLeadIdAvailable || isLeadNoAvailable || isBookingIdAvailable);
           console.log('isValidRequest:::::::::::'+isValidRequest);
        }
        
        return isValidRequest;
        
        
    }
	
	
function performLeadSearch(oneAPIMetadataList, request) {
	
        console.log('Inside performLeadSearch');
        var isValidRequest = false;        
        var queryResults = new Map();
        var leadObjString = oneAPIMetadataList[0].lead_object__c;
		var returnMap = new Map();
        
        enabledDynamicResponse = oneAPIMetadataList[0].enabled_dynamic_response__c;
        if(true == enabledDynamicResponse){
        	createDynamicResponseTagsAndFields(oneAPIMetadataList[0].search_lead_details_response_mappings__c, leadObjString);    
        }
                
        try{
            var searchType = request.searchType;
			
            if(searchType!=null && searchType.equalsIgnoreCase('GetLeadDetails')){				
                    queryResults = performGetLeadDetailsSearch(oneAPIMetadataList, request);
                	console.log('Print the queryResults ---> ' + queryResults);
					
					isValidRequest = true;
                	
					/*if(leadObjString.equalsIgnoreCase('Lead__c')){
                        responseMap.put('leadDetails', getResponseMappings(oneAPIMetadataList,queryResults , requestMap));
                		console.log('Print response map after mapping ---> ' + responseMap);
                		isValidRequest = true;
                    }else if(leadObjString.equalsIgnoreCase('Opportunity')){
                    	responseMap.put('leadDetails', getResponseMappingsForOpportunity(oneAPIMetadataList,queryResults , requestMap));
                		console.log('Print response map after mapping ---> ' + responseMap);
                		isValidRequest = true;
                	}  */              	
             }                
                       
        }catch(error) {
            isValidRequest = false;
            console.error( "error in try block of performLeadSearch :::::::::" + error);
			//throw error;
         }
        
		returnMap.set('queryResults', queryResults);
		returnMap.set('isValidRequest', isValidRequest);
		returnMap.set('leadObjString', leadObjString);
		
		return returnMap;
        
    }
	
function performGetLeadDetailsSearch(oneAPIMetadataList, request) {
        console.log('Inside performGetLeadDetailsSearch');
        var queryResults = new Map();
        var leadQuery;
        var leadbasequery;
        var interestedVehQuery;
        var bookingQuery;
        var leadObjString = oneAPIMetadataList[0].lead_object__c;
       
        if(true == enabledDynamicResponse){
            
            console.log('DYNAMIC QUERY Formation ---> ');
            
            if(leadObjString.equalsIgnoreCase('Lead__c')){
            	leadbasequery = 'SELECT ' + leadDetailsResponseTagAPIName + ',l.OwnerId, al1.sfId as al1sfId, u.FederationIdentifier FROM herokusbox.Lead__c l INNER JOIN herokusbox.account a on l.Contact__c::VARCHAR = a.sfid::VARCHAR INNER JOIN herokusbox.account ad on l.Assigned_dealer__c::VARCHAR = ad.sfid:: VARCHAR left JOIN herokusbox.account ac on l.Company_Account__c::VARCHAR = ac.sfid::VARCHAR left JOIN herokusbox.account_link__c al2 on l.Retail_Contact__c::VARCHAR = al2.sfid::VARCHAR left JOIN herokusbox.account_link__c al1 on l.Retail_Company__c::VARCHAR = al1.sfid::VARCHAR left JOIN herokusbox.contact c on l.Sales_Consultant__c::VARCHAR = c.sfid::VARCHAR left JOIN herokusbox.user u on l.OwnerId::VARCHAR = u.sfid::VARCHAR INNER JOIN herokusbox.recordtype recordType ON l.recordTypeID::VARCHAR = recordType.sfid::VARCHAR left JOIN herokusbox.Campaign cm on l.Source_Campaign__c::VARCHAR = cm.sfid::VARCHAR left JOIN herokusbox.Vehicle__c v on l.Purchased_Vehicle__c::VARCHAR = v.sfid::VARCHAR ';            	
            }else {
                leadbasequery = 'SELECT ' + leadDetailsResponseTagAPIName + ',o.OwnerId, al1.sfId as al1sfId, u.FederationIdentifier FROM herokusbox.opportunity o INNER JOIN herokusbox.account a on o.AccountId::VARCHAR = a.sfid::VARCHAR INNER JOIN herokusbox.account ad on o.Assigned_dealer__c::VARCHAR = ad.sfid:: VARCHAR left JOIN herokusbox.account ac on o.Company_Account__c::VARCHAR = ac.sfid::VARCHAR left JOIN herokusbox.account_link__c al2 on o.Retail_Contact__c::VARCHAR = al2.sfid::VARCHAR left JOIN herokusbox.account_link__c al1 on o.Retail_Company__c::VARCHAR = al1.sfid::VARCHAR left JOIN herokusbox.contact c on o.Sales_Consultant__c::VARCHAR = c.sfid::VARCHAR left JOIN herokusbox.user u on o.OwnerId::VARCHAR = u.sfid::VARCHAR INNER JOIN herokusbox.recordtype recordType ON o.recordTypeID::VARCHAR = recordType.sfid::VARCHAR  left JOIN herokusbox.Campaign cm on o.CampaignId::VARCHAR = cm.sfid::VARCHAR left JOIN herokusbox.Vehicle__c v on o.Purchased_Vehicle__c::VARCHAR = v.sfid::VARCHAR ';                
            }
            
            interestedVehQuery = 'SELECT ' + interestedVehicleDetailsResponseTagAPIName + ' FROM herokusbox.Lead_Details__c ld ';
            
            bookingQuery = 'SELECT ' + bookingDetailsResponseTagAPIName + ' FROM herokusbox.Booking__c b ';
            
        }
       
        
        if(leadObjString.equalsIgnoreCase('Lead__c')){
           
		   if(Boolean(request.leadId)){ 
		   
                var leadIdInReq = request.leadId;
                
                interestedVehQuery += ' AND ld.Lead__c =' + '\''+ leadIdInReq + '\'' ;
				
                bookingQuery += ' AND b.Lead__c =' + '\''+ leadIdInReq + '\'' ;
				
                leadQuery = leadbasequery + ' AND l.sfId='  + '\''+ leadIdInReq + '\'';
				
                //console.log('Print the lead query --->' + leadQuery);
				
                //leadDetail = Database.query(leadQuery);
                console.log('lead query ---> '+leadQuery);
                //intVehicle =  Database.query(interestedVehQuery);
                console.log('Interested Vehicle query ---> '+interestedVehQuery);
                //bookingDet = Database.query(bookingQuery);
                console.log('Booking details query ---> '+bookingQuery);                
            }
			
			else if(Boolean(request.leadNo)){ 
			
                var leadName = request.leadNo;
				
                var leadId = '(SELECT sfId from herokusbox.Lead__c where Name = ' + leadName + ')';
				
                leadQuery = leadbasequery + ' AND sfId='  + leadId;
				
                console.log('lead query --->' + leadQuery);
                //leadDetail = Database.query(leadQuery);
                interestedVehQuery += ' AND ld.Lead__c =' + leadId;;
                //intVehicle =  Database.query(interestedVehQuery);
                console.log('Interested Vehicle query ---> '+interestedVehQuery);
                bookingQuery += ' AND b.Lead__c =' + leadId;
                //bookingDet = Database.query(bookingQuery);
                console.log('Booking details query ---> '+bookingDet);
            }
			
			else if(Boolean(request.bookingId)){
				
                var bookingId = request.bookingId;
				
                var booking = '(SELECT Lead__c from herokusbox.Booking__c where sfId = ' + bookingId +')' ;
				
                leadQuery = leadbasequery + ' AND l.sfId='  + booking;				
                console.log('lead query --->' + leadQuery);
                //leadDetail = Database.query(leadQuery);
                interestedVehQuery += ' AND ld.Lead__c =' + booking;
                //intVehicle =  Database.query(interestedVehQuery);
                console.log('Interested Vehicle query ---> '+interestedVehQuery);
                bookingQuery += ' AND b.Lead__c =' + '\''+ booking;
                //bookingDet = Database.query(bookingQuery);
                console.log('Booking details query ---> '+bookingQuery);
            }
            
            if(leadQuery != null){
                queryResults.set('leadQuery',leadQuery);
            }
            if(interestedVehQuery != null && interestedVehQuery.length > 0){
                queryResults.set('interestedVehQuery',interestedVehQuery);
            }
            if(bookingQuery != null && bookingQuery.length > 0){
                queryResults.set('bookingQuery',bookingQuery);
            }
        }else if(leadObjString.equalsIgnoreCase('Opportunity')){
			
            if(Boolean(request.leadId)){                                
                
				var leadIdInReq = request.leadId; 
				
                interestedVehQuery += ' AND ld.Related_Lead__c =' + '\''+ leadIdInReq + '\'' ;
				
                bookingQuery += ' AND b.Opportunity__c=' + '\''+ leadIdInReq + '\'' ;
				
                leadQuery = leadbasequery + ' AND o.sfId ='  + '\''+ leadIdInReq + '\'';
				
                console.log('lead query --->' + leadQuery);
                //opptyDetail = Database.query(leadQuery);
                //console.log('opptyList after query execution ---> '+opptyDetail);
                //intVehicle =  Database.query(interestedVehQuery);
                console.log('Interested Vehicle query ---> '+interestedVehQuery);
                //bookingDet = Database.query(bookingQuery);
                console.log('Booking details query ---> '+bookingQuery);
            }
			
			else if(Boolean(request.leadNo)){  
			
                var leadName = request.leadNo;
				
                var opptyId = '(SELECT sfId from herokusbox.Opportunity where Lead_No__c = ' + leadName + ')';
				
                leadQuery = leadbasequery + ' AND o.sfId='  + opptyId;
                console.log('lead query --->' + leadQuery);
                //opptyDetail = Database.query(leadQuery);
                interestedVehQuery += ' AND ld.Related_Lead__c=' + opptyId;
                //intVehicle =  Database.query(interestedVehQuery);
                console.log('Interested Vehicle query ---> '+interestedVehQuery);
                bookingQuery += ' AND b.Opportunity__c=' + '\''+ opptyId;
                //bookingDet = Database.query(bookingQuery);
                console.log('Booking details query ---> '+bookingQuery);
            }
			
			else if(Boolean(request.bookingId)){
				
                var bookingId = request.bookingId;;
				
                var booking = '(SELECT Opportunity__c from herokusbox.Booking__c where sfId = ' + bookingId + ')' ;
                leadQuery = leadbasequery + ' AND o.sfId='  + booking;
                console.log('lead query --->' + leadQuery);
                //opptyDetail = Database.query(leadQuery);
                interestedVehQuery += ' AND ld.Related_Lead__c=' + booking;
                //intVehicle =  Database.query(interestedVehQuery);
                console.log('Interested Vehicle query ---> '+interestedVehQuery);
                bookingQuery += ' AND b.Opportunity__c=' + booking;
                //bookingDet = Database.query(bookingQuery);
                console.log('Booking details query ---> '+bookingQuery);
            }
            
            if(leadQuery != null){
                queryResults.set('leadQuery',leadQuery);
            }
            if(interestedVehQuery != null && interestedVehQuery.length > 0){
                queryResults.set('interestedVehQuery',interestedVehQuery);
            }
            if(bookingQuery != null && bookingQuery.length > 0){
                queryResults.set('bookingQuery',bookingQuery);
            }
        }
        
        return queryResults;
    }
	
	
function getResponseMappings(oneAPIMetadataList, queryResults,request)  {
                                    
        var responseMap = new Map();
        
        
        var resultLead = queryResults.get('Lead');
        
        responseMap.set('messageId', request.messageId);
        responseMap.set('messageStatus', 'Success');
        responseMap.set('errorCode', '');
        responseMap.set('errorMessage', '');
        responseMap.set('errorCategory', '');
        responseMap.set('applicationName', request.applicationName);
        
        
        if(true == enabledDynamicResponse){
            console.log('Lead__c DYNAMIC Respone --->');
            responseMap.set(dynamicResponseMapping('leadDetails', resultLead, request, leadObjectString));
        }
        
                   
        var noOfNotes;
        if(oneAPIMetadataList != null){
			
            if(Boolean(oneAPIMetadataList[0].salesforce_environment__c)){
				
                console.log('noOfNotes BEFORE------>'+noOfNotes);
                //noOfNotes = OneAPIUtilityHelper.noOfNotes(resultLead.sfId, oneAPIMetadataList[0].salesforce_environment__c);
                responseMap.set('noOfNotes',(noOfNotes == null || noOfNotes.length == 0) ? '' : noOfNotes); 
                console.log('noOfNotes AFTER------>'+noOfNotes);
            }
        }
        
        // Mapping Interested Vehicle Information
        if(queryResults.get('InterestedVehicle') != null && ((queryResults.get('InterestedVehicle')).size() > 0)){
            var intVehList = queryResults.get('InterestedVehicle');
        
		var intVehFinalList = mapInterestedVehicleInfo(intVehList, request);   
                    
        responseMap.set('interestedVehicleDetails',intVehFinalList);
        }
        
        
        // Mapping Booking Information
        
        if(queryResults.get('Booking') != null && ((queryResults.get('Booking')).size() > 0)){
            var bookingList = queryResults.get('Booking');
        var bookingFinalList = mapBookingInformation(bookingList, request);
      
        responseMap.set('bookingDetails',bookingFinalList);
        }
        
        console.log('Print the response map ---> ' + responseMap);
        return responseMap;
    
    
    }
	

function getResponseMappingsForOpportunity(oneAPIMetadataList, queryResults, request)  {
                                    
        var responseMap = new Map();
        
        var resultLead = queryResults.get('Opportunity');
        
        responseMap.set('messageId', request.messageId);
        responseMap.set('messageStatus', 'Success');
        responseMap.set('errorCode', '');
        responseMap.set('errorMessage', '');
        responseMap.set('errorCategory', '');
        responseMap.set('applicationName', request.applicationName);
        
        
        if(true == enabledDynamicResponse){
            console.log('Lead__c DYNAMIC Respone --->');
            responseMap.set(dynamicResponseMapping('leadDetails', resultLead, request, leadObjectString));
        }
                
        var noOfNotes;
        if(oneAPIMetadataList != null){
            if(Boolean(oneAPIMetadataList[0].salesforce_environment__c)){
                console.log('noOfNotes BEFORE------>'+noOfNotes);
                //noOfNotes = OneAPIUtilityHelper.noOfNotes(resultLead.sfId, oneAPIMetadataList[0].salesforce_environment__c);		
				responseMap.set('noOfNotes',(noOfNotes == null || noOfNotes.length == 0) ? '' : noOfNotes);  
                console.log('noOfNotes AFTER------>'+noOfNotes);
            }
        }
        
        // Mapping Interested Vehicle Information
        if(queryResults.get('InterestedVehicle') != null && ((queryResults.get('InterestedVehicle')).size() > 0)){
            var intVehList = queryResults.get('InterestedVehicle');
        var intVehFinalList = mapInterestedVehicleInfo(intVehList, request);    
                    
        	responseMap.set('interestedVehicleDetails',intVehFinalList);
        }
        
        // Mapping Booking Information
        
        if(queryResults.get('Booking') != null && ((queryResults.get('Booking')).size() > 0)){
            var bookingList = queryResults.get('Booking');
       		var bookingFinalList = mapBookingInformation(bookingList, request);
      
        	responseMap.set('bookingDetails',bookingFinalList);
        }
        
        
        console.log('Print the response map ---> ' + responseMap);
        return responseMap;
    }
   

function mapInterestedVehicleInfo(intVehList, request){
        var intVehFinalList;
        var intVehicleMap = new Map();
        
          if(true == enabledDynamicResponse){
            console.log('--- INSIDE mapInterestedVehicleInfo --- DYNAMIC');
            for(let veh of intVehList){
                intVehicleMap.set(dynamicResponseMapping('interestedVehicleDetails', veh, request, null));
                console.log('---  INTERESTED_VEHICLE_DETAILS Map---' + intVehicleMap);
                intVehFinalList.add(intVehicleMap);                  
                console.log('--- INTERESTED_VEHICLE_DETAILS List---' + intVehFinalList);
            }  
        }
        
        
        return intVehFinalList;
    }   
	
function mapBookingInformation(bookingList, request){
	
        var bookingFinalList;		
		var bookingMap = new Map();
        if(true == enabledDynamicResponse){
            console.log('--- INSIDE mapBookingInformation --- DYNAMIC');
            for(let bookingObj of bookingList){
                bookingMap.set(dynamicResponseMapping('bookingDetails', bookingObj, request, null));
                console.log('--- BOOKING_DETAILS Map ---' + bookingMap);
                bookingFinalList.add(bookingMap); 
                console.log('--- BOOKING_DETAILS List ---' + bookingFinalList);
            }
        }
        

		return bookingFinalList;        
    }
	
function createDynamicResponseTagsAndFields(mtdRecordFieldValue, leadObjString){
        console.log('INSIDE Search createDynamicResponseTagsAndFields -------------->');
        var metadataMap = new Map();
        var apiNameList;
		var result = mtdRecordFieldValue.split('&&');
        for(i=0; i<result.length;i++){
            console.log('result value -------------->' + result[i]);
            
			var arrayfield = result[i].split('=');
			
            console.log('arrayfield.get(0)-------------->' + arrayfield[0]);
            console.log('arrayfield.get(1)-------------->' + arrayfield[1]);
            metadataMap.set(String(arrayfield[0]), String(arrayfield[1]));
        }
        console.log('metadataMap-------------->' + metadataMap);
		
        for(let str of metadataMap.keys()){			
			
            if(str.trim().equalsIgnoreCase('leadDetails')){
                leadDetailsResponseTagAPIName = getqueryFields('leadDetails', metadataMap.get(str), leadObjString);
                console.log('leadDetailsResponseTagAPIName-------------->' + leadDetailsResponseTagAPIName);
            }            
            if(str.trim().equalsIgnoreCase('interestedVehicleDetails')){
                interestedVehicleDetailsResponseTagAPIName = getqueryFields('interestedVehicleDetails', metadataMap.get(str), leadObjString);
                console.log('interestedVehicleDetailsResponseTagAPIName-------------->' + interestedVehicleDetailsResponseTagAPIName);
            }
            if(str.trim().equalsIgnoreCase('bookingDetails')){
                bookingDetailsResponseTagAPIName = getqueryFields('bookingDetails', metadataMap.get(str), leadObjString);
                console.log('bookingDetailsResponseTagAPIName-------------->' + bookingDetailsResponseTagAPIName);
            }
        }
    }
	
function getqueryFields(tagName, fieldsString, leadObjString){
        console.log('INSIDE getqueryFields-------------->');
        var responseTags = ''; 
        var responseTagAPIName = '';
        var responseTagAPINameSet = [];
        var value='';
        var metadataFieldsMap = new Map();
        var apiNameList;
        
		var result = fieldsString.split(',');
		
		for(i=0; i<result.length;i++){
            console.log('row value -------------->' + result[i]);
            
			var arrayfield = result[i].split(':');			
			
            console.log('arrayfield -------------->' + arrayfield);
			
            metadataFieldsMap.set(String(arrayfield[0]), String(arrayfield[1]));
			
            console.log('Name + arrayfield[1] -------------->' + arrayfield[0] + ' ------ ' + arrayfield[1]);
            console.log('Condition value -------------->' + arrayfield[1].trim().equalsIgnoreCase('NA'));
            
			if(!(String(arrayfield[1]).equalsIgnoreCase("NA"))){
                
				 if(String(arrayfield[1]).includes('-')){
					 
                    apiNameList = String(arrayfield[1]).split('-');
					
                    console.log('apiNameList -------------->' + apiNameList + 'SIZE' + apiNameList.length);
					
                    if(apiNameList!= null && apiNameList.length == 2){
                        value = apiNameList[0].trim() + '.' + apiNameList[1].trim();
                    }else if(apiNameList!= null && apiNameList.length == 3){
                        value = apiNameList[0].trim() + '.' + apiNameList[1].trim() + '.' + apiNameList[2].trim();
                    }else if(apiNameList!= null && apiNameList.length == 4){
                        value = apiNameList[0].trim() + '.' + apiNameList[1].trim() + '.' + apiNameList[2].trim() + '.' + apiNameList[3].trim();
                    }
					console.log('value inside if -------------->' + value);
                }else {
					
                    if(tagName.equalsIgnoreCase('leadDetails')){
						
					 if(leadObjString.equalsIgnoreCase('Lead__c'))
                       value = 'l.' + String(arrayfield[1]).trim();
					 else if(leadObjString.equalsIgnoreCase('Opportunity'))
					   value = 'o.' + String(arrayfield[1]).trim();
				   
					}
					
					else if(tagName.equalsIgnoreCase('interestedVehicleDetails'))
					 value = 'ld.' + String(arrayfield[1]).trim();
				 
				    else if(tagName.equalsIgnoreCase('bookingDetails'))
					 value = 'b.' + String(arrayfield[1]).trim();
				 
					
					console.log('value inside else -------------->' + value);
                }
            }
            else if(String(arrayfield[1]).equalsIgnoreCase("NA")){
				value = '';
			}				
            if(value != '')
            responseTagAPINameSet.push(value); 
        }
        
        dynamicResponseMap.set(tagName,metadataFieldsMap);
        console.log('dynamicResponseMap-------------->' + dynamicResponseMap);
        
        console.log('responseTagAPINameSet-------------->' + responseTagAPINameSet);
        
        responseTagAPINameSet.forEach(apiName => 
		responseTagAPIName += apiName + ' '
		); 
        
        responseTagAPIName = responseTagAPIName.trim();
        responseTagAPIName = responseTagAPIName.replace(/ /g, ',');	
		responseTagAPIName = responseTagAPIName.replace(/Retail_Contact__r/g, 'al2');
		responseTagAPIName = responseTagAPIName.replace(/Contact__r/g, 'a');
		responseTagAPIName = responseTagAPIName.replace(/Assigned_Dealer__r/g, 'ad');
		responseTagAPIName = responseTagAPIName.replace(/Company_Account__r/g, 'ac');
		responseTagAPIName = responseTagAPIName.replace(/Retail_Company__r/g, 'al1');
		responseTagAPIName = responseTagAPIName.replace(/Sales_Consultant__r/g, 'c');
		responseTagAPIName = responseTagAPIName.replace(/Account.ucid__c/g, 'a.ucid__c');
		
		responseTagAPIName = responseTagAPIName.replace(/recordType.Name/, 'recordType.Name as rname');		
		responseTagAPIName = responseTagAPIName.replace(/a.sfId/g, 'a.sfId as asfid');
		responseTagAPIName = responseTagAPIName.replace(/a.ucid__c/g, 'a.ucid__c as aucid');
		responseTagAPIName = responseTagAPIName.replace(/al2.sfId/g, 'al2.sfId as alsfid');
		responseTagAPIName = responseTagAPIName.replace(/al2.Retail_DMS_Customer_ID__c/g, 'al2.Retail_DMS_Customer_ID__c as alRetail_DMS_Customer_ID__c');
		responseTagAPIName = responseTagAPIName.replace(/ac.ucid__c/g, 'ac.ucid__c as acucid');
		responseTagAPIName = responseTagAPIName.replace(/al1.Retail_DMS_Customer_ID__c/g, 'al1.Retail_DMS_Customer_ID__c as al1Retail_DMS_Customer_ID__c');
		responseTagAPIName = responseTagAPIName.replace(/l.sfId/g, 'l.sfId as lsfid');
		responseTagAPIName = responseTagAPIName.replace(/o.sfId/g, 'o.sfId as osfid');
		responseTagAPIName = responseTagAPIName.replace(/Source_Campaign__r/g, 'cm');
		responseTagAPIName = responseTagAPIName.replace(/Purchased_Vehicle__r/g, 'v');
		responseTagAPIName = responseTagAPIName.replace(/l.Email__c/, 'CASE WHEN l.Contact__c IS NULL THEN ac.Email__c ELSE a.Email__c END as Email__c');
		
        console.log('lead TagNAME-------------->' + tagName);
        console.log('lead responseTagAPIName-------------->' + responseTagAPIName);
        return responseTagAPIName;
    }
	
	
function dynamicResponseMapping(tagName, objectName, request, leadObjString){
	
        console.log('INSIDE dynamicResponseMapping======= ');
        //sObject obj;
        var value='';
        var objectValue;
        var objName;
        var leadOwnerId;
        var ownerUsr;
        //Vehicle_Relationship__c vehicleRelationshipObject;
        //Account_Link__c accLink;
        var responseMap = new Map();
        var apiNameList;
		
        var metadataFieldsMap = new Map();
        console.log('dynamicUCIDResponseMap.get(tagName) ====>' + dynamicResponseMap.get(tagName));
        
		metadataFieldsMap.set(dynamicResponseMap.get(tagName));
		
		var leadMap = new Map(Object.entries(objectName));
        
		if(tagName.equalsIgnoreCase('leadDetails')){
            console.log('INSIDE LEAD_DETAILS --- Lead__c ====>');
            //obj = (Lead__c) objectName;
            objName = 'Lead__c';
        }else if(tagName.equalsIgnoreCase('leadDetails') && (objectName instanceof Opportunity)){
            console.log('INSIDE LEAD_DETAILS --- Opportunity ====>');
            //obj = (Opportunity) objectName;
            objName = 'Opportunity';
        }else if(tagName.equalsIgnoreCase('interestedVehicleDetails')){
            console.log('INSIDE INTERESTED_VEHICLE_DETAILS====>');
            //obj = (Lead_Details__c) objectName;
            objName = 'Lead_Details__c';
        }else if(tagName.equalsIgnoreCase('bookingDetails')){
            console.log('INSIDE BOOKING_DETAILS====>');
            //obj = (Booking__c) objectName;
            objName = 'Booking__c';
        }
        
        //To handle Date format in response
        //Schema.SObjectType t = Schema.getGlobalDescribe().get(objName);    
        //Schema.DescribeSObjectResult r = t.getDescribe(); 
       // Date dateValue;
        
       /* if(obj instanceof Lead__c || obj instanceof Opportunity){
            leadOwnerId = (Id) obj.get('OwnerId');
            ownerUsr = [SELECT Id, FederationIdentifier From User where Id =: leadOwnerId];
        } */        
        
        //if(null != obj){
            console.log('metadataFieldsMap ====>' + metadataFieldsMap);
            
			if(metadataFieldsMap != null && metadataFieldsMap.size>0){
				
                for(let responseTag of metadataFieldsMap.keys()){
					
                    console.log('responseTag ====>' + responseTag);
					
                    if((responseTag.equalsIgnoreCase('corporateLead') 
                        || responseTag.equalsIgnoreCase('accountLinkId')
                        || responseTag.equalsIgnoreCase('salesConsultantFedId'))){ 
                       //&& tagName.equalsIgnoreCase(OneAPIUtilityHelper.LEAD_LIST)){
						   
                           if(responseTag.equalsIgnoreCase('corporateLead')){
							   
                               if(leadObjString.equalsIgnoreCase('Lead__c')){
                                    if(leadMap.get('Company_Account__c') != null){
                                   		responseMap.set('corporateLead','Yes');
                               		}
                                   	else{
                                       responseMap.set('corporateLead','No');
                                    }
                               }
                               else if(leadObjString.equalsIgnoreCase('Opportunity')){
                                   if(leadMap.get('accountid') != null){
                                       responseMap.set('corporateLead','Yes');
                                   }
                                   else{
                                       responseMap.set('corporateLead','No');
                                    }
                               }
                           }
						   
						   else if(responseTag.equalsIgnoreCase('accountLinkId')){
							   
                               if(leadMap.get('al1sfId') != null && leadMap.get('alsfid')== null){
								   
								   value = leadMap.get('al1sfId');								   
                                   responseMap.set('accountLinkId', (value == null || value.length == 0) ? '' : value);
								   
                               }
							   
							   else if(leadMap.get('alsfid') != null){
								   
								   value = leadMap.get('alsfid');                                   
								   responseMap.set('accountLinkId', (value == null || value.length == 0) ? '' : value);
                               }
                           }
						   
						   else if(responseTag.equalsIgnoreCase('salesConsultantFedId')){
							   
                               value = leadMap.get('federation_id__c');							   
							   var salesConsultantFedIdinReq = request.salesConsultantFedId;
							   var valuefedIdentifieruser = leadMap.get('federationidentifier');	
							   
                               if(salesConsultantFedIdinReq != null && salesConsultantFedIdinReq.length>0){
								   
                                   responseMap.set('salesConsultantFedId',salesConsultantFedIdinReq);
                               }
							   else if(value != null && value.length>0){
                                   responseMap.set('salesConsultantFedId', value);
                               }
							   
							   else if(valuefedIdentifieruser != null && valuefedIdentifieruser.length>0){
                                       //if(String.isNotBlank(ownerUsr[0].FederationIdentifier) && ownerUsr[0].FederationIdentifier != null){
                                           responseMap.set('salesConsultantFedId', valuefedIdentifieruser);
                                       //}
                                   }            
                               else{
                                       responseMap.set('salesConsultantFedId','');
                                   }
                           
						   }
                       }
					   
					else if(responseTag.equalsIgnoreCase('accountId')){
						
						if(leadObjString.equalsIgnoreCase('Lead__c'))
							value = leadMap.get('asfid');
						else if(leadObjString.equalsIgnoreCase('Opportunity'))
							value = leadMap.get('accountid');

						
						responseMap.set('accountId', (value == null || value.length == 0) ? '' : value);
					}
					
					else if(responseTag.equalsIgnoreCase('ucid')){
						value = leadMap.get('aucid');	
						responseMap.set('ucid', (value == null || value.length == 0) ? '' : value);						
					}
					else if(responseTag.equalsIgnoreCase('magicNumber')){
						value = leadMap.get('alretail_dms_customer_id__c');	
						responseMap.set('magicNumber', (value == null || value.length == 0) ? '' : value);
						
					}
					else if(responseTag.equalsIgnoreCase('companyUCID')){
						if(leadObjString.equalsIgnoreCase('Lead__c'))
							value = leadMap.get('acucid');
						else if(leadObjString.equalsIgnoreCase('Opportunity'))
							value = leadMap.get('aucid');
							
						responseMap.set('companyUCID', (value == null || value.length == 0) ? '' : value);
						
					}
					else if(responseTag.equalsIgnoreCase('companyMagicNo')){
						value = leadMap.get('al1retail_dms_customer_id__c');	
						responseMap.set('companyMagicNo', (value == null || value.length == 0) ? '' : value);
						
					}
					else if(responseTag.equalsIgnoreCase('leadId')){						
						if(leadObjString.equalsIgnoreCase('Lead__c'))
						value = leadMap.get('lsfid');
						else if(leadObjString.equalsIgnoreCase('Opportunity'))
						value = leadMap.get('osfid');	
						
						responseMap.set('leadId', (value == null || value.length == 0) ? '' : value);
						
					}
					else if(responseTag.equalsIgnoreCase('recordType')){
						value = leadMap.get('rname');	
						responseMap.set('recordType', (value == null || value.length == 0) ? '' : value);
						
					}
					else {
                           objectValue = metadataFieldsMap.get(responseTag);
						   
                           console.log('objectValue ====>' + objectValue);
						   
                           if(objectValue.equalsIgnoreCase('NA')){
							   
                               console.log('INSIDE IF ====>');
                               responseMap.put(responseTag, '');                    
                           }else {
                               console.log('=== INSIDE ELSE ==');
							   
                               if(objectValue.contains('-')){
                                   apiNameList = objectValue.split('-');
								   
                                   console.log('apiNameList ====>' + apiNameList);
								   
                                   //if(obj.getSObject(apiNameList[0].trim()) != null){
                                       if(apiNameList != null && apiNameList.length == 2){
										
										key = (apiNameList[1].toLowerCase()).trim();
										console.log('key ====>' + key);							  
										value = leadMap.get(key);
										console.log('value ====>' + value);
										responseMap.set(responseTag, (value == null || value.length == 0) ? '' : value);
										
                                    }else if(apiNameList != null && apiNameList.length == 3){
                                       
 									    key = (apiNameList[2].toLowerCase()).trim();
										console.log('key ====>' + key);							  
										value = leadMap.get(key);
										console.log('value ====>' + value);
										responseMap.set(responseTag, (value == null || value.length == 0) ? '' : value);
										
                                    }else if(apiNameList != null && apiNameList.length == 4){
										
										key = (apiNameList[3].toLowerCase()).trim();
										console.log('key ====>' + key);							  
										value = leadMap.get(key);
										console.log('value ====>' + value);
										responseMap.set(responseTag, (value == null || value.length == 0) ? '' : value);
                                        
                                    }
                                   //}
								   
								   else {
                                       responseMap.put(responseTag, '');
                                   }
                               }else {
                                   console.log ('objectValue inside else ::::::::::: ' + objectValue);
								if(objectValue != null)
									
								key = (objectValue.toLowerCase()).trim();
								
								if((objectValue == 'CreatedDate') || (objectValue == 'LastModifiedDate') || (objectValue == 'CloseDate')){
									value = leadMap.get(key);
									console.log ('value ::::::::::: ' + value);
									
									if(value!= null && value.toString()!= null && value.toString().length>0){
									value = (value.toISOString()).replace(/T/, ' ').replace(/\..+/, '');									
									console.log ('value after format ::::::::::: ' + value);
									}
								}
								else if((objectValue == 'Expected_Close_date__c')){
									value = leadMap.get(key);
									console.log ('value ::::::::::: ' + value);
									
									if(value!= null && value.toString()!= null && value.toString().length>0){
									value = (value.toISOString()).replace(/\T.+/, '');
									
									console.log ('value after format ::::::::::: ' + value);
									}
								}
								else
                                 value = leadMap.get(key);		
                               
							    responseMap.set(responseTag, (value == null || value.length == 0) ? '' : value.toString());
                                   }
                               }
						}
                    }
                }
            //}
        //}
        
        console.log('responseMap created dynamically ====>' + responseMap);
        return responseMap;
    }
	
module.exports = {
  performRequestValidations,
  performLeadSearch
};