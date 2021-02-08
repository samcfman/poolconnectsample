var searchUtility = require("./searchUtility.js");
	

var responseTagAPIName = ''; 
var metadataFieldsMap = new Map();
var salesConsultantSearch;
var salesConsultantFedIdInRequest;

String.prototype.equalsIgnoreCase = function (compareString) 
	{ return this.toUpperCase() === compareString.toUpperCase(); 
	};

    function performValidations(request) {
        console.log('enterd here');        
        var isValidRequest = false;
        //var isDealerInfoAvailable = Boolean(request.dealerNdCode')) || Boolean(request.dealerGcCode')) || Boolean(request.dealerGsCode'));
        var isApplicationNameAvailable = Boolean(request.applicationName);
        var isMessageIdAvailable = Boolean(request.messageId);
        var isMarketAvailable = Boolean(request.market);
        var isSearchTypeAvailable = Boolean(request.searchType);
        var isDedupSearchRule = isSearchTypeAvailable && (String(request.searchType).equalsIgnoreCase('Dedup'));
        var isRecordTypeAvailable = Boolean(request.recordType);
        var isLastNameAvailable = Boolean(request.lastname);
        var isCompanyNameAvailable = Boolean(request.companyName);
        var isFirstNameAvailable = Boolean(request.firstname);
        var market = request.market;
        var isEmailAvailable = Boolean(request.email);
        var isEmail2Available = Boolean(request.email2);
        var isEmail3Available = Boolean(request.email3);
        var isMobileAvailable = Boolean(request.mobilePhone);
        var isHomePhoneAvailable = Boolean(request.homePhone);
        var isWorkPhoneAvailable = Boolean(request.workPhone);
        var isSocialIDAvailable = Boolean(request.socialID);
        var isIDNumberAvailable = Boolean(request.idNumber);
        var isNativeFirstNameAvailable = Boolean(request.nativeFirstName);
        var isNativeLastNameAvailable = Boolean(request.nativeLastName);
        var isNativeCompanyNameAvailable = Boolean(request.nativeCompanyName);
        var isVatNoAvailable = Boolean(request.vatNo);
        var isCRNAvailable = Boolean(request.commercialRegistrationNumber);

        //Added By:Sachin Bhadane for external ID changes in dedup search - 25th June 2020
        var ismmIdAvailable = Boolean(request.mmId);
        var isciamIdAvailable = Boolean(request.ciamId);
        var islineIdAvailable = Boolean(request.lineId);        
        isValidRequest = ismmIdAvailable || isciamIdAvailable || islineIdAvailable;        
        if(isValidRequest == true) {
            return isValidRequest;
        }

        if(isDedupSearchRule && isMarketAvailable && isRecordTypeAvailable) {
            if(String(request.recordType).equalsIgnoreCase('Person Account')){
                if(!market.equalsIgnoreCase('ID') && !market.equalsIgnoreCase('KR') && !market.equalsIgnoreCase('VN')){
                       isValidRequest = isApplicationNameAvailable 
                           && isMessageIdAvailable 
                           && isMarketAvailable
                           && isFirstNameAvailable
                           && isLastNameAvailable
                           && (isSocialIDAvailable || isIDNumberAvailable || isEmailAvailable || isEmail3Available || isMobileAvailable || isHomePhoneAvailable || isWorkPhoneAvailable);
                       if(isValidRequest == false && market.equalsIgnoreCase('JP')){
                           isValidRequest = isApplicationNameAvailable 
                               && isMessageIdAvailable 
                               && isMarketAvailable
                               && isNativeFirstNameAvailable
                               && isNativeLastNameAvailable
                               && (isEmailAvailable || isEmail3Available || isMobileAvailable || isHomePhoneAvailable || isWorkPhoneAvailable);
                       }
                   }else if(market.equalsIgnoreCase('ID') || market.equalsIgnoreCase('KR') || market.equalsIgnoreCase('VN')){
                                isValidRequest = isApplicationNameAvailable 
                                    && isMessageIdAvailable 
                                    && isMarketAvailable
                                    && isLastNameAvailable
                                    && (isSocialIDAvailable || isIDNumberAvailable || isEmailAvailable || isMobileAvailable || isHomePhoneAvailable || isWorkPhoneAvailable); 
                            }
            }else if(String(request.recordType).equalsIgnoreCase('Company')){
                if(isMarketAvailable){
                    isValidRequest = isApplicationNameAvailable 
                        && isMessageIdAvailable 
                        && isMarketAvailable
                        && isCompanyNameAvailable
                        && (isVatNoAvailable || isCRNAvailable || isEmailAvailable || isEmail2Available || isMobileAvailable || isHomePhoneAvailable || isWorkPhoneAvailable);
                    if(isValidRequest == false && market.equalsIgnoreCase('JP')){
                        isValidRequest = isApplicationNameAvailable 
                            && isMessageIdAvailable 
                            && isMarketAvailable
                            && isNativeCompanyNameAvailable
                            && (isEmailAvailable || isEmail2Available || isMobileAvailable || isHomePhoneAvailable || isWorkPhoneAvailable); 
                    }
                }
            }
        }
        return isValidRequest;
    }
    
    //Checking Search is Dedup or not
    function performSearch(oneAPIMetadataList, request, dealerId) {
        var isValidRequest = false;
		var returnMap = new Map();
        
        
		searchUtility.getFormattedPhoneNumbers(oneAPIMetadataList, request);
        
        salesConsultantSearch = oneAPIMetadataList[0].sales_consultant_search__c;
        salesConsultantFedIdInRequest = request.salesConsultantFedId;
        var searchType = request.searchType;
        if(searchType!=null && searchType.equalsIgnoreCase('Dedup')){
           returnMap = performDeDupSearch(oneAPIMetadataList,request, dealerId);
        }
        return returnMap;
    }
    
    //Dedup Search Condition Check (Static or Dynamic)
    function performDeDupSearch(oneAPIMetadataList, request, dealerId) {
        var isValidRequest = false;
		var returnMap = new Map();
		var finalQueryMap = new Map();
        try{
            //One_API_Search_Configuration__mdt oneAPIMetadataList = oneAPIMetadataList.get(0);
           
		   var exactDedupSearch = oneAPIMetadataList[0].dynamic_exact_search__c;
            if(true == exactDedupSearch) {
				console.log('Inside if');
                finalQueryMap = performDynamicDedupSearch(oneAPIMetadataList,request, dealerId);
                /*if(lstDynamicdedupSearchAcc != null && lstDynamicdedupSearchAcc.size()>0){
                    responseMap.set('accountList', getAccountDetails(oneAPIMetadataList, lstDynamicdedupSearchAcc, requestMap, dealerAccountList));
                }*/
                isValidRequest = true;
            }
        } catch(error) {
            isValidRequest = false;
            console.error( "error in try block of performDedupsearch :::::::::" + error);
         }
        //console.log('---------> performDeDupSearch method - isValidRequest ---'+isValidRequest);
		
		returnMap.set('isValidRequest' , isValidRequest);
		returnMap.set('finalQueryMap' , finalQueryMap);
		
        return returnMap;
    }
	
	//Static Dynmic Dedup Search Main
   function performDynamicDedupSearch(oneAPIMetadataList, request, dealerId) {
	   
	    var finalQueryMap = new Map();
        var isPersonAccount = request.recordType!= null && String(request.recordType).equalsIgnoreCase('Person Account');
        var isCompanyAccount = request.recordType!= null && String(request.recordType).equalsIgnoreCase('Company');
        
		var accountSearchType = (request.recordType!= null && String(request.recordType).equalsIgnoreCase('Person Account')) ? true : false;
        
		finalQueryMap = performDynamicAccountDedupSearch(oneAPIMetadataList, request,accountSearchType,dealerId);
        return finalQueryMap;
    }
	
	 //Dynmic Dedup  (Person or Company) Search 
   function performDynamicAccountDedupSearch(oneAPIMetadataList, request, accSearchType, dealerId) {
       
	    var searchCriteria;
        var recordTypeId = '';
	    var orAccountLnkMap = new Map();
		var andAccountLnkMap = new Map();
		var finalQueyParam = [];
		var retailQueryMap = new Map();
		var wholesaleQueryMap = new Map();
		var finalMap = new Map();
		var accList;
		var whereClause;
		var searchtype = '';
		var queryString = '';
		
       if(accSearchType){
           searchCriteria  = oneAPIMetadataList[0].dynamic_person_search_fields__c;
           recordType = request.recordType;
           recordTypeId = '(select sfid from herokusbox.recordtype where sobjecttype = \'Account\' and Name = \'Person Account\')';
       }else {
           searchCriteria = oneAPIMetadataList[0].dynamic_company_search_fields__c;
           console.log('what is searchCriteria ---> ' + searchCriteria);
           recordType = request.recordType;
           recordTypeId = '(select sfid from herokusbox.recordtype where sobjecttype = \'Account\' and Name = \'Company\')';
       }
       
       var isDealerGSCodeEmpty  = Boolean(!request.dealerGsCode);
       var isDealerGCCodeEmpty  = Boolean(!request.dealerGcCode);
       var isDealerNDCodeEmpty  = Boolean(!request.dealerNdCode);
	   
       var isEcoSystemEnabled = oneAPIMetadataList[0].ecosystem_enabled__c;
       var isMatchingRuleSearch = oneAPIMetadataList[0].use_matching_rules__c;
       var isnewArchEnabled = oneAPIMetadataList[0].retailcopyatcompany__c;
	   
       var orderbyField  = oneAPIMetadataList[0].order_by_field__c;
	   
       var iscustomTypeEnabled = oneAPIMetadataList[0].enabled_customer_type__c;
       
       //Added By:Sachin Bhadane for external ID changes in dedup search - 25th June 2020       
        //externalIDWrapper = OneAPISearchDomainMain.getAccountIdSet(requestMap, oneAPIMetadataList[0]);
        
		//console.log('externalIDWrapper===========>'+externalIDWrapper);
        
		console.log('what is isDealerGSCodeEmpty ---> ' + isDealerGSCodeEmpty);
        console.log('what is isDealerGCCodeEmpty ---> ' + isDealerGCCodeEmpty);
        console.log('what is isDealerNDCodeEmpty ---> ' + isDealerNDCodeEmpty);
       
	    
        var isDealerInfoAvailable = false;
		
        if((isDealerNDCodeEmpty == false || isDealerGSCodeEmpty == false) || isDealerGCCodeEmpty == false) {
            isDealerInfoAvailable = true;
            retailQueryMap = dynamicRetailSearch(oneAPIMetadataList, request,accSearchType, dealerId);
        }
         
        //if(accntLinkList == null || accntLinkList.size() == 0) { //will be checked in server.js where the actual query runs
            
			var whereClause = ' and a.recordTypeID='+ recordTypeId + ' AND a.Market__c=\''+ request.market +'\'';
            
            var strAccountBaseQueryDynamicSearch;
			
            //method call to dynamically set the fields and query
            if(true == oneAPIMetadataList[0].enabled_dynamic_response__c){
				searchtype = 'Wholesale';
                createDynamicResponseTagsAndFields(oneAPIMetadataList[0].wholesale_response_mapping__c, searchtype);
                if(responseTagAPIName != ''){
                    strAccountBaseQueryDynamicSearch = 'SELECT ' + responseTagAPIName + ' FROM herokusbox.account a INNER JOIN herokusbox.recordtype recordType ON a.recordTypeID::VARCHAR = recordType.sfid::VARCHAR ';
                    console.log('------strAccountBaseQueryDynamicSearch------' + strAccountBaseQueryDynamicSearch);
					queryString = strAccountBaseQueryDynamicSearch;
                }else {
                    return accList;
                }
            }
            
			//Skipping this part for poc
			
          /*  String externalIdWhereClause = '';
            String finalExternalIDQuery = '';
            //set<Id> toRoleSet;
            list<Account_Link__c> accountLinkListWithExternalIds;
            Boolean isExternalIDProcessing = false;
            set<Id> toRoleSet = new set<Id>();
            if(externalIDWrapper != null) { //This means request payload holds externalID tags and related values
                if(externalIDWrapper.externalIdPayloads != null && externalIDWrapper.externalIdPayloads.size() > 0) {
                    isExternalIDProcessing = true;
                }
                //toRoleSet = externalIDWrapper.accountIdSet;
                //If field configuration is at account level 
                if(externalIDWrapper.accountExternalIdFieldMap != null && externalIDWrapper.accountExternalIdFieldMap.size() > 0) {
                    String commaWhereClause = ' AND ( ';
                    String innerWhereClause = '';
                    Integer iCount = 0;
                    Boolean conditionFound = false;
                    for(String mapKey :externalIDWrapper.accountExternalIdFieldMap.keySet()) {
                        String fieldValue = externalIDWrapper.accountExternalIdFieldMap.get(mapKey);
                        if(fieldValue != null && fieldValue != '') {
                            conditionFound = true;
                            if(iCount == 0) {
                                innerWhereClause += ' '+mapKey+' =\''+ fieldValue + '\'' ;
                            } else {
                                innerWhereClause += ' OR '+mapKey+' =\''+ fieldValue + '\'' ;
                            }
                            iCount++;
                        }
                    }
                    if(conditionFound == true) {
                        externalIdWhereClause = commaWhereClause + innerWhereClause +' ) ';
                        console.log('-------------->'+externalIdWhereClause);
                        finalExternalIDQuery = strAccountBaseQueryDynamicSearch + whereClause + externalIdWhereClause;
                        if(orderbyField != null) {
                            finalExternalIDQuery  = finalExternalIDQuery + ' ORDER BY '+ orderbyField  + ' LIMIT 1 ';
                        }
                        console.log('finalExternalIDQuery------>'+finalExternalIDQuery);
                        accList = Database.query(finalExternalIDQuery);
                        if(accList != null && accList.size() > 0) {
                            return accList;
                        }
                    }
                } else if(externalIDWrapper.accountIdSet != null && externalIDWrapper.accountIdSet.size() > 0 ) { //If field configuration is at account link field level 
                    toRoleSet.addAll(externalIDWrapper.accountIdSet);
                    externalIdWhereClause =  ' AND Id IN :toRoleSet ';
                    finalExternalIDQuery = strAccountBaseQueryDynamicSearch + whereClause + externalIdWhereClause;
                    if(orderbyField != null) {
                        finalExternalIDQuery  = finalExternalIDQuery + ' ORDER BY '+ orderbyField  + ' LIMIT 1 ';
                    }
                    console.log('finalExternalIDQuery------>'+finalExternalIDQuery);
                    accList = Database.query(finalExternalIDQuery);
                    if(accList != null && accList.size() > 0) {
                        return accList;
                    } 
                }
            }

            //Means if dealer info is not available in request and no records are returned matchign to externalID then we need to execute the basic validations which we have bypassed initially 
            //(this is the case for wholesale search in dedup with externalIds in request)
            if(isDealerInfoAvailable == false) { 
                //Setting up all three externalIds as blank
                if(isExternalIDProcessing == true) {
                    map<String, String> externalIdPayloadMap = new map<String, String>();
                    //Capture existing externalID Values
                    for(String payloadName :externalIDWrapper.externalIdPayloads) {
                        externalIdPayloadMap.set(payloadName, requestMap.get(payloadName));
                    }
                    //Set the externalIds as null/blank
                    for(String payloadName :externalIDWrapper.externalIdPayloads) {
                        requestMap.set(payloadName,'');
                    }
                    externalIdLevelValidation = performValidations(requestMap, new map<String, Object>());
                    if(externalIdLevelValidation == false) {
                        throw new IntegrationException('Required Fields are Missing in Request payload');
                    }
                    //If validations are correct then we are putting the externalsIds back in request as-is for further wholesale processing if needed
                    for(String payloadName :externalIDWrapper.externalIdPayloads) {
                        requestMap.set(payloadName,externalIdPayloadMap.get(payloadName));
                    }
                    externalIdPayloadMap = null; //This map not needed now, so setting to null         
                }
            }
			
			*/
            //New External ID Code ends here
            
            //Step-2: In case if matchign record is not found in step-1 then proceed for searching based on dynamic criteria   
            
			searchCriteria = searchCriteria.replace(/\(/g,'');
            searchCriteria = searchCriteria.replace(/\)/g,'');
			
            console.log('what is searchCriteria ---> ' + searchCriteria);
			
			var personSerachFileds = searchCriteria.trim().split('&&');
			
             for(i=0; i<personSerachFileds.length;i++) {
				 
                if(String(personSerachFileds[i]).includes('OR')) {
					
                    var orArray = personSerachFileds[i].split('OR');
					
                    for(j=0; j<orArray.length;j++){
						
                        var orValues=orArray[j].split(':');
                        console.log('orValues'+orValues);
						if(orValues!=null){
                        if(String(orValues[1]).trim() != ''){
                            orAccountLnkMap.set(String(orValues[0]),String(orValues[1]));
							console.log ('orAccountLnkMap:::' + orAccountLnkMap);
                        }
                      }
                    }
                } else {
                    var andValues=personSerachFileds[i].split(':');
				    andAccountLnkMap.set(String(andValues[0]),String(andValues[1]));
                }
            }
			
			var paramCounter = 1;
		    const requestMap = new Map(Object.entries(request));
		   
		    for(let objKeySetANDCaluse of andAccountLnkMap.keys()) {
			
			var param1 = andAccountLnkMap.get(objKeySetANDCaluse);
			console.log('-----------> objKeySetANDCaluse::::' + objKeySetANDCaluse);
			console.log('-----------> param1::::' + param1);
			
			var requestAndString = requestMap.get(param1.trim());
			
			console.log('requestAndString.........' + requestAndString);
			if(requestAndString.length >0){
			
            if(param1.trim().equalsIgnoreCase('firstname') || param1.trim().equalsIgnoreCase('lastname') || param1.trim().equalsIgnoreCase('mobilePhone') || param1.trim().equalsIgnoreCase('homePhone') || param1.trim().equalsIgnoreCase('workPhone'))
			
			{   console.log('inside if of requestAndString');
				whereClause += ' AND ' + 'a.' + objKeySetANDCaluse.trim() +' like '+'$' + paramCounter;
            }
			
			else
			{	console.log('inside else of requestAndString');
				whereClause += ' AND ' + 'a.' + objKeySetANDCaluse.trim() +'= '+'$' + paramCounter;					
			}
			
			paramCounter ++;				
			finalQueyParam.push(param1);
			
		  }
        }
		   
		if(orAccountLnkMap.size > 0) {			
            whereClause = whereClause+ ' AND ';
        }
		
       whereClause += '( ';
       var counter = 0; 
         
	   for(let objKeySetORCaluse of orAccountLnkMap.keys()) {
			
			var param2 = orAccountLnkMap.get(objKeySetORCaluse);
			console.log('-----------> param2:::::::' + param2);		
			
			
			var requestOrString = requestMap.get(param2.trim());
			
			console.log('requestOrString.........' + requestOrString);
		
			//var requestOrString = "request." + param2;
			
			if(requestOrString.length >0)
			{
                if(counter == 0) {
                   
				   if(param2.trim().equalsIgnoreCase('firstname') || param2.trim().equalsIgnoreCase('lastname') || param2.trim().equalsIgnoreCase('mobilePhone') || param2.trim().equalsIgnoreCase('homePhone') || param2.trim().equalsIgnoreCase('workPhone'))
					{
						whereClause += 'a.' + objKeySetORCaluse.trim() +' like ' +'$' + paramCounter;
						finalQueyParam.push(param2);	
					}
					else{
						whereClause += 'a.' + objKeySetORCaluse.trim() +'= ' +'$' + paramCounter;
						finalQueyParam.push(param2);	
					
					}
					paramCounter++;
                    counter++;
                } else {
                   
					if(param2.trim().equalsIgnoreCase('firstname') || param2.trim().equalsIgnoreCase('lastname') || param2.trim().equalsIgnoreCase('mobilePhone') || param2.trim().equalsIgnoreCase('homePhone') || param2.trim().equalsIgnoreCase('workPhone')){					
						
						whereClause += ' OR '+ 'a.' + objKeySetORCaluse.trim() +' like ' +'$' + paramCounter;
						finalQueyParam.push(param2);
						
					}					
					else{
						whereClause += ' OR '+ 'a.' + objKeySetORCaluse.trim() +'= ' +'$' + paramCounter;
						finalQueyParam.push(param2);
					}
					paramCounter++;
					
                }
            }
        }
		   
		   whereClause += ')';
		   
           if(isEcoSystemEnabled && iscustomTypeEnabled){
             whereClause  = whereClause + ' AND a.Dealer_Ecosystem__c = true AND a.MPC_Ecosystem__c = true AND a.Customer_Type__c=\''+ request.customerType + '\'';
           } else if(isEcoSystemEnabled && !iscustomTypeEnabled){
                whereClause  = whereClause + ' AND a.Dealer_Ecosystem__c = true AND a.MPC_Ecosystem__c = true ';
           } else if(!isEcoSystemEnabled && iscustomTypeEnabled){
             whereClause  = whereClause + ' AND a.Customer_Type__c=\''+ request.customerType + '\'';
           }
            
            console.log('----where clause---'+whereClause);
			
            //Narendra to add external id where clause for dedup search
            strAccountBaseQueryDynamicSearch += whereClause;
            //strAccountBaseQueryDynamicSearch += ' order by ' ;
            if(orderbyField != null) {
                strAccountBaseQueryDynamicSearch  = strAccountBaseQueryDynamicSearch + ' order by a.' + orderbyField  + ' LIMIT 1 ';
            }
			
            var replacemobile = 'REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(a.Mobile__c,' + '\'\-\'' + ',' + '\'\'' + ')' + ',' + '\'\+\'' + ',' + '\'\'' + ')' + ',' + '\'\)\'' + ',' + '\'\'' + ')' + ',' + '\'\(\'' + ',' + '\'\'' + ')' + ',' + '\'\  \'' + ',' + '\'\'' + ')';
		
			var replacehomeph = 'REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(a.Individual_Home_Phone__c,' + '\'\-\'' + ',' + '\'\'' + ')' + ',' + '\'\+\'' + ',' + '\'\'' + ')' + ',' + '\'\)\'' + ',' + '\'\'' + ')' + ',' + '\'\(\'' + ',' + '\'\'' + ')' + ',' + '\'\  \'' + ',' + '\'\'' + ')';
			
			var replaceworkph = 'REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(a.Work_Phone__c,' + '\'\-\'' + ',' + '\'\'' + ')' + ',' + '\'\+\'' + ',' + '\'\'' + ')' + ',' + '\'\)\'' + ',' + '\'\'' + ')' + ',' + '\'\(\'' + ',' + '\'\'' + ')' + ',' + '\'\  \'' + ',' + '\'\'' + ')';
			
			strAccountBaseQueryDynamicSearch = strAccountBaseQueryDynamicSearch.replace(/a.Mobile_For_Search__c/g, replacemobile);
			strAccountBaseQueryDynamicSearch = strAccountBaseQueryDynamicSearch.replace(/a.Home_Phone_For_Search__c/g, replacehomeph);
			strAccountBaseQueryDynamicSearch = strAccountBaseQueryDynamicSearch.replace(/a.Work_Phone_For_Search__c/g, replaceworkph);
			
			wholesaleQueryMap.set('finalQuery', strAccountBaseQueryDynamicSearch);
			wholesaleQueryMap.set('queryString', queryString);
			wholesaleQueryMap.set('finalQueryParam', finalQueyParam);
			
			console.log('-----------> final query ::strAccountBaseQueryDynamicSearch ::::::::::' + strAccountBaseQueryDynamicSearch);
        
		
		/* // to be implemented in server.js where the actual query runs
		   accList = Database.query(queryString);
            //Adding changes to populate Dealer codes as null if Account is returned from wholesale search
            if(accList != null && accList.size() > 0) {
                console.log('----accList---'+accList);
                accList[0].Dealer_ND_Code__c = null;
                accList[0].Dealer_GS_Code__c = null;
                accList[0].Dealer_GC_Code__c = null;
            } */
        /*} else if(accntLinkList.size()> 0) {
            console.log('accntLinkList + Size ----> '+accntLinkList + 'SIZE ' + accntLinkList.size());
            String queryString;
            String accountId = accntLinkList[0].toRole__r.Id;
            console.log('accountId -------------->' + accountId);
            List<Account> accountList = new List<Account>();
            console.log('fieldsToQuery -------------->' + responseTagAPIName);
            Account accountRecord = new Account();
            //Implemented dynamic reponse switch            
            if(true == oneAPIMetadataList[0].Enabled_Dynamic_Response__c){
                createDynamicResponseTagsAndFields(oneAPIMetadataList[0].Wholesale_Response_Mapping__c);
                if(String.isNotBlank(responseTagAPIName)){
                    queryString = 'SELECT ' + responseTagAPIName + ' FROM Account WHERE Id =: accountId';
                    console.log('------queryString------' + queryString);
                }else {
                    return accList;
                } 
                accountList = Database.query(queryString);
                console.log('accountList -------------->' + accountList);
            } 
            if(accountList != NULL && accountList.size()>0) {
                accList.add(accountList[0]);
                console.log('accList - ------ - - '+accList);
            }
           console.log('accList==========>'+accList);
    } */ //will be implemented in server.js where the actual query runs
	
	finalMap.set('retailQueryMap', retailQueryMap);
	finalMap.set('wholesaleQueryMap', wholesaleQueryMap);
	
	return finalMap;
       
   }
   
   
   //Getting Retail Company or Person Account Link(s) based on Dealer record(s)
    function dynamicRetailSearch(oneAPIMetadataList, request, accSearchType, dealerId) {
		
		console.log('inside dynamicRetailSearch::::::::::::::::::::::::');
		
		var accLinkList;
		var orAccountLnkMap = new Map();
		var andAccountLnkMap = new Map();
		var finalMap = new Map();
		var finalQueyParam = [];
		var resmap = '';
        
        //method call to dynamically set the fields and query
		
        if(true == oneAPIMetadataList[0].enabled_dynamic_response__c){
			console.log('inside if');
			searchtype = 'Retail';
			resmap = oneAPIMetadataList[0].retail_response_mapping__c;
			console.log('resmap::::::::::::::' + resmap);
            createDynamicResponseTagsAndFields(resmap, searchtype);
        }
        var iscustomTypeEnabled = oneAPIMetadataList[0].enabled_customer_type__c;
        var isDealerDefaultFlag = oneAPIMetadataList[0].use_dealer_default_flag__c;
        var isRetailCopyAtCompany = oneAPIMetadataList[0].retailcopyatcompany__c;
        
		//Venkata Surendra to add external id where clause for dedup search
        //String externalIDLevel = oneAPIMetadataList[0].External_ID_Level__c;
        //String accountExternalField = oneAPIMetadataList[0].External_Id_Entity__c;
       
	    var isDealerGCCodeEmpty  = Boolean(!request.dealerGcCode);
        
        //External ID Changes
        /*String lineId = requestMap.get('lineId');
        String mmId = requestMap.get('mmId');
        String ciamId = requestMap.get('ciamId');*/
        
        //String strAccLinkBaseQueryDynamicSearch = oneAPIMetadataList[0].Account_Link_Base_Query__c;
        
		var strAccLinkBaseQueryDynamicSearch;
        
		if(true == oneAPIMetadataList[0].enabled_dynamic_response__c){        
            
			if(responseTagAPIName!= ''){
				
                strAccLinkBaseQueryDynamicSearch = 'SELECT ' + responseTagAPIName + ' FROM herokusbox.Account_Link__c ac INNER JOIN herokusbox.Account a ON ac.fromRole__c::VARCHAR = a.sfid::VARCHAR INNER JOIN herokusbox.Account a1 ON ac.toRole__c::VARCHAR = a1.sfid::VARCHAR INNER JOIN herokusbox.recordtype recordType ON ac.recordTypeID::VARCHAR = recordType.sfid::VARCHAR ';
				
                console.log('------strAccLinkBaseQueryDynamicSearch------' + strAccLinkBaseQueryDynamicSearch);
            }else {
                return accLinkList;
            }
        }
        
        var searchCriteria;
		
        if(accSearchType){
            searchCriteria  = oneAPIMetadataList[0].dynamic_person_search_retail_fields__c;
            recordTypeID = '(select sfid from herokusbox.recordtype where sobjecttype = \'Account_Link__c\' and Name = \'Retail Person\')';
        }else {
            searchCriteria = oneAPIMetadataList[0].dynamic_company_search_retail_fields__c;
            recordTypeID = '(select sfid from herokusbox.recordtype where sobjecttype = \'Account_Link__c\' and Name = \'Retail Company\')';
        }
        
		/*Account dealerAccount = getDealerRecord(isRetailCopyAtCompany, isDealerDefaultFlag, oneAPIMetadataList,requestMap);
        if(dealerAccount == null || dealerAccount.id == null) {
            return null;
        }
        if(dealerAccount != null) {
            dealerAccountList.add(dealerAccount);
        }
        console.log('dealerAccountList------>'+dealerAccountList); */
        
		var whereClause = ' AND RecordType.sfid='+ recordTypeID + ' AND ac.Market__c=\''+ request.market +'\'';		
        
        var orderbyField  = oneAPIMetadataList[0].order_by_field__c;


		//skipping external id part for poc	
        
       /* String externalIdWhereClause = '';
        String finalExternalIDQuery = '';
        set<Id> toRoleSet;
        list<Account_Link__c> accountLinkListWithExternalIds;
        Boolean isExternalIDProcessing = false;
        if(externalIDWrapper != null) {
            if(externalIDWrapper.externalIdPayloads != null && externalIDWrapper.externalIdPayloads.size() > 0) {
                isExternalIDProcessing = true;
            }
            toRoleSet = externalIDWrapper.accountIdSet;
            if(toRoleSet != null && toRoleSet.size() > 0) {
                externalIdWhereClause += ' AND toRole__c In :toRoleSet ';
                finalExternalIDQuery = strAccLinkBaseQueryDynamicSearch + whereClause + externalIdWhereClause;
                finalExternalIDQuery += ' AND  Retail_Duplicate_Flag__c= false '+
                          ' AND fromRole__c = \''+ dealerAccount.Id +'\''+' ';
                if(orderbyField != null) {
                    finalExternalIDQuery  = finalExternalIDQuery + ' ORDER BY '+ orderbyField  + ' LIMIT 1 ';
                }
                console.log('finalExternalIDQuery------>'+finalExternalIDQuery);
                console.log('dealerAccount.Id---------->'+dealerAccount.Id);
                console.log('dealerAccount.Id---------->'+toRoleSet);
                accountLinkListWithExternalIds = database.query(finalExternalIDQuery);
            }
        }
        if(accountLinkListWithExternalIds != null && accountLinkListWithExternalIds.size() > 0) {
            return accountLinkListWithExternalIds;
        }
        //In Case if no records matching to externalIds then do the proper validations again for normal search parameters which we have by passed
        //Setting respective externalIds as blank in requestMap so that validation would work properly
        if(isExternalIDProcessing == true) {
            map<String, String> externalIdPayloadMap = new map<String, String>();
            //Capture existing externalID Values
            for(String payloadName :externalIDWrapper.externalIdPayloads) {
                externalIdPayloadMap.set(payloadName, requestMap.get(payloadName));
            }
            //Set the externalIds as null/blank
            for(String payloadName :externalIDWrapper.externalIdPayloads) {
                requestMap.set(payloadName,'');
            }
            externalIdLevelValidation = performValidations(requestMap, new map<String, Object>());
            if(externalIdLevelValidation == false) {
                throw new IntegrationException('Required Fields are Missing in Request payload');
            }
            //If validations are correct then we are putting the externalsIds back in request as-is for further wholesale processing if needed
            for(String payloadName :externalIDWrapper.externalIdPayloads) {
                requestMap.set(payloadName,externalIdPayloadMap.get(payloadName));
            }
            externalIdPayloadMap = null; //This map not needed now, so setting to null         
        }
		
		*/
		
		
        
        if(dealerId != null){
            whereClause += ' AND ac.Retail_Duplicate_Flag__c= false AND ac.fromRole__c=\''+ dealerId +'\'';
        }else {
            return accLinkList;
        }
		
		 var customertype = request.customerType;
               
         if(iscustomTypeEnabled && customertype!= null && (!customertype == '')){
            whereClause += ' AND a1.Customer_Type__c =\''+ customertype +'\'';
        }	
        
        //Step-2: In case if matchign record is not found in step-1 then proceed for searching based on dynamic criteria
		
        searchCriteria = searchCriteria.replace(/\(/g,'');
        searchCriteria = searchCriteria.replace(/\)/g,'');
		
        console.log('searchCriteria=========>'+searchCriteria);
		
		var personSerachFileds = searchCriteria.split('&&');
		
		//console.log ("companySearchFileds::::: " + companySearchFileds);
		
		for (i=0; i<personSerachFileds.length;i++) {
			
            if(personSerachFileds[i].includes('OR')) {
				
                var orArray = personSerachFileds[i].split('OR');
				
                console.log('orArray=========>'+orArray);
				
                for(j=0; j<orArray.length;j++){
					
                    var orValues=orArray[j].split(':');
					
                    console.log('orValues=========>'+orValues);
					
                    if(orValues!=null){
						
						if(String(orValues[1]).trim() != ''){
                            orAccountLnkMap.set(String(orValues[0]),String(orValues[1]));
                        }
                    }
                }
            } else {
                var andValues=personSerachFileds[i].split(':');
				andAccountLnkMap.set(String(andValues[0]),String(andValues[1]));
            }
        }
        
		
		var paramCounter = 1;
		const requestMap = new Map(Object.entries(request));
		
        for(let objKeySetANDCaluse of andAccountLnkMap.keys()) {
            
			 
			var param1 = andAccountLnkMap.get(objKeySetANDCaluse);
			//console.log('-----------> objKeySetANDCaluse::::' + objKeySetANDCaluse);
			console.log('-----------> param1::::' + param1);
			
			var requestAndString = requestMap.get(param1.trim());
			
			console.log('requestAndString.........' + requestAndString);
			if(requestAndString.length >0)
				
			{ if(param1.trim().equalsIgnoreCase('firstname') || param1.trim().equalsIgnoreCase('lastname') || param1.trim().equalsIgnoreCase('mobilePhone') || param1.trim().equalsIgnoreCase('homePhone') || param1.trim().equalsIgnoreCase('workPhone'))
				{ 
					console.log('inside if of requestAndString');
					whereClause += ' AND ' + 'ac.' + objKeySetANDCaluse.trim() +' like '+'$' + paramCounter;
				
				}
				else{
					console.log('inside else of requestAndString');				
					whereClause += ' AND ' + 'ac.' + objKeySetANDCaluse.trim() +'= '+'$' + paramCounter;
				}
				paramCounter ++;
				
				finalQueyParam.push(param1);	
				
            }
        }
		
		if(orAccountLnkMap.size > 0) {
			
            whereClause = whereClause+ ' AND ';
        }
        whereClause += '( ';
        var counter = 0;
		
		for(let objKeySetORCaluse of orAccountLnkMap.keys()) {
			var param2 = orAccountLnkMap.get(objKeySetORCaluse);
			console.log('-----------> param2:::::::' + param2);	
			var requestOrString = requestMap.get(param2.trim());
			console.log('requestOrString.........' + requestOrString);
			if(requestOrString.length >0)
			{
                if(counter == 0) {
                   
				   if(param2.trim().equalsIgnoreCase('firstname') || param2.trim().equalsIgnoreCase('lastname') || param2.trim().equalsIgnoreCase('mobilePhone') || param2.trim().equalsIgnoreCase('homePhone') || param2.trim().equalsIgnoreCase('workPhone'))
					{
						whereClause += 'ac.' + objKeySetORCaluse.trim() +'like ' +'$' + paramCounter;
						finalQueyParam.push(param2);	
					}
					else{
						
						whereClause += 'ac.' + objKeySetORCaluse.trim() +'= ' +'$' + paramCounter;
						finalQueyParam.push(param2);						
					}
					paramCounter++;
                    counter++;
                } else {
                   
					if(param2.trim().equalsIgnoreCase('firstname') || param2.trim().equalsIgnoreCase('lastname') || param2.trim().equalsIgnoreCase('mobilePhone') || param2.trim().equalsIgnoreCase('homePhone') || param2.trim().equalsIgnoreCase('workPhone')){						
						
						whereClause += ' OR '+ 'ac.' + objKeySetORCaluse.trim() +'like ' +'$' + paramCounter;
						finalQueyParam.push(param2);
						
					}					
					else{
						whereClause += ' OR '+ 'ac.' + objKeySetORCaluse.trim() +'= ' +'$' + paramCounter;
						finalQueyParam.push(param2);
					}
					paramCounter++;
					
                }
            }
        }
		
		
        whereClause += ' ) ';
        console.log ("finalQueyParam :::::::::" + finalQueyParam);
        strAccLinkBaseQueryDynamicSearch += whereClause;
        
        if(orderbyField != null) {
            strAccLinkBaseQueryDynamicSearch  = strAccLinkBaseQueryDynamicSearch + ' ORDER BY ac.'+ orderbyField  + ' LIMIT 1 ';
        } 
		
		var replacemobile = 'REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(ac.Retail_Mobile__c,' + '\'\-\'' + ',' + '\'\'' + ')' + ',' + '\'\+\'' + ',' + '\'\'' + ')' + ',' + '\'\)\'' + ',' + '\'\'' + ')' + ',' + '\'\(\'' + ',' + '\'\'' + ')' + ',' + '\'\  \'' + ',' + '\'\'' + ')';
		
		var replacehomeph = 'REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(ac.Retail_Individual_Home_Phone__c,' + '\'\-\'' + ',' + '\'\'' + ')' + ',' + '\'\+\'' + ',' + '\'\'' + ')' + ',' + '\'\)\'' + ',' + '\'\'' + ')' + ',' + '\'\(\'' + ',' + '\'\'' + ')' + ',' + '\'\  \'' + ',' + '\'\'' + ')';
		
		var replaceworkph = 'REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(ac.Retail_Work_Phone__c,' + '\'\-\'' + ',' + '\'\'' + ')' + ',' + '\'\+\'' + ',' + '\'\'' + ')' + ',' + '\'\)\'' + ',' + '\'\'' + ')' + ',' + '\'\(\'' + ',' + '\'\'' + ')' + ',' + '\'\  \'' + ',' + '\'\'' + ')';
		
		strAccLinkBaseQueryDynamicSearch = strAccLinkBaseQueryDynamicSearch.replace(/ac.Retail_Mobile_For_Search__c/g, replacemobile);
		strAccLinkBaseQueryDynamicSearch = strAccLinkBaseQueryDynamicSearch.replace(/ac.Retail_Home_Phone_For_Search__c/g, replacehomeph);
		strAccLinkBaseQueryDynamicSearch = strAccLinkBaseQueryDynamicSearch.replace(/ac.Retail_Work_Phone_For_Search__c/g, replaceworkph);
        
		finalMap.set('finalQuery', strAccLinkBaseQueryDynamicSearch);
		finalMap.set('finalQueryParam', finalQueyParam);
		console.log('-----------> final query ::strAccLinkBaseQueryDynamicSearch ::::::::::' + strAccLinkBaseQueryDynamicSearch);
		
		return finalMap;
    }
  	
	
	function createDynamicResponseTagsAndFields(dynamicMapping, searchtype){
        
		console.log('INSIDE createDynamicResponseTagsAndFields -------------->');
        console.log('dynamicMapping -------------->' + dynamicMapping);
		console.log('searchtype ------------------>' + searchtype);
        
		var value='';
		var responseTagAPINameSet = [];
		var apiNameList;       
		responseTagAPIName = '';
		
        var result = dynamicMapping.split(',');
		 for (i=0; i<result.length;i++) {
            //console.log('row value -------------->' + result[i]);
            
			var arrayfield = result[i].split(':');
            console.log('arrayfield -------------->' + arrayfield);
			
			metadataFieldsMap.set(String(arrayfield[0]), String(arrayfield[1]));
			
            if(!(String(arrayfield[1]).equalsIgnoreCase("NA"))){
				
                if(String(arrayfield[1]).includes('-')){
		 			
                    apiNameList = String(arrayfield[1]).split('-');
					//console.log('apiNameList -------------->' + apiNameList);
                    //console.log('apiNameList -------------->' + apiNameList + ' SIZE ' + apiNameList.length);
                    if(apiNameList!= null && apiNameList.length == 2){
                        value = apiNameList[0].trim() + '.' + apiNameList[1].trim();
                    }else if(apiNameList!= null && apiNameList.length == 3){
                        value = apiNameList[0].trim() + '.' + apiNameList[1].trim() + '.' + apiNameList[2].trim();
                    }else if(apiNameList!= null && apiNameList.length == 4){
                        value = apiNameList[0].trim() + '.' + apiNameList[1].trim() + '.' + apiNameList[2].trim() + '.' + apiNameList[3].trim();
                    }
					console.log('value inside if -------------->' + value);
                }else {
					
					if(searchtype == 'Retail')
					{
						console.log('inside if retail');
						value = 'ac.' + String(arrayfield[1]).trim();
					}
					else if(searchtype == 'Wholesale')
					{
						console.log('inside else if wholesale');
						value = 'a.' + String(arrayfield[1]).trim();
					}
					console.log('value inside else -------------->' + value);
                }                
            } else if(String(arrayfield[1]).equalsIgnoreCase("NA")){
				value = '';
			}				
            if(value != '')
            responseTagAPINameSet.push(value); 
			
			//console.log('value after if ::::::::::::::' + value);
        
		}
		
		console.log ('metadataFieldsMap size::::::::::::::::' + metadataFieldsMap.size);
        
        responseTagAPINameSet.forEach(apiName => 
		responseTagAPIName += apiName + ' '
		);
        
        responseTagAPIName = responseTagAPIName.trim();
        responseTagAPIName = responseTagAPIName.replace(/ /g, ',');
		responseTagAPIName = responseTagAPIName.replace(/toRole__r/g, 'a1');
		responseTagAPIName = responseTagAPIName.replace(/fromRole__r/g, 'a');
		responseTagAPIName = responseTagAPIName.replace(/recordType.Name/, 'recordType.Name as rname');
		
        console.log('responseTagAPIName -------------->' + responseTagAPIName);
        console.log('metadataFieldsMap -------------->' + metadataFieldsMap);
    }
	
	
	//Dedup Serach Account Details mappings to Match JSON Response
    function getAccountDetails(oneAPIMetadataList, accountDetails, request) {
		
         var accountListRecords = [];
		 
         if(accountDetails.length >0) {
              for(i = 0; i<accountDetails.length; i++) {
                  
				  if(true == oneAPIMetadataList[0].enabled_dynamic_response__c){
					  
                      var responseMap = dynamicAccountMappings(accountDetails[i], request);    
					  accountListRecords.push(responseMap);
					  
                  }
              }
           }
       return accountListRecords;
    }
	
	//Account Records Mappings w.r.t the fields configured at metadata level
    function dynamicAccountMappings(account, request){
		
		console.log('<--------- INSIDE dynamicAccountLinkMappings ------------>');
		
        var objectValue;
        var value;
        var apiNameList;        
        var responseMap = new Map();
		var accountMap = new Map(Object.entries(account));
        
        //To handle Date format in response
        //Schema.SObjectType t = Schema.getGlobalDescribe().get('account');    
        //Schema.DescribeSObjectResult r = t.getDescribe();
        //Date dateValue;
        
        responseMap.set('messageId', request.messageId);
        responseMap.set('messageStatus', 'Success');
        responseMap.set('errorCode', '');
        responseMap.set('errorMessage', '');
        responseMap.set('errorCategory', '');
        //responseMap.set('recordtypeName',(account.recordtypeid == PERSONRECORDTYPEID)?'Person Account':'Company');
        
		console.log('metadataFieldsMap ====>' + metadataFieldsMap);
		
        if(metadataFieldsMap != null && metadataFieldsMap.size>0){
			
            for(let responseTag of metadataFieldsMap.keys()){
                console.log('responseTag ====>' + responseTag);
				
                if(responseTag.equalsIgnoreCase('salesConsultantFedId')){
					
                    if(salesConsultantSearch != null){
                        if(salesConsultantSearch.equalsIgnoreCase('None')){
                            responseMap.set(responseTag, salesConsultantFedIdInRequest);
                        }else if(salesConsultantSearch.equalsIgnoreCase('Owner')){
                            //Code to implemented as per the desin finalized
                            responseMap.set(responseTag, salesConsultantFedIdInRequest);
                        }else if(salesConsultantSearch.equals('Sales Consultant')){
                            //Code to implemented as per the desin finalized
                            responseMap.set(responseTag, salesConsultantFedIdInRequest);
                        } 
                    }else { // Else part to be removed post final design implementation
                        responseMap.set(responseTag, salesConsultantFedIdInRequest);
                    }
                }
				else if (responseTag =='recordTypeName'){							
						   responseMap.set(responseTag, accountMap.get('rname'));				
				}				
				else {
					
                    objectValue = metadataFieldsMap.get(responseTag);
                    console.log('objectValue ====>' + objectValue);
					
                    if(String(objectValue).equalsIgnoreCase('NA')){
                        
						console.log('INSIDE IF ====>');
                        responseMap.set(responseTag, '');                    
                    }
					else {
                        if(objectValue.includes('-')){
                            console.log('INSIDE IF ====>');
							
                            apiNameList = objectValue.split('-');
                            console.log('apiNameList ====>' + apiNameList);
							
                            if(apiNameList != null && apiNameList.length == 2){
                                   
									  key = (apiNameList[1].toLowerCase()).trim();
									  console.log('key ====>' + key);							  
									  value = accountMap.get(key);
									  console.log('value ====>' + value);
                                      responseMap.set(responseTag, (value == null || value.length == 0) ? '' : value);
									
                                }else if(apiNameList != null && apiNameList.size() == 3){
                                      key = (apiNameList[2].toLowerCase()).trim();
									  console.log('key ====>' + key);
									  value = accountMap.get(key);
									  console.log('value ====>' + value);
                                      responseMap.set(responseTag, (value == null || value.length == 0) ? '' : value);
									
                                }else if(apiNameList != null && apiNameList.size() == 4){
                                      key = (apiNameList[3].toLowerCase()).trim();
									  console.log('key ====>' + key);
									  value = accountMap.get(key);
									  console.log('value ====>' + value);
                                      responseMap.set(responseTag, (value == null || value.length == 0) ? '' : value);
                                }
                        }else {
							
							console.log ('inside else as objectValue does not include -');
                            /*Schema.DescribeFieldResult f = r.fields.getMap().get(metadataFieldsMap.get(responseTag)).getDescribe();
                            if(f.getType() == Schema.DisplayType.Date){
                                dateValue = Date.valueOf(account.get(metadataFieldsMap.get(responseTag))); 
                                if(null == dateValue){
                                    responseMap.set(responseTag, '');    
                                }else{
                                    responseMap.set(responseTag, dateValue);
                                }
                            }else {
                                value = String.valueOf(account.get(metadataFieldsMap.get(responseTag)));
                                responseMap.set(responseTag, String.isBlank(value)? '' : value);
                            } */
							
							console.log ('objectValue ::::::::::: ' + objectValue);
							if(objectValue != null)
							key = (objectValue.toLowerCase()).trim();
							if(key.includes('date')){
								var value = accountMap.get(key);
								console.log ('value ::::::::::: ' + value);	
								
								if(value!= null && value.toString()!= null && value.toString().length>0){
								
								value = (value.toISOString()).replace(/\T.+/, '');								
								console.log ('date value in else ::::::::::: ' + value);
								}
							}
							else
							    value = accountMap.get(key);							
							//console.log ('value in else ::::::::::: ' + value.toString());
							
							responseMap.set(responseTag, (value == null || value.length == 0) ? '' : value);							
							
                        }
                    }
                }
            }
        }
        console.log('responseMap ----->' + responseMap);
        return responseMap;
    }
	
	
	
	
module.exports = {
  performValidations,
  performSearch,
  getAccountDetails
};	
	