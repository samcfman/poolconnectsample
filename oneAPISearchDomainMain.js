var ucidSearch = require("./ucidSearch.js");


var accountResponseTagAPIName = '';
var retailCopiesResponseTagAPIName = '';
var addressListResponseTagAPIName = '';
var leadListResponseTagAPIName = '';
var interestedVehiclesResponseTagAPIName = '';
var retailC2CResponseTagAPIName = '';
var vehicleRelationshipsResponseTagAPIName = '';
var accountDocsResponseTagAPIName = '';
var docInformationDocsResponseTagAPIName = '';
var wholesaleC2CWithDealerResponseTagAPIName = '';
var wholesaleC2CWithoutDealerResponseTagAPIName = '';
var PERSONSOFTDELETERECORDTYPEID = 'select sfid from herokusbox.recordtype where sobjecttype = \'Account\' and Name = \'Person Account Soft Deleted\'';
var COMPANYSOFTDELETERECORDTYPEID = 'select sfid from herokusbox.recordtype where sobjecttype = \'Account\' and Name = \'Company Soft Deleted\'';
var INDIVIDUALEXTLNKRECORDTYPEID = 'select sfid from herokusbox.recordtype where sobjecttype = \'Account_Link__c\' and Name = \'Individual Customer External Link\'';
var dynamicUCIDResponseMap = new Map();


String.prototype.equalsIgnoreCase = function (compareString) 
	{ return this.toUpperCase() === compareString.toUpperCase(); 
	};

function getAccountRecords(newMetadataList,isDealerRequest, dealerId, request,toRoleSet,accountListUcid) { 
//pass needed parameters as well here.

		console.log('inside getAccountRecords :::::::::::::::::::::');
        console.log('Dealer Request or Not ==>'+isDealerRequest);
        var dynamicResponseSwitch = newMetadataList[0].enabled_dynamic_response__c;
        console.log('dynamicResponseSwitch ---> ' + dynamicResponseSwitch);
        //One_API_Search_Configuration__mdt metadataObj = oneAPIMetadataList.get(0);
        
        //Method call to fetch query fields dynamically based on dynamic response switch
        if(true == dynamicResponseSwitch){
            console.log('===== BEFORE Calling createDynamicResponseTagsAndFieldsUCIDSearch ====');
        	createDynamicResponseTagsAndFieldsUCIDSearch(newMetadataList[0].ucid_response_mapping__c);    
        }        
        
        
        //Adding checks for avalability of Account Id/ UCID in the request
        var ucidValue = request.ucid;
        var accountIdValue = request.accountId;
        
        //Limit for Child Entities
        var accountlinkChildEnabled =  false;
        var accountLinkLimit = '1';
        var docChildEnabled = false;
        var docLimit = '1';
        var leadChildEnabled =  false;
        var leadLimit = '1';
        var addressChildEnabled =  false;
        var addressLimit = '1';
        var vrChildEnabled =  false;
        var vehicleRelationshipLimit = '1';
		var joinCondition = '';
		
        //Dealer Check and RetailCopyEnabled  Check
        var isretailCopyCompanyEnabled   = newMetadataList[0].RetailCopyAtCompany__c;
        
        var isDealerGCCodeEmpty = Boolean(!request.dealerGcCode);
        var isDealerNDCodeEmpty = Boolean(!request.dealerNdCode);
        var isDealerGSCodeEmpty = Boolean(!request.dealerGsCode);
        //String extrenalId = requestMap.get('externalId');
        var lineId = request.lineId;
        var mmId = request.mmId;
        var ciamId = request.ciamId;
        
        // Retrieve ChildEntities From Metadata
        var childEntities = [];    
        var limitField ; 
        if(newMetadataList[0] != null) {

			var entity = newMetadataList[0].child_entities__c;
            childEntities  = entity.split(',');
			var field = childEntities[0];
			var filed1 = field.split(':');
            //limitField =  childEntities[0].right(1) ;
			limitField =  filed1[1] ;
            console.log('childentities '+childEntities);
            console.log('limit==>'+limitField);
        }
        for(let childEntityrecords of childEntities) {
			var record = childEntityrecords.split(':');
			
            if(record[0] =='DOCs'){
                //doclimit = childEntities[0].right(1);
				doclimit = limitField;
                docChildEnabled = true; 
            }
            else if(record[0] =='VehicleRelationships') {
                vehicleRelationshipLimit = limitField;
                vrChildEnabled = true;
            }
            else if(record[0] =='Leads') {
                leadLimit = limitField;
                leadChildEnabled = true;
            }
            else if(record[0] =='Addresses') {
                addressLimit = limitField;
                addressChildEnabled = true;
            }
            else if(record[0] =='AccountLinks') {
                accountLinkLimit = limitField;
                accountlinkChildEnabled = true;
            }
        }
        var ucid = request.ucid;
        var market = request.market;
        //Check the Order By Field set at metadata.
        var orderByFieldName;
         
            orderByFieldName = newMetadataList[0].order_by_field__c;// Get the field from metadata
        
        //DOC Information Present in Request
        var docSystem;
        var docLegalEntity;
        var docType;
        var docObjectEnabled;
             
            docObjectEnabled = newMetadataList[0].enabled_doc_object__c;
            if(docObjectEnabled) {
                docSystem = request.docSystem;
                docLegalEntity = request.docLegalEntity;
                docType = request.docType;
                ucid = request.ucid;
            }      
        
        // --------------------Dynamic SOQL Preparation Starts From here -------------------
        //Account Base Soql 
        var accountBaseSoql;
        var addressQuery;
        var docInnerQuery;
        var acountAndAccountDocsTagAPINameSet = [];
        var accAndAccDocsTagAPINames = '';
        if(true == dynamicResponseSwitch){
            var combinedTagAPIName = accountResponseTagAPIName + ',' + accountDocsResponseTagAPIName;
            var strArray = combinedTagAPIName.split(',');
            for(let str of strArray){
                acountAndAccountDocsTagAPINameSet.push(str);
            }
            for(let apiName of acountAndAccountDocsTagAPINameSet){
                accAndAccDocsTagAPINames += apiName + ' ';
            }
            accAndAccDocsTagAPINames = accAndAccDocsTagAPINames.trim();
            accAndAccDocsTagAPINames = accAndAccDocsTagAPINames.replace(/ /g, ',');
			
			//deriving age__c field with calculation
			accAndAccDocsTagAPINames = accAndAccDocsTagAPINames.replace(/a.age__c/g, 'CASE WHEN a.personbirthdate IS NULL THEN NULL ELSE FLOOR((CURRENT_DATE - a.personbirthdate +1)/365.2425) END as age__c');
			accAndAccDocsTagAPINames = accAndAccDocsTagAPINames.replace(/recordType.Name/, 'recordType.Name as rname');
			
            console.log('===== BEFORE Creating Dynamic queries 1 ====');
			
          
            accountBaseSoql = 'SELECT ' + accAndAccDocsTagAPINames + ',a.RecordTypeId ';
            
			addressQuery = '(select array_to_json(array_agg(address)) as address from (select ' + addressListResponseTagAPIName + ',ad.customer__c FROM herokusbox.Address__c ad INNER JOIN herokusbox.account a on ad.customer__c::VARCHAR = a.sfid::VARCHAR and a.UCID__c = $1 and a.market__c = $2 order by ';
            
			docInnerQuery = '(select array_to_json(array_agg(doc)) as doc from (select '+ docInformationDocsResponseTagAPIName + ',dc.account__c FROM herokusbox.DOC_Information__c dc INNER JOIN herokusbox.account a on dc.account__c::VARCHAR = a.sfid::VARCHAR and a.UCID__c = $1 and a.market__c = $2 ';
			
			
			
			console.log("accountBaseSoql:::::::::" + accountBaseSoql);
			console.log("addressQuery:::::::::" + addressQuery);
			console.log("docInnerQuery:::::::::" + docInnerQuery);
        }
        
        if(orderByFieldName != null) {
            addressQuery  = addressQuery + 'ad.' + orderByFieldName  + ' limit ' + addressLimit + ')address) ';
        }        
        if(docType != null && (docType.length >0)){
            docInnerQuery += ' AND dc.Doc_Type__c = ' + docType ;
        }
        if(docSystem != null && (docSystem.length >0)){
            docInnerQuery += ' AND dc.Data_Source__c = ' + docSystem + ' AND ';
        }
        if(docLegalEntity != null && (docLegalEntity.length >0)){
            docInnerQuery += ' AND dc.Legal_Entity__c = ' + docLegalEntity + ' AND ';
        }
        docInnerQuery += ' AND a.UCID__c = $1 order by ';  
                
        if(orderByFieldName != null ) {
            //docFieldList  = docFieldList + orderByFieldName  + ' limit  ' + doclimit  + ') ';
            docInnerQuery = docInnerQuery + 'dc.' + orderByFieldName  + ' limit  ' + doclimit  + ')doc) ';
        }
		
		console.log("addressQuery after order by :::::::::" + addressQuery);
		console.log("docInnerQuery after order by :::::::::" + docInnerQuery);
        
        //---------Lead & Opportunity Inner Queries Preparation  Based on MetaData and Request Parameteres-------
        var stageSetlist = [];
		var stageSet = '';
        if(newMetadataList[0] != null){
			var closedleadStage = newMetadataList[0].closed_lead_stages__c;
            stageSetlist  = closedleadStage.split(',');
			for(var i=0; i<stageSetlist.length; i++){
				if(i == 0)
				 stageSet = '\'' + stageSetlist[0] + '\'';
			    else
				 stageSet = stageSet + ',' + '\'' + stageSetlist[i] + '\'';
			}
            console.log('stageset ::::::::::::: '+stageSet);
			
        }
        var leadInnerQuery;
        var opportunityInnerQuery;
        var leadType = Boolean(request.leadType);
		
        var leadTypeFromRequest = request.leadType;
		var leadObject = newMetadataList[0].lead_object__c;
		
		leadListResponseTagAPIName = leadListResponseTagAPIName.replace(/Sales_Consultant__r/g, 'c');
		//removing Service_Advisor__r as need to figure out condition for it and Sales_Consultant__r, Service_Advisor__r can not co exist together like salesforce .... need to point out
		leadListResponseTagAPIName = leadListResponseTagAPIName.replace(/Service_Advisor__r/g, 'u');
		
		leadListResponseTagAPIName = leadListResponseTagAPIName.replace(/Assigned_dealer__r/g, 'ad');
		leadListResponseTagAPIName = leadListResponseTagAPIName.replace(/Assigned_Dealer__r/g, 'ad');
		leadListResponseTagAPIName = leadListResponseTagAPIName.replace(/contact__r/g, 'a');
		leadListResponseTagAPIName = leadListResponseTagAPIName.replace(/Company_Account__r/g, 'a');
		
		
        if(leadObject.equalsIgnoreCase('Lead__c')) {
            var leadInnerQueryPerson;
            var leadInnerQueryCompany;
			
            if(true == dynamicResponseSwitch){
				
                console.log('===== BEFORE Creating Dynamic queries 2 ====');
				
				
                leadInnerQueryPerson = '(select array_to_json(array_agg(leadperson)) as leadperson from(select ' + leadListResponseTagAPIName ;
                leadInnerQueryCompany = '(select array_to_json(array_agg(leadcompany)) as leadcompany from(select ' + leadListResponseTagAPIName ;
            }
            //For leadInnerQueryPerson  
				// removed condition INNER JOIN herokusbox.user u on l.Service_Advisor__c::VARCHAR = u.sfid::VARCHAR as as need to figure out condition for it also Sales_Consultant__r, Service_Advisor__r can not co exist together like salesforce .... need to point out 
            if(isDealerRequest) {
                leadInnerQueryPerson  += ' FROM herokusbox.Lead__c l INNER JOIN herokusbox.account a on l.Contact__c::VARCHAR = a.sfid::VARCHAR INNER JOIN herokusbox.contact c on l.Sales_Consultant__c::VARCHAR = c.sfid::VARCHAR INNER JOIN herokusbox.account ad on l.Assigned_dealer__c::VARCHAR = ad.sfid::VARCHAR left JOIN herokusbox.user u on l.Service_Advisor__c::VARCHAR = u.sfid::VARCHAR and a.UCID__c = $1 and a.market__c = $2 and l.Dealer_Lead_status__c not in(' + stageSet + ') and l.Market__c = $2 and  l.Assigned_Dealer__c = ' + dealerId ;                                                  
            }
            else{
                leadInnerQueryPerson  += ' FROM herokusbox.Lead__c l INNER JOIN herokusbox.account a on l.Contact__c::VARCHAR = a.sfid::VARCHAR INNER JOIN herokusbox.contact c on l.Sales_Consultant__c::VARCHAR = c.sfid::VARCHAR INNER JOIN herokusbox.account ad on l.Assigned_dealer__c::VARCHAR = ad.sfid::VARCHAR left JOIN herokusbox.user u on l.Service_Advisor__c::VARCHAR = u.sfid::VARCHAR and a.UCID__c = $1 and a.market__c = $2 and l.Dealer_Lead_status__c not in(' + stageSet + ') AND l.Market__c = $2 ';                                                  
            } 
            //Filtering Based on Lead Type
            if(leadType) {
                leadInnerQueryPerson += ' AND l.Lead_Type__c = ' + leadTypeFromRequest;
            }
            //Order By check
            if(orderByFieldName != null) {
                leadInnerQueryPerson  = leadInnerQueryPerson  + ' order by ' +  'l.' + orderByFieldName  + ' limit '+ leadLimit + ')leadperson)  ';
            }            
            if(isDealerRequest){
                leadInnerQueryCompany  += ' FROM herokusbox.Lead__c l INNER JOIN herokusbox.account a on (l.Contact__c::VARCHAR = a.sfid::VARCHAR or l.Company_Account__c::VARCHAR = a.sfid::VARCHAR) INNER JOIN herokusbox.contact c on l.Sales_Consultant__c::VARCHAR = c.sfid::VARCHAR INNER JOIN herokusbox.account ad on l.Assigned_dealer__c::VARCHAR = ad.sfid::VARCHAR left JOIN herokusbox.user u on l.Service_Advisor__c::VARCHAR = u.sfid::VARCHAR and a.UCID__c = $1 and a.market__c = $2 and l.Dealer_Lead_status__c not in(' +  stageSet + ') AND l.Market__c = $2 AND l.Assigned_Dealer__c = ' + dealerId; 
            }
            else{
                leadInnerQueryCompany  +=  ' FROM herokusbox.Lead__c l INNER JOIN herokusbox.account a on (l.Contact__c::VARCHAR = a.sfid::VARCHAR or l.Company_Account__c::VARCHAR = a.sfid::VARCHAR) INNER JOIN herokusbox.contact c on l.Sales_Consultant__c::VARCHAR = c.sfid::VARCHAR INNER JOIN herokusbox.account ad on l.Assigned_dealer__c::VARCHAR = ad.sfid::VARCHAR left JOIN herokusbox.user u on l.Service_Advisor__c::VARCHAR = u.sfid::VARCHAR and a.UCID__c = $1 and a.market__c = $2 and l.Dealer_Lead_status__c not in(' +  stageSet + ') AND l.Market__c = $2 ';                                                  
            }
            //Filtering Based on Lead Type
            if(leadType) {
                leadInnerQueryCompany += ' AND l.Lead_Type__c = ' + leadTypeFromRequest ;
            }
            //Order By check
            if(orderByFieldName != null) {
                leadInnerQueryCompany  = leadInnerQueryCompany  + ' order by ' +  'l.' + orderByFieldName  + ' limit ' + leadLimit + ')leadcompany) ';
            }
			
			
            leadInnerQuery =  leadInnerQueryPerson +  ' , '+ leadInnerQueryCompany ;    
				
			console.log("leadInnerQuery ::::::::::::::: " + leadInnerQuery);
        } 
        else {
            if(true == dynamicResponseSwitch){
                console.log('===== BEFORE Creating Dynamic queries 3 ====');
				
				leadListResponseTagAPIName = leadListResponseTagAPIName.replace(/l./g, 'op.');
				
                opportunityInnerQuery = '(select array_to_json(array_agg(opportunity)) as opportunity from (select ' + leadListResponseTagAPIName ;
            }            
            if(isDealerRequest) {
                opportunityInnerQuery  += ' From herokusbox.Opportunity op INNER JOIN herokusbox.account a on op.AccountId::VARCHAR = a.sfid::VARCHAR INNER JOIN herokusbox.contact c on op.Sales_Consultant__c::VARCHAR = c.sfid::VARCHAR INNER JOIN herokusbox.account ad on op.Assigned_dealer__c::VARCHAR = ad.sfid::VARCHAR and a.UCID__c = $1 and a.market__c = $2 and op.StageName not in(' + stageSet + ') AND op.Market__c = $2 AND op.Assigned_Dealer__c = ' + dealerId ;                                                  
            }
            else {
                opportunityInnerQuery += ' From herokusbox.Opportunity op INNER JOIN herokusbox.account a on op.AccountId::VARCHAR = a.sfid::VARCHAR INNER JOIN herokusbox.contact c on op.Sales_Consultant__c::VARCHAR = c.sfid::VARCHAR INNER JOIN herokusbox.account ad on op.Assigned_dealer__c::VARCHAR = ad.sfid::VARCHAR and a.UCID__c = $1 and a.market__c = $2 and op. StageName not in(' + stageSet + ') AND op.Market__c = $2 ';                             
            } 
            //Filtering Based on Lead Type
            if(leadType) {
                opportunityInnerQuery += ' AND op.Lead_Type__c = leadTypeFromRequest ';
            }
            if(orderByFieldName != null) {
                opportunityInnerQuery  = opportunityInnerQuery  +' order by ' +  'op.' + orderByFieldName  + ' limit ' + leadLimit + ')opportunity) ';
            } 
        }                                           
        //----------------Account Link Inner Query Preparation -------------------
        var rtcopyInnerQuery;
        if(true == dynamicResponseSwitch){
            console.log('===== BEFORE Creating Dynamic queries 4 ====');
            rtcopyInnerQuery =  '(select array_to_json(array_agg(Accountlink)) as Accountlink from (select ' + retailCopiesResponseTagAPIName  + ',al.toRole__c,al.Retail_Related_Company__c'; 
			
			//Extra 2 fields are used in Related Retail C2C's && Account Related WholeSale C2C's conditions in UCIDHandler
			
			rtcopyInnerQuery = rtcopyInnerQuery.replace(/fromRole__r/g, 'a');
			rtcopyInnerQuery = rtcopyInnerQuery.replace(/al.RetailDealer_ND_Code__c/g, 'a.Dealer_ND_Code__c');
			rtcopyInnerQuery = rtcopyInnerQuery.replace(/al.Retail_Dealer_CompanyCode__c/g, 'a.Dealer_GC_Code__c');
			rtcopyInnerQuery = rtcopyInnerQuery.replace(/al.DMS_Retailer_ID__c/g, 'a.DMS_Retailer_ID__c');
			rtcopyInnerQuery = rtcopyInnerQuery.replace(/recordType.Name/, 'recordType.Name as rname');
			
			
        }
        if(isDealerRequest ) {
            //  if(isretailCopyCompanyEnabled && !isDealerGCCodeEmpty) {
            rtcopyInnerQuery  += ' From herokusbox.Account_Link__c al INNER JOIN herokusbox.Account a ON al.fromRole__c::VARCHAR = a.sfid::VARCHAR INNER JOIN herokusbox.Account a1 ON al.toRole__c::VARCHAR = a1.sfid::VARCHAR INNER JOIN herokusbox.recordtype recordType ON al.recordTypeID::VARCHAR = recordType.sfid::VARCHAR and a1.UCID__c = $1 and a.market__c = $2 and al.FromRole__c = ' + dealerId + ' AND al.Retail_Duplicate_Flag__c = false ' ;           
        } else {
            rtcopyInnerQuery += ' From herokusbox.Account_Link__c al INNER JOIN herokusbox.Account a ON al.fromRole__c::VARCHAR = a.sfid::VARCHAR INNER JOIN herokusbox.Account a1 ON al.toRole__c::VARCHAR = a1.sfid::VARCHAR INNER JOIN herokusbox.recordtype recordType ON al.recordTypeID::VARCHAR = recordType.sfid::VARCHAR and a1.UCID__c = $1 and a.market__c = $2 ';                               
        } 
        if(orderByFieldName != null) {
            rtcopyInnerQuery  = rtcopyInnerQuery + ' order by '+ 'al.' +orderByFieldName  + ' limit ' + accountLinkLimit + ')Accountlink) ';
        }
        //----------------vehicleRelationship Inner Query Preparation ------------------- 
        var vrInnerQuery = '';
        if(isDealerRequest) {
            var carRelation = Boolean(request.carRelation);
            var carRelationFromRequest = request.carRelation;
            var vehicleRelationshipTypeSet = [];
            vehicleRelationshipTypeSet.push('Sales');
            vehicleRelationshipTypeSet.push('Aftersales');
            vehicleRelationshipTypeSet.push('Driver');
            
            if(true == dynamicResponseSwitch){
                console.log('===== BEFORE Creating Dynamic queries 5 ====');
                vrInnerQuery = '(select array_to_json(array_agg(vehicle)) as vehicle from (select ' + vehicleRelationshipsResponseTagAPIName + ')';          
            }           
            vrInnerQuery  += ' FROM herokusbox.Vehicle_Relationship__c vr INNER JOIN herokusbox.Account a ON vr.Contact__c::VARCHAR = a.sfid::VARCHAR and a.UCID__c = $1 and a.market__c = $2 and vr.Car_Relation__c IN (' + vehicleRelationshipTypeSet + ') AND Owner_Dealer__c = ' + dealerId ; 
            //Filtering Vehiclerelationship's Based on carRelation
            if(carRelation) {
                vrInnerQuery += ' AND vr.Car_Relation__c = ' + carRelationFromRequest ;
            }
            if(orderByFieldName != null) {
                vrInnerQuery  = vrInnerQuery + ' order by '+ 'vr.' + orderByFieldName  + ' limit ' + vehicleRelationshipLimit + ')vehicle) ';
            } 
        }
        
        //-----------------All Child Entities are Added to Account one by one from here------------------
		joinCondition += 'INNER JOIN herokusbox.recordtype recordType ON a.recordTypeID::VARCHAR = recordType.sfid::VARCHAR ';
        if(addressChildEnabled) {
            accountBaseSoql += ' , '+ addressQuery; 
			
        }
        console.log('accountBaseSoql'+accountBaseSoql);
        //DOC Check from MetaData Level
        if(docChildEnabled) { //DOC is there in child entities field on metadata // TO CHECK **
            if(docObjectEnabled) { //If DOC Enabled
                accountBaseSoql += ' , '+docInnerQuery;
				
	            }
        }
        //Lead Check from MetaData Level
        if(leadChildEnabled) {
			var leadobject = newMetadataList[0].lead_object__c;
            if(leadobject.equalsIgnoreCase('Lead__c')) {  
                accountBaseSoql += ' , '+ leadInnerQuery;
				
            } else {
                accountBaseSoql += ' , '+ opportunityInnerQuery;
				
				
            }
        }
        if(accountlinkChildEnabled) {  //If Child Entity field has retail copy then 
            accountBaseSoql += ' , '+ rtcopyInnerQuery;
			
        }
        if(vrChildEnabled == true && isDealerRequest == true && dealerId != null) { //If Child entity has VehicleRelationships then
            accountBaseSoql +=  ' , '+ vrInnerQuery;
			
        }
        
        //Starts here == SACHIN-Latest updated code for externalId/externalSystem based processing for UCID search
        var externalIdCondition = '';
        var isExtenalIdQuery = false;
        var externalId = request.externalId;
        var externalSystem = request.externalSystem;
        /*if(externalId != null && externalId != '' && externalSystem != null && externalSystem != '') {
            var externalAccountLinkList = [Select id
                                                             , toRole__c
                                                             FROM Account_Link__c
                                                             WHERE Name = externalId
                                                             AND System__c = externalSystem
                                                             AND recordTypeId = (INDIVIDUALEXTLNKRECORDTYPEID)];
            for(Account_Link__c acl :externalAccountLinkList) {
                if(acl.toRole__c != null) {  
                    toRoleSet.add(acl.toRole__c);
                }
            }*/ //commenting the part as the toRoleSet queried in ucidSearch.js and passed here
			
            if(toRoleSet.length > 0) {
                externalIdCondition +=  '  a.sfid IN (' + toRoleSet + ')';
                isExtenalIdQuery = true;
            }
        //}
        //Ends here == SACHIN-Latest updated code for externalId/externalSystem based processing for UCID search
        
        var externalIdAccountSOQL = accountBaseSoql;
        //Add "From Account" at the end of the SOQL here
        if(!(ucidValue.length == 0)){
            accountBaseSoql += ' From herokusbox.Account a ' + joinCondition + ' and a.UCID__c = $1 AND a.market__c = $2 AND a.recordTypeId !=  ( ' + PERSONSOFTDELETERECORDTYPEID + ') AND a.recordTypeId != (' + COMPANYSOFTDELETERECORDTYPEID + ')';    
            
			if(isExtenalIdQuery == true) {
                externalIdAccountSOQL += ' From herokusbox.Account a ' + joinCondition + ' and '+ externalIdCondition +' AND a.market__c = $2 AND a.recordTypeId != ( ' + PERSONSOFTDELETERECORDTYPEID + ') AND recordTypeId != (' + COMPANYSOFTDELETERECORDTYPEID + ')';    
            }
        }else if(!(accountIdValue.length == 0)){
           // List<Account> accountList = new List<Account>();
           // accountList = [SELECT UCID__c FROM Account WHERE Id = accountIdValue];
           // if(accountList != null && accountList.size()>0){
                //ucid = accountList[0].ucid__c;
			// commented above lines as the accountListUcid queried in ucidSearch.js and passed here
			
			 console.log('accountListUcid ::::::::::::::::::---->'+accountListUcid);
			
			if(accountListUcid != null){
				ucid = accountListUcid;
				
				console.log('ucid ::::::::::::::::::---->'+ucid);
				
                accountBaseSoql += ' From herokusbox.Account a ' + joinCondition + ' and ' + ' a.UCID__c = ' + ucid + ' AND a.market__c = $2 AND recordTypeId != ( ' + PERSONSOFTDELETERECORDTYPEID + ') AND recordTypeId != (' + COMPANYSOFTDELETERECORDTYPEID + ')';
                if(isExtenalIdQuery == true) {
                    externalIdAccountSOQL += ' From herokusbox.Account a ' + joinCondition + ' and '+ externalIdCondition +' AND market__c = $2 AND recordTypeId != (' + PERSONSOFTDELETERECORDTYPEID + ') AND recordTypeId != (' + COMPANYSOFTDELETERECORDTYPEID + ')';
                }
            }
        }else {
            accountBaseSoql += ' From herokusbox.Account a ' + joinCondition + ' and '+ 'a.UCID__c = $1 AND a.market__c = $2 AND recordTypeId != (' + PERSONSOFTDELETERECORDTYPEID + ') AND recordTypeId != (' + COMPANYSOFTDELETERECORDTYPEID + ')';
            
			externalIdAccountSOQL += ' From herokusbox.Account a ' + joinCondition + ' and '+ externalIdCondition +' AND market__c = $2 AND recordTypeId != (' + PERSONSOFTDELETERECORDTYPEID + ') AND recordTypeId != (' + COMPANYSOFTDELETERECORDTYPEID + ')';
        }
        
        //Check if Customer Type is enabled at metadata and customerType from request is not null
        var iscustomTypeEnabled;
        if(newMetadataList[0] != null) { 
            iscustomTypeEnabled = newMetadataList[0].enabled_customer_type__c;
        }
        var customerTypeFromRequest;
        if(iscustomTypeEnabled == true && reques.customerType != null) {
            customerTypeFromRequest = requestMap.customerType;
        }
        if(iscustomTypeEnabled) {
            accountBaseSoql += ' AND a.Customer_Type__c = ' + customerTypeFromRequest;
            externalIdAccountSOQL += ' AND a.Customer_Type__c = ' + customerTypeFromRequest;
        }
        else {
            if(orderByFieldName != null) {
                accountBaseSoql = accountBaseSoql +' order by a.' + orderByFieldName + ' limit 1 ';
                externalIdAccountSOQL =  externalIdAccountSOQL + ' order by a.' + orderByFieldName + ' limit 1 ';
            }  
        }
        console.log('accountBaseSoql===>withALL INNER QUERIESSSS===>accountBaseSoql---->'+accountBaseSoql);
        console.log('externalIdAccountSOQL===>withALL INNER QUERIESSSS===>externalIdAccountSOQL---->'+externalIdAccountSOQL);
		
		var queryMap = new Map();
		
		queryMap.set('accountBaseSoql' , accountBaseSoql);
		queryMap.set('externalIdAccountSOQL', externalIdAccountSOQL);
		queryMap.set('isExtenalIdQuery', isExtenalIdQuery);
		
		console.log('length of dynamicUCIDResponseMap inside getAccountRecords:::::::::::::::::::::::::' + dynamicUCIDResponseMap.size);
		queryMap.set('dynamicUCIDResponseMap', dynamicUCIDResponseMap);
		
		console.log('returning queryMap:::::::::::::::::::::::::');
		
		return queryMap;
        
        //Fire this SOQL.
		
		// to be implemented in the server.js where the actual query runs
		
       /* var accountFinalList = [];
        if(accountIdValue != null || ucidValue != null) {
            accountFinalList = database.query(accountBaseSoql); //Check based on UCID/accountId first
        }

        if((accountFinalList == null || accountFinalList.size() == 0) && isExtenalIdQuery == true) { //If no records based on ucid/accountId Id then check based on externalId
            accountFinalList =  database.query(externalIdAccountSOQL);
        }
        
        //Golden UCID Search Process
        boolean isGoldenUCIDEnabled = metadataObj.Enabled_Golden_UCID_Check__c;
        if(accountFinalList.size() == 0 && isGoldenUCIDEnabled) {
            string  goldenUcid;
            List<Duplicate_Merge_Info__c> duplicateMergeUCID = [SELECT Id
                                                                , Master_UCID__c
                                                                , Duplicate_UCID__c 
                                                                FROM Duplicate_Merge_Info__c 
                                                                where Duplicate_UCID__c =: requestMap.get('ucid') 
                                                               ];
            if(duplicateMergeUCID.size() > 0){
                if(duplicateMergeUCID[0].Master_UCID__c != null) {
                    goldenUcid = duplicateMergeUCID[0].Master_UCID__c; 
                    accountBaseSoql = accountBaseSoql.replace(':ucid', ':goldenUcid');
                    accountFinalList =  database.query(accountBaseSoql);
                }  
            }
            //accountBaseSoql += ' From Account where UCID__c =:goldenUcid AND market__c =:market' ;
        }
        console.log('accountFinalList===>'+accountFinalList); 
        return accountFinalList != null ? accountFinalList : new list<Account>(); */
    }
	
	
	function createDynamicResponseTagsAndFieldsUCIDSearch(mtdRecordFieldValue){
        console.log('INSIDE createDynamicResponseTagsAndFieldsUCIDSearch -------------->');
        var metadataMap = new Map();
        var apiNameList = [];
		var mtdRecordFieldValuelist = mtdRecordFieldValue.split('&&');
        for(let str of mtdRecordFieldValuelist){
            console.log('str value -------------->' + str);
            var arrayfield = str.split('=');
            console.log('arrayfield.get(0)-------------->' + arrayfield[0]);
            console.log('arrayfield.get(1)-------------->' + arrayfield[1]);
            metadataMap.set(arrayfield[0].trim(), arrayfield[1].trim());
        }
        console.log('metadataMap-------------->' + metadataMap);
		
		for (let str of metadataMap.keys()) {
            if(str.trim().equalsIgnoreCase("accountDetails")){
                accountResponseTagAPIName = getqueryFields('accountDetails', metadataMap.get(str));
				
                console.log('UCID accountResponseTagAPIName-------------->' + accountResponseTagAPIName);
            }
            if(str.trim().equalsIgnoreCase("retailCopies")){
                retailCopiesResponseTagAPIName = getqueryFields('retailCopies', metadataMap.get(str));
                console.log('UCID retailCopiesResponseTagAPIName-------------->' + retailCopiesResponseTagAPIName);
            }
            if(str.trim().equalsIgnoreCase("addressList")){
                addressListResponseTagAPIName = getqueryFields('addressList', metadataMap.get(str));
                console.log('UCID addressListResponseTagAPIName-------------->' + addressListResponseTagAPIName);
            }
            if(str.trim().equalsIgnoreCase("leadList")){
                leadListResponseTagAPIName = getqueryFields('leadList', metadataMap.get(str));
                console.log('UCID leadListResponseTagAPIName-------------->' + leadListResponseTagAPIName);
            }
            if(str.trim().equalsIgnoreCase("interestedVehicles")){
                interestedVehiclesResponseTagAPIName = getqueryFields('interestedVehicles', metadataMap.get(str));
                console.log('UCID interestedVehiclesResponseTagAPIName-------------->' + interestedVehiclesResponseTagAPIName);
            }
            if(str.trim().equalsIgnoreCase("retailC2C")){
                retailC2CResponseTagAPIName = getqueryFields('retailC2C', metadataMap.get(str));
                console.log('UCID retailC2CResponseTagAPIName-------------->' + retailC2CResponseTagAPIName);
            }
            if(str.trim().equalsIgnoreCase("vehicleRelationships")){
                vehicleRelationshipsResponseTagAPIName = getqueryFields('vehicleRelationships', metadataMap.get(str));
                console.log('UCID vehicleRelationshipsResponseTagAPIName-------------->' + vehicleRelationshipsResponseTagAPIName);
            }
            if(str.trim().equalsIgnoreCase("Account_DOCs")){
                accountDocsResponseTagAPIName = getqueryFields('Account_DOCs', metadataMap.get(str));
                console.log('UCID accountDocsResponseTagAPIName-------------->' + accountDocsResponseTagAPIName);
            }
            if(str.trim().equalsIgnoreCase("DOC_Information_DOCs")){
                docInformationDocsResponseTagAPIName = getqueryFields('DOC_Information_DOCs', metadataMap.get(str));
                console.log('UCID docInformationDocsResponseTagAPIName-------------->' + docInformationDocsResponseTagAPIName);
            }
            if(str.trim().equalsIgnoreCase("wholesaleC2CWITHDealer")){
                wholesaleC2CWithDealerResponseTagAPIName = getqueryFields('wholesaleC2CWITHDealer', metadataMap.get(str));
                console.log('UCID wholesaleC2CWithDealerResponseTagAPIName-------------->' + wholesaleC2CWithDealerResponseTagAPIName);
            }
            if(str.trim().equalsIgnoreCase("wholesaleC2CWITHOUTDealer")){
                wholesaleC2CWithoutDealerResponseTagAPIName = getqueryFields('wholesaleC2CWITHOUTDealer', metadataMap.get(str));
                console.log('UCID wholesaleC2CWithoutDealerResponseTagAPIName-------------->' + wholesaleC2CWithoutDealerResponseTagAPIName);
            } 
        
		}
    }
	
	function getqueryFields(tagName, fieldsString){
        console.log('INSIDE getqueryFields-------------->');
        var responseTags = ''; 
        var responseTagAPIName = '';
        var responseTagAPINameSet = [];
        var value='';
        var metadataFieldsMap = new Map();
        var apiNameList = [];
		var fieldsStringList = fieldsString.split(',');
        for(var i=0; i<fieldsStringList.length;i++){
			
            console.log('fieldsStringList[i]-------------->' + fieldsStringList[i]);
            var arrayfield = fieldsStringList[i].split(':') ;
            console.log('arrayfield -------------->' + arrayfield);
            metadataFieldsMap.set(arrayfield[0].trim(), arrayfield[1].trim());
            console.log('Name + arrayfield Get (1) -------------->' + arrayfield[0] + ' ------ ' + arrayfield[1]);
            var Condition = arrayfield[1].trim().equalsIgnoreCase("NA");
			console.log('Condition value -------------->' + Condition);		
			 
			
            if(!(String(arrayfield[1]).equalsIgnoreCase("NA"))){
				console.log("inside if ::::::::::::::: ");
                if(String(arrayfield[1]).includes('-')){
                    apiNameList = String(arrayfield[1]).split('-');
                    console.log('apiNameList -------------->' + apiNameList + ':: SIZE ::' + apiNameList.length);
                    if(apiNameList!= null && apiNameList.length == 2){
                        value = apiNameList[0].trim() + '.' + apiNameList[1].trim();
                    }else if(apiNameList!= null && apiNameList.length == 3){
                        value = apiNameList[0].trim() + '.' + apiNameList[1].trim() + '.' + apiNameList[2].trim();
                    }else if(apiNameList!= null && apiNameList.length == 4){
                        value = apiNameList[0].trim() + '.' + apiNameList[1].trim() + '.' + apiNameList[2].trim() + '.' + apiNameList[3].trim();
                    }
                }else {
					
					if(tagName.equalsIgnoreCase("accountDetails") || tagName.equalsIgnoreCase("Account_DOCs"))
					 value = 'a.' + arrayfield[1].trim();
				 
					else if(tagName.equalsIgnoreCase("retailCopies"))
					 value = 'al.' + arrayfield[1].trim();
				 
					 //{value = '\'' + arrayfield[1].trim() + ':\'' + ',' + 'al.' + arrayfield[1].trim();
					   //console.log("retailCopies value at tage level ::::::::::::" + value);
					// }
				 
					else if(tagName.equalsIgnoreCase("addressList"))
					 value = 'ad.' + arrayfield[1].trim();
					   //value = '\'' + arrayfield[1].trim() + ':\'' + ',' + 'ad.' + arrayfield[1].trim();
				 
					else if(tagName.equalsIgnoreCase("leadList"))
					 value = 'l.' + arrayfield[1].trim();
					   //value = '\'' + arrayfield[1].trim() + ':\'' + ',' + 'l.' + arrayfield[1].trim();
				 
					else if(tagName.equalsIgnoreCase("DOC_Information_DOCs"))
					  value = 'dc.' + arrayfield[1].trim();
                        //value = '\'' + arrayfield[1].trim() + ':\'' + ',' + 'dc.' + arrayfield[1].trim();				  
				  
					else if(tagName.equalsIgnoreCase("vehicleRelationships"))
					  value = 'vr.' + arrayfield[1].trim();
						//value = '\'' + arrayfield[1].trim() + ':\'' + ',' + 'vr.' + arrayfield[1].trim();	
				  
					//equalsIgnoreCase("interestedVehicles")
					//equalsIgnoreCase("retailC2C")
					//equalsIgnoreCase("vehicleRelationships")
					
					//equalsIgnoreCase("wholesaleC2CWITHDealer")
					//equalsIgnoreCase("wholesaleC2CWITHOUTDealer")
					
					
                    //value = arrayfield[1].trim();
                }
            }
			else if(String(arrayfield[1]).equalsIgnoreCase("NA")){
				value = '';
			}				
            if(value != '')
            responseTagAPINameSet.push(value); 
		
			console.log("value :::::::::::::" + value);
            //responseTagAPIName +=  value + ' ';
            //responseTagAPINameSet.push(value);
        }
       
		
		
        dynamicUCIDResponseMap.set(tagName,metadataFieldsMap);
        console.log('UCID dynamicUCIDResponseMap-------------->' + dynamicUCIDResponseMap);
        
        console.log('UCID responseTagAPINameSet-------------->' + responseTagAPINameSet);
        
		responseTagAPINameSet.forEach(apiName => 
		responseTagAPIName += apiName + ' '
		);
		
		
        
        responseTagAPIName = responseTagAPIName.trim();	
		
		//if((tagName.equalsIgnoreCase("accountDetails")) || (tagName.equalsIgnoreCase("Account_DOCs")))
        responseTagAPIName = responseTagAPIName.replace(/ /g, ',');
		//if((!tagName.equalsIgnoreCase("accountDetails")) && (!tagName.equalsIgnoreCase("Account_DOCs")))
		//{responseTagAPIName = responseTagAPIName.replace(/ /g, '--');	
		//responseTagAPIName = responseTagAPIName.replace(/--/g, ', \', \' ,');
		//}		
        console.log('UCID TagNAME-------------->' + tagName);
        console.log('UCID TagNAME + responseTagAPIName-------------->' + tagName + ':::' + responseTagAPIName);
        return responseTagAPIName;
    }



module.exports = {
  getAccountRecords
};