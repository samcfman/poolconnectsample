var searchUtility = require("./searchUtility.js");

var responseTagAPIName = ''; 
var metadataFieldsMap = new Map();
var salesConsultantSearch;
var salesConsultantFedIdInRequest;

String.prototype.equalsIgnoreCase = function (compareString) 
	{ return this.toUpperCase() === compareString.toUpperCase(); 
	};

    

function performValidations(request) {
		console.log ("inside performValidations ::::::::::");
		var isValidRequest = false;
        var isDealerInfoAvailable = Boolean((request.dealerNdCode) || (request.dealerGcCode) || (request.dealerGsCode));
		var isSearchTypeAvailable = Boolean(request.searchType);
        var isMessageIdAvailable = Boolean(request.messageId);
        var isExactOrMatchingRuleSearch = Boolean(isSearchTypeAvailable && (request.searchType =='Retail'));
		var isUCIDSearch = Boolean(isSearchTypeAvailable && (request.searchType =='UCID Search'));
        var isMarketAvailable = Boolean(request.market);
		console.log ("isMarketAvailable ::::::::::" + isMarketAvailable);
		var isApplicationNameAvailable = Boolean(request.applicationName);
		var isPageSizeAvailable = Boolean(request.pageSize);
        var isPageCountAvailable = Boolean(request.pageCount);
        var isRecordTypeAvailable = Boolean(request.recordType);
        var market = request.market;
		console.log ("market inside performValidations ::::::::::" + market);
		var isFirstNameAvailable = Boolean(request.firstname);
        var isLastNameAvailable = Boolean(request.lastname);
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
        var isCompanyNameAvailable = Boolean(request.companyName);
        var isNativeCompanyNameAvailable = Boolean(request.nativeCompanyName);
		var isVatNoAvailable = Boolean(request.vatNo);
        var isCRNAvailable = Boolean(request.commercialRegistrationNumber);
                
        
        if(isExactOrMatchingRuleSearch && isMarketAvailable && isRecordTypeAvailable) {
            if(request.recordType == 'Person Account'){
                if(market!= 'ID' && market!= 'KR' && market!= 'VN'){
                       isValidRequest = isApplicationNameAvailable 
                           && isMessageIdAvailable 
                           && isMarketAvailable
                           && isFirstNameAvailable
                           && isLastNameAvailable
                           && isPageSizeAvailable
                           && isPageCountAvailable
                           && isDealerInfoAvailable
                           && (isSocialIDAvailable || isIDNumberAvailable || isEmailAvailable || isEmail3Available || isMobileAvailable || isHomePhoneAvailable || isWorkPhoneAvailable);
						   
                       if(isValidRequest == false && (market == 'JP')){
                           isValidRequest = isApplicationNameAvailable 
                               && isMessageIdAvailable 
                               && isMarketAvailable
                               && isNativeFirstNameAvailable
                               && isNativeLastNameAvailable
                               && isPageSizeAvailable
                               && isPageCountAvailable
                               && isDealerInfoAvailable
                               && (isEmailAvailable || isEmail3Available || isMobileAvailable || isHomePhoneAvailable || isWorkPhoneAvailable);
                       }
                   }else if(market == 'ID' || market == 'KR' || market == 'VN'){
                                isValidRequest = isApplicationNameAvailable 
                                    && isMessageIdAvailable 
                                    && isMarketAvailable
                                    && isLastNameAvailable
                                    && isPageSizeAvailable
                                    && isPageCountAvailable
                                    && isDealerInfoAvailable
                                    && (isSocialIDAvailable || isIDNumberAvailable || isEmailAvailable || isMobileAvailable || isHomePhoneAvailable || isWorkPhoneAvailable); 
                            }
            }else if(request.recordType == 'Company'){
                if(isMarketAvailable){
                    isValidRequest = isApplicationNameAvailable 
                        && isMessageIdAvailable 
                        && isMarketAvailable
                        && isCompanyNameAvailable
                        && isPageSizeAvailable
                        && isPageCountAvailable
                        && isDealerInfoAvailable
                        && (isVatNoAvailable || isCRNAvailable || isEmailAvailable || isEmail2Available || isMobileAvailable || isHomePhoneAvailable || isWorkPhoneAvailable);
                    if(isValidRequest == false && (market == 'JP')){
                        isValidRequest = isApplicationNameAvailable 
                            && isMessageIdAvailable 
                            && isMarketAvailable
                            && isNativeCompanyNameAvailable
                            && isPageSizeAvailable
                            && isPageCountAvailable
                            && isDealerInfoAvailable
                            && (isEmailAvailable || isEmail2Available || isMobileAvailable || isHomePhoneAvailable || isWorkPhoneAvailable); 
                    }
                }
            }
        }
        console.log('---------> performValidations method - isValidRequest ---' + isValidRequest);
        return isValidRequest;
		
}


function performSearch(newMetadataList, request, response, dealerId) {
        var isValidRequest = false;
		var returnMap = new Map();
        console.log ("inside performSearch ::::::::::");
		
        //Modify map with formatted phone number values        
		searchUtility.getFormattedPhoneNumbers(newMetadataList, request);
        console.log('----------> formatted Mobile Phone ' + request.mobilePhone);
        console.log('----------> formatted Home Phone ' + request.homePhone);
        console.log('----------> formatted Work Phone' + request.workPhone);
        
        salesConsultantSearch = newMetadataList[0].sales_consultant_search__c;
        salesConsultantFedIdInRequest = request.salesConsultantFedId;
        var searchType = request.searchType;
        console.log('========== searchType ================'+searchType);
        console.log('----------------> Retail before If');
        if(searchType =='Retail'){
            console.log('-------------> Retail Inside If');
            returnMap = performRetailSearch(newMetadataList,request,response,dealerId);
        }
        return returnMap;
    }
	
	
/*Method checking for Dynamic Exact search enabled and making call to method performDynamicRetailSearch(@param, @param) 
     * to fetch the retail search results based on the Person OR Company account type*/
	 
function performRetailSearch(newMetadataList, request, response, dealerId){
        console.log('----------> Entered in performRetailSearch method');
        var isValidRequest;
		var returnMap = new Map();
		var finalQueryMap = new Map();
		
        //Calling method to populate the global (dynamic) variables BASED on the Dynamic response switch
        if(true == newMetadataList[0].enabled_dynamic_response__c){
          createDynamicResponseTagsAndFields(newMetadataList[0].retail_response_mapping__c);    
        }
		
		
        try {
            console.log('----------> Entered in performRetailSearch method --- IF CONDITION');
           
            var retailSearch = newMetadataList[0].dynamic_exact_search__c;
            
            console.log('retailSearch==> '+ retailSearch);
            if(true == retailSearch) {
                console.log('inside IF Dynamic Retail Search===> '+retailSearch);
                //Added metadata record in 
                finalQueryMap = performDynamicRetailSearch(newMetadataList, request, dealerId);
                //console.log('----finalQueryRetailSearchAcc---'+finalQueryMap.get('finalQuery'));
                
				// to be implemented in server.js where the actual query runs
				//if(lstDynamicRetailSearchAcc!=null){
					//response.set('accountList', getAccountLinkDetails(newMetadataList, lstDynamicRetailSearchAcc, request));
                //}
                isValidRequest = true;
            } 
        } catch(error) {
            isValidRequest = false;
            console.error( "error in try block of performRetailSearch :::::::::" + error);
        }
        //console.log('---------> performRetailSearch method - isValidRequest ---'+isValidRequest);
		
		returnMap.set('isValidRequest' , isValidRequest);
		returnMap.set('finalQueryMap' , finalQueryMap);
		
        return returnMap;
    }


	//Method to call Dynamic search based on Person/ Company Account
    function performDynamicRetailSearch(newMetadataList, request, dealerId) {
        console.log('----------> Entered in performDynamicRetailSearch method');
		
		var accountSearchType = false;
		var finalQueryMap = new Map();
		
        if(request.recordType != null && request.recordType =='Person Account') {
			
            console.log('----------> inside performDynamicRetailSearch - Person Account Condition');
            accountSearchType = true;
			//accLinkList = getAccountLinkRetailSearchRecords(oneAPIMetadataList, requestMap, accountSearchType);
            finalQueryMap = getAccountLinkRetailSearchRecords(newMetadataList, request, accountSearchType, dealerId);
			
            console.log('----------> After calling  dynamicPersonRetailSearch - accLinkList final query ::::::::' + finalQueryMap.get('finalQuery'));
        }
        if(request.recordType != null && request.recordType =='Company') {
            console.log('----------> inside performDynamicRetailSearch - Company Account Condition');
            accountSearchType = false;
			//accLinkList = getAccountLinkRetailSearchRecords(oneAPIMetadataList, requestMap, accountSearchType);
            finalQueryMap = getAccountLinkRetailSearchRecords(newMetadataList, request, accountSearchType, dealerId);
            console.log('----------> After calling  dynamicCompanyRetailSearch - accLinkList final query :::::::::' + finalQueryMap.get('finalQuery'));
        }
        return finalQueryMap;
    }  


	//Account_Link__c Details mappings to Match JSON Response 
    function getAccountLinkDetails(newMetadataList, accountLinkDetails, request){
		console.log('inside getAccountLinkDetails -------------->');
		console.log('accountLinkDetails.size :::::::::: ' + accountLinkDetails.length);
		console.log('accountLinkDetails.id  :::::::::: ' + accountLinkDetails[0].id);
        var accountLinkListRecords = [];
        if(accountLinkDetails.length > 0) {
			
			console.log('inside getAccountLinkDetails if -------------->');
            for(i = 0; i<accountLinkDetails.length; i++) {
				console.log('inside getAccountLinkDetails for -------------->');
				console.log('dynamic response -------------->' + newMetadataList[0].enabled_dynamic_response__c);
                if(true == newMetadataList[0].enabled_dynamic_response__c){
                    console.log('Dynamic response TRUE -------------->');
					var responseMap = dynamicAccountLinkMappings(accountLinkDetails[i], request);
					
					console.log ('responseMap size::::::::' + responseMap.size);
					
                    accountLinkListRecords.push(responseMap);  
                }              
            }     
        }
		console.log ('accountLinkListRecords length::::::::' + accountLinkListRecords.length);
        return accountLinkListRecords;
    }	

	
	
	//Method to dynamically create the query (Account Link SOQL) and response tag -to- field mapping  based on metadata configuration
	
	String.prototype.equalsIgnoreCase = function (compareString) 
	{ return this.toUpperCase() === compareString.toUpperCase(); 
	};
	
    function createDynamicResponseTagsAndFields(retailDynamicMapping){
		
		console.log('INSIDE createDynamicResponseTagsAndFields -------------->');
        var value='';
		//var metadataFieldsMap = new Map();
        //Set<String> responseTagAPINameSet = new Set<String>();
        //List<String> apiNameList = new List<String>();
		var responseTagAPINameSet = [];
		var apiNameList;       
		responseTagAPIName = '';
		
		//console.log('retailDynamicMapping :::::::::::::::::' + retailDynamicMapping);
		var result = retailDynamicMapping.split(',');
		 for (i=0; i<result.length;i++) {			
            //console.log('row value -------------->' + result[i]);
			
            var arrayfield = result[i].split(':');
            //console.log('arrayfield -------------->' + arrayfield);			
			
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
                    value = 'ac.' + String(arrayfield[1]).trim();
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
		
        //Harcoded fields to deal with dynamic response for below fields w.r.t Record type
		
        responseTagAPINameSet.push('ac.Retail_Company_Other_Phone__c');
        responseTagAPINameSet.push('ac.Retail_Work_Phone__c');
        responseTagAPINameSet.push('ac.Retail_Company_Phone__c');
        responseTagAPINameSet.push('ac.Retail_Individual_Home_Phone__c');   
		
		responseTagAPINameSet.forEach(apiName => 
		responseTagAPIName += apiName + ' '
		); 
		
		console.log('responseTagAPIName before replace -------------->' + responseTagAPIName);
        
        
        responseTagAPIName = responseTagAPIName.trim();
        responseTagAPIName = responseTagAPIName.replace(/ /g, ',');
		responseTagAPIName = responseTagAPIName.replace(/toRole__r/g, 'a1');
		responseTagAPIName = responseTagAPIName.replace(/fromRole__r/g, 'a');
		responseTagAPIName = responseTagAPIName.replace(/recordType.Name/, 'recordType.Name as rname');
		
		
        console.log('responseTagAPIName -------------->' + responseTagAPIName);
        console.log('metadataFieldsMap -------------->' + metadataFieldsMap);
    
	}  

 
 //Method to fetch the reatil search records based on Person/ Company Search Type
    function getAccountLinkRetailSearchRecords(newMetadataList, request, accSearchType, dealerId){
		
		console.log('----------> inside getAccountLinkRetailSearchRecords');
		
        //List<Account_Link__c> accLinkList = new List<Account_Link__c>();
		var accLinkList;
		var recordTypeID;
        var finalMap = new Map();
        //Implementing dynamic response switch
        var strBaseQueryDynamicSearch;
		var finalQueyParam = [];
		
		
        if(true == newMetadataList[0].enabled_dynamic_response__c){
            //New implementation for Dynamic response; Call to create the query dynamically
            if(responseTagAPIName!= ''){
                //strBaseQueryDynamicSearch = 'SELECT ' + responseTagAPIName + ' FROM Account_Link__c';
				strBaseQueryDynamicSearch = 'SELECT ' + responseTagAPIName + ' FROM herokusbox.Account_Link__c ac INNER JOIN herokusbox.Account a ON ac.fromRole__c::VARCHAR = a.sfid::VARCHAR INNER JOIN herokusbox.Account a1 ON ac.toRole__c::VARCHAR = a1.sfid::VARCHAR ';
                
				if(responseTagAPIName.includes('recordType.'))
				strBaseQueryDynamicSearch = strBaseQueryDynamicSearch + 'INNER JOIN herokusbox.recordtype recordType ON ac.recordTypeID::VARCHAR = recordType.sfid::VARCHAR ';
				
				console.log('------strBaseQueryDynamicSearch------' + strBaseQueryDynamicSearch);
            }else {
				
                return accLinkList;
            }
        }
        
        var isRetailCopyAtCompany = newMetadataList[0].retailcopyatcompany__c;
        //console.log('------getAccountLinkRetailSearchRecords ---> strBaseQueryDynamicSearch------' + strBaseQueryDynamicSearch);
		
        var searchCriteria;
        var whereClause;		
        //var andMap = new Map();
        //var orMap = new Map();
		var orAccountLnkMap = new Map();
		var andAccountLnkMap = new Map();
		
        if(accSearchType){
            searchCriteria  = newMetadataList[0].dynamic_person_search_retail_fields__c;
			console.log('------searchCriteria when accSearchType is true ------' + searchCriteria);
            recordTypeID = 'select sfid from herokusbox.recordtype where sobjecttype = \'Account_Link__c\' and Name = \'Retail Person\'';
            //recordTypeIDAccount = PERSONRECORDTYPEID;
        }else {
            searchCriteria = newMetadataList[0].dynamic_company_search_retail_fields__c;
			console.log('------searchCriteria when accSearchType is false ------' + searchCriteria);
            recordTypeID = 'select sfid from herokusbox.recordtype where sobjecttype = \'Account_Link__c\' and Name = \'Retail Company\'';
            //recordTypeIDAccount = COMPANYRECORDTYPEID;
		console.log('------orderbyField ------' + orderbyField);
        }
        var orderbyField  = newMetadataList[0].order_by_field__c;
		
        isCustomerTypeEnabled = newMetadataList[0].enabled_customer_type__c;
		console.log('------isCustomerTypeEnabled ------' + isCustomerTypeEnabled);
		
        customerType = request.customerType;
		console.log('------customerType ------' + customerType);
        
        //Fetching dealer record
        //var dealerAccount = getDealerRecord(isRetailCopyAtCompany, newMetadataList[0].use_dealer_default_flag__c,request);
        
        console.log('------ dealerId inside getAccountLinkRetailSearchRecords------' + dealerId);
        
		
        if(dealerId != null){
            whereClause = 'AND ac.Retail_Duplicate_Flag__c= false AND ac.RecordTypeId='+ '(' + recordTypeID + ')' + 
                ' AND ac.Market__c=\''+request.market +
                '\' AND a.sfid=\''+ dealerId +'\'';
				
			
				
        }else {
            return accLinkList;
        }
        
        if(isCustomerTypeEnabled && customerType!= null && (!request.customerType)){
            whereClause += ' AND a1.Customer_Type__c =\''+customerType+'\'';
        }
		
		//console.log('-----whereClause ------' + whereClause);
		
        searchCriteria = searchCriteria.replace(/\(/g,'');		
        searchCriteria = searchCriteria.replace(/\)/g,'');
		
		//console.log('------searchCriteria after removing bracket ------' + searchCriteria);
		
		var companySearchFileds = searchCriteria.split('&&');
		
		//console.log ("companySearchFileds::::: " + companySearchFileds);
		
		for (i=0; i<companySearchFileds.length;i++) {	
			//console.log('inside for loop');	
            //console.log('row value -------------->' + companySearchFileds[i]);
        
            if(String(companySearchFileds[i]).includes('OR')) {
				
				//console.log('inside if loop as OR found');	 
				
                var orArray = companySearchFileds[i].split('OR');				
                
				//console.log ("orArray::::: " + orArray);
				
				for(j=0; j<orArray.length;j++){					
					
                    var orValues=orArray[j].split(':');
                    
                    if(orValues!=null){
                        if(String(orValues[1]).trim() != ''){
                            orAccountLnkMap.set(String(orValues[0]),String(orValues[1]));
							//console.log ('orAccountLnkMap:::' + orAccountLnkMap);
                        }
                    }
                }
            } else {
				//console.log ("in else as no OR");
                
				var andValues=companySearchFileds[i].split(':');
				//console.log('andValues -------------->' + andValues);
				
                andAccountLnkMap.set(String(andValues[0]),String(andValues[1]));
				
				//console.log ('andAccountLnkMap:::' + andAccountLnkMap);
            }
        }
		
		var paramCounter = 1;
		const requestMap = new Map(Object.entries(request));
		
        for(let objKeySetANDCaluse of andAccountLnkMap.keys()) {
            //if(String.isNotBlank(requestMap.get(andAccountLnkMap.get(objKeySetANDCaluse).trim())))
			 
			var param1 = andAccountLnkMap.get(objKeySetANDCaluse);
			//console.log('-----------> objKeySetANDCaluse::::' + objKeySetANDCaluse);
			console.log('-----------> param1::::' + param1);
			
			var requestAndString = requestMap.get(param1.trim());
			
			console.log('requestAndString.........' + requestAndString);
			if(requestAndString.length >0)
				
			{ if(param1.trim().equalsIgnoreCase('firstname') || param1.trim().equalsIgnoreCase('lastname') || param1.trim().equalsIgnoreCase('mobilePhone') || param1.trim().equalsIgnoreCase('homePhone') || param1.trim().equalsIgnoreCase('workPhone'))
				{ 
					console.log('inside if of requestAndString');
				//whereClause += ' AND '+objKeySetANDCaluse +'='+'\''+ String.escapeSingleQuotes(requestMap.get(andAccountLnkMap.get(objKeySetANDCaluse).trim()))+ '\'';
				//whereClause += ' AND '+objKeySetANDCaluse +'='+'\''+ requestAndString.replace(/'/g,'') + '\'';
				whereClause += ' AND ' + 'ac.' + objKeySetANDCaluse.trim() +' like '+'$' + paramCounter;
				
				}
				else{
					console.log('inside else of requestAndString');
				
                //whereClause += ' AND '+objKeySetANDCaluse +'='+'\''+ String.escapeSingleQuotes(requestMap.get(andAccountLnkMap.get(objKeySetANDCaluse).trim()))+ '\'';
				//whereClause += ' AND '+objKeySetANDCaluse +'='+'\''+ requestAndString.replace(/'/g,'') + '\'';
				whereClause += ' AND ' + 'ac.' + objKeySetANDCaluse.trim() +'= '+'$' + paramCounter;
				}
				paramCounter ++;
				
				finalQueyParam.push(param1);	
				
            }
        }
		
		//console.log('whereClause after for loop.........' + whereClause);
		
		//console.log('size of orAccountLnkMap:::::' + orAccountLnkMap.size);
		
        if(orAccountLnkMap.size > 0) {
			
            whereClause = whereClause+ ' AND ';
        }
        whereClause += '( ';
        var counter = 0;
        for(let objKeySetORCaluse of orAccountLnkMap.keys()) {
			
            //if(String.isNotBlank(requestMap.get(orAccountLnkMap.get(objKeySetORCaluse).trim())) && String.isNotEmpty(requestMap.get(orAccountLnkMap.get(objKeySetORCaluse).trim())))
			
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
						//whereClause += objKeySetORCaluse +'= ' +'\''+ String.escapeSingleQuotes(requestMap.get(orAccountLnkMap.get(objKeySetORCaluse).trim()))+ '\'';
					//whereClause += objKeySetORCaluse +'= ' +'\''+ requestOrString.replace(/'/g,'')+ '\'';
					whereClause += 'ac.' + objKeySetORCaluse.trim() +'like ' +'$' + paramCounter;
					finalQueyParam.push(param2);	
					}
					else{
				   
				   //whereClause += objKeySetORCaluse +'= ' +'\''+ String.escapeSingleQuotes(requestMap.get(orAccountLnkMap.get(objKeySetORCaluse).trim()))+ '\'';
					//whereClause += objKeySetORCaluse +'= ' +'\''+ requestOrString.replace(/'/g,'')+ '\'';
					whereClause += 'ac.' + objKeySetORCaluse.trim() +'= ' +'$' + paramCounter;
					finalQueyParam.push(param2);	
					
					}
					paramCounter++;
                    counter++;
                } else {
                   
					if(param2.trim().equalsIgnoreCase('firstname') || param2.trim().equalsIgnoreCase('lastname') || param2.trim().equalsIgnoreCase('mobilePhone') || param2.trim().equalsIgnoreCase('homePhone') || param2.trim().equalsIgnoreCase('workPhone')){
						
						//whereClause += ' OR '+ objKeySetORCaluse +'= ' +'\''+ String.escapeSingleQuotes(requestMap.get(orAccountLnkMap.get(objKeySetORCaluse).trim()))+ '\'';
					//whereClause += ' OR '+ objKeySetORCaluse +'= ' +'\'' + requestOrString.replace(/'/g,'') + '\'';
					whereClause += ' OR '+ 'ac.' + objKeySetORCaluse.trim() +'like ' +'$' + paramCounter;
					finalQueyParam.push(param2);
						
					}					
					else{

				   //whereClause += ' OR '+ objKeySetORCaluse +'= ' +'\''+ String.escapeSingleQuotes(requestMap.get(orAccountLnkMap.get(objKeySetORCaluse).trim()))+ '\'';
					//whereClause += ' OR '+ objKeySetORCaluse +'= ' +'\'' + requestOrString.replace(/'/g,'') + '\'';
					whereClause += ' OR '+ 'ac.' + objKeySetORCaluse.trim() +'= ' +'$' + paramCounter;
					finalQueyParam.push(param2);
					}
					paramCounter++;
					
                }
            }
        }
        whereClause += ')';
		
		//console.log ("final whereClause :::::::::" + whereClause);
		
		console.log ("finalQueyParam :::::::::" + finalQueyParam);
		
		
        strBaseQueryDynamicSearch += whereClause;
		var offset = calculateOffset(request);
        if(orderbyField != null) {
            strBaseQueryDynamicSearch += ' order by ac.' + orderbyField + ' LIMIT ' + parseInt(request.pageSize) + ' OFFSET ' + offset;
        }
		
		
		var replacemobile = 'REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(ac.Retail_Mobile__c,' + '\'\-\'' + ',' + '\'\'' + ')' + ',' + '\'\+\'' + ',' + '\'\'' + ')' + ',' + '\'\)\'' + ',' + '\'\'' + ')' + ',' + '\'\(\'' + ',' + '\'\'' + ')' + ',' + '\'\  \'' + ',' + '\'\'' + ')';
		
		var replacehomeph = 'REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(ac.Retail_Individual_Home_Phone__c,' + '\'\-\'' + ',' + '\'\'' + ')' + ',' + '\'\+\'' + ',' + '\'\'' + ')' + ',' + '\'\)\'' + ',' + '\'\'' + ')' + ',' + '\'\(\'' + ',' + '\'\'' + ')' + ',' + '\'\  \'' + ',' + '\'\'' + ')';
		
		var replaceworkph = 'REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(ac.Retail_Work_Phone__c,' + '\'\-\'' + ',' + '\'\'' + ')' + ',' + '\'\+\'' + ',' + '\'\'' + ')' + ',' + '\'\)\'' + ',' + '\'\'' + ')' + ',' + '\'\(\'' + ',' + '\'\'' + ')' + ',' + '\'\  \'' + ',' + '\'\'' + ')';
		
		strBaseQueryDynamicSearch = strBaseQueryDynamicSearch.replace(/ac.Retail_Mobile_For_Search__c/g, replacemobile);
		strBaseQueryDynamicSearch = strBaseQueryDynamicSearch.replace(/ac.Retail_Home_Phone_For_Search__c/g, replacehomeph);
		strBaseQueryDynamicSearch = strBaseQueryDynamicSearch.replace(/ac.Retail_Work_Phone_For_Search__c/g, replaceworkph);
		
		
		finalMap.set('finalQuery', strBaseQueryDynamicSearch);
		finalMap.set('finalQueryParam', finalQueyParam);
		
        //String queryString = strBaseQueryDynamicSearch;
        //console.log('-----------> Before executing strBaseQueryDynamicSearch');
        console.log('-----------> final query ::strBaseQueryDynamicSearch ::::::::::' + strBaseQueryDynamicSearch);
        //console.log('check debug'+request);
        //accLinkList = Database.query(strBaseQueryDynamicSearch);
        //console.log('accLinkList 1-------------->'+accLinkList);
		
        return finalMap;
    }	
	
	
	//Calculate Offset for Pagination
    function calculateOffset(request){
		console.log ("inside calculateOffset :::::::" );
        var offset =0;
        var pageSizeValue = request.pageSize;
		console.log ("pageSizeValue :::::::" + pageSizeValue);
		
		//var paesizeint = parseInt(request.pageSize);
		
        if(request.pageSize >10){
            pageSizeValue = '10';
            if(request.pageCount > 1){
                offset = ((request.pageCount - 1) * pageSizeValue);
            }
        }else{
            if(request.pageCount >1){
                offset = ((request.pageCount - 1) * request.pageSize);
            }
        }
		
		console.log ("offset value:::::::" + offset);
        return offset;
    }
	
	
	//AccountLink Records Mappings w.r.t the fields configured at metadata level
    function dynamicAccountLinkMappings(accountLink, request){
        var objectValue;
		var key;
        var value;
        var apiNameList;
		//var accountLinkMap = new Map();
		var accountLinkMap = new Map(Object.entries(accountLink));
        console.log('<--------- INSIDE dynamicAccountLinkMappings ------------>');
		console.log('<--------- INSIDE dynamicAccountLinkMappings account link length ------------>' + accountLinkMap.size);
		console.log('<--------- INSIDE dynamicAccountLinkMappings account link id ------------>' + accountLinkMap.get('id'));
        var responseMap = new Map();
        
        //To handle Date format in response
        //Schema.SObjectType t = Schema.getGlobalDescribe().get('Account_Link__c');    
        //Schema.DescribeSObjectResult r = t.getDescribe();
        
		var dateValue;
        
        responseMap.set('messageId', request.messageId);
        responseMap.set('messageStatus', 'Success');
        responseMap.set('errorCode', '');
        responseMap.set('errorMessage', '');
        responseMap.set('errorCategory', '');
        
        console.log('metadataFieldsMap ====>' + metadataFieldsMap);
		
        if(metadataFieldsMap != null && metadataFieldsMap.size >0){
            //for(String responseTag: metadataFieldsMap.keySet()){
				
			for(let responseTag of metadataFieldsMap.keys()) {	
                console.log('responseTag ====>' + responseTag);
                if(responseTag == 'salesConsultantFedId' || responseTag == 'workPhone' || responseTag =='homePhone' ){
                    if(responseTag == 'salesConsultantFedId'){
						objectValue = metadataFieldsMap.get(responseTag);
						console.log ("objectValue inside salesConsultantFedId if " + objectValue);
						if(String(objectValue).equalsIgnoreCase("NA")){
							responseMap.set(responseTag, '');
						}
                        else if(salesConsultantSearch != null){
                            if(salesConsultantSearch == 'None'){
                                responseMap.set(responseTag, salesConsultantFedIdInRequest);
                            }else if(salesConsultantSearch == 'Owner'){
                                //Code to implemented as per the desin finalized
                                responseMap.set(responseTag, salesConsultantFedIdInRequest);
                            }else if(salesConsultantSearch == 'Sales Consultant'){
                                //Code to implemented as per the desin finalized
                                responseMap.set(responseTag, salesConsultantFedIdInRequest);
                            } 
                        }else { // Else part to be removed post final design implementation
                            responseMap.set(responseTag, salesConsultantFedIdInRequest);
                        }
                    }else if(responseTag == 'workPhone'){
						objectValue = metadataFieldsMap.get(responseTag);
						console.log ("objectValue inside workPhone if " + objectValue);
						if(String(objectValue).equalsIgnoreCase("NA")){
							responseMap.set(responseTag, '');
						}
                        else if(request.recordType =='Company'){
                            responseMap.set(responseTag, accountLinkMap.get('Retail_Company_Other_Phone__c'));
                        }else {
                            responseMap.set(responseTag, accountLinkMap.get('Retail_Work_Phone__c'));
                        }
                    }else if(responseTag =='homePhone'){
						objectValue = metadataFieldsMap.get(responseTag);
						console.log ("objectValue inside homePhone if " + objectValue);
						if(String(objectValue).equalsIgnoreCase("NA")){
							responseMap.set(responseTag, '');
						}
                        else if(request.recordType =='Company'){
                            responseMap.set(responseTag, accountLinkMap.get('Retail_Company_Phone__c'));
                        }else {
                            responseMap.set(responseTag, accountLinkMap.get('Retail_Individual_Home_Phone__c'));
                        }
                    }                    
                }else if (responseTag =='recordTypeName'){							
						   responseMap.set(responseTag, accountLinkMap.get('rname'));				
				}
				
				else {
                    objectValue = metadataFieldsMap.get(responseTag);
                    console.log('objectValue ====>' + objectValue);
					
                    if(String(objectValue).equalsIgnoreCase("NA")){
						
                        console.log('INSIDE IF ====>');
                        responseMap.set(responseTag, '');                    
                    }
                        if(objectValue.includes('-')){
                            apiNameList = objectValue.split('-');
                            console.log('apiNameList ====>' + apiNameList);
                            
							//if(null != accountLink.find(apiNameList[0].trim())){
								
								
								
                                if(apiNameList != null && apiNameList.length == 2){
                                    //value = String.valueOf(accountLink.find(apiNameList[0].trim()).get(apiNameList[1].trim()));
									  key = (apiNameList[1].toLowerCase()).trim();
									  console.log('key ====>' + key);							  
									  value = accountLinkMap.get(key);
									  //value = accountLinkMap.get('id');
									  console.log('value ====>' + value);
                                    responseMap.set(responseTag, (value == null || value.length == 0) ? '' : value);
									
                                }else if(apiNameList != null && apiNameList.size() == 3){
                                    //value = String.valueOf(accountLink.find(apiNameList[0].trim()).find(apiNameList[1].trim()).get(apiNameList[2].trim()));
                                    //responseMap.set(responseTag, String.isBlank(value)? '' : value);
									key = (apiNameList[2].toLowerCase()).trim();
									  console.log('key ====>' + key);
									  value = accountLinkMap.get(key);
									  //value = accountLinkMap.get('id');
									  console.log('value ====>' + value);
                                    responseMap.set(responseTag, (value == null || value.length == 0) ? '' : value);
                                }else if(apiNameList != null && apiNameList.size() == 4){
                                    //value = String.valueOf(accountLink.find(apiNameList[0].trim()).find(apiNameList[1].trim()).find(apiNameList[2].trim()).get(apiNameList[3].trim()));
                                    //responseMap.set(responseTag, String.isBlank(value)? '' : value);
									key = (apiNameList[3].toLowerCase()).trim();
									  console.log('key ====>' + key);
									  value = accountLinkMap.get(key);
									  //value = accountLinkMap.get('id');
									  console.log('value ====>' + value);
                                    responseMap.set(responseTag, (value == null || value.length == 0) ? '' : value);
                                } 
                           // }
                        }
						else {
							console.log ('inside else as objectValue does not include -');
                            /*Schema.DescribeFieldResult f = r.fields.getMap().get(metadataFieldsMap.get(responseTag)).getDescribe();
                            if(f.getType() == Schema.DisplayType.Date){
                                dateValue = Date.valueOf(accountLink.get(metadataFieldsMap.get(responseTag))); 
                                if(null == dateValue){
                                    responseMap.set(responseTag, '');    
                                }else{
                                    responseMap.set(responseTag, dateValue);
                                } 
                            }else {
                                value = String.valueOf(accountLink.get(metadataFieldsMap.get(responseTag)));
                                responseMap.set(responseTag, String.isBlank(value)? '' : value);
                            }
							*/
							console.log ('objectValue ::::::::::: ' + objectValue);
							if(objectValue != null)
							key = (objectValue.toLowerCase()).trim();
							if(key.includes('date')){
								var value = accountLinkMap.get(key);
								console.log ('value ::::::::::: ' + value);	
								
								if(value!= null && value.toString()!= null && value.toString().length>0){
								
								value = (value.toISOString()).replace(/\T.+/, '');								
								console.log ('date value in else ::::::::::: ' + value);
								}
							}
							else
							    value = accountLinkMap.get(key);							
							//console.log ('value in else ::::::::::: ' + value.toString());
							
							responseMap.set(responseTag, (value == null || value.length == 0) ? '' : value); 
                        }
                    }
                }
            }
        
        console.log('responseMap ----->' + responseMap);
		console.log('responseMap length ----->' + responseMap.size);
        return responseMap;
    }
	
	// Dealer Identification Flow Implementation
    function getDealerRecord(isRetailCopyAtCompanyEnabled, isDealerDefaultFlag, request){
		
        console.log('------Inside getDealerRecord|||||||||||||||||||');
        var dealerAccountListquery;
		var tempAccountListQuery;
		var dealerAccountListqueryParam = [];
		var tempAccountListQueryParam = [];
		
        var tempAccountList = [];
        var dealerAccList = [];
		var queryMap = new Map();
        
		var isRequestNDCodeEmpty  = Boolean(!request.dealerNdCode);
		var ndcode = request.dealerNdCode;
		var gccode = request.dealerGcCode;
		console.log ("request.dealerNdCode :::::::::" + ndcode);
		console.log ("request.dealerGcCode :::::::::" + gccode);
        var isRequestGCCodeEmpty  = Boolean(!request.dealerGcCode);
        var isRequestGSCodeEmpty  = Boolean(!request.dealerGsCode);
		
        
		console.log('------isRequestNDCodeEmpty------>' + isRequestNDCodeEmpty);
        console.log('------isRequestGCCodeEmpty------>' + isRequestGCCodeEmpty);
        console.log('------isRequestGSCodeEmpty------>' + isRequestGSCodeEmpty);
        console.log('------isRetailCopyAtCompanyEnabled------>' + isRetailCopyAtCompanyEnabled);
        console.log('------isDealerDefaultFlag------>' + isDealerDefaultFlag);
		
        if(isRetailCopyAtCompanyEnabled){
            if(!isRequestGCCodeEmpty){
				console.log ("isRetailCopyAtCompanyEnabled true and gccode present" );
				
                console.log('------getDealerRecord Dealer_GC_Code__c------>' + request.dealerGcCode);
                console.log('------getDealerRecord Market------>' + request.market);
				
                dealerAccountListquery = 'SELECT SfId,Dealer_GC_Code__c,Dealer_ND_Code__c,Dealer_GS_Code__c,Dealer_Rollout_Status__c FROM herokusbox.account WHERE RecordTypeId = (select sfid from herokusbox.recordtype where sobjecttype = \'Account\' and Name = \'Dealer\') AND Dealer_GC_Code__c = $1 AND Market__c = $2 AND Dealer_Active__c = true AND Dealer_Rollout_Status__c = \'Done\' AND Dealer_Type__c = \'Company\'';
									 
									 
				dealerAccountListqueryParam = [request.dealerGcCode, request.market];
				
				queryMap.set('tempAccountListQuery' , '');
				queryMap.set('dealerAccountListquery' , dealerAccountListquery);
				queryMap.set('dealerAccountListqueryParam' , dealerAccountListqueryParam);
				
                //console.log('------dealerAccountList------>' + dealerAccountList);
				
            }else{
				console.log ("isRetailCopyAtCompanyEnabled true but gccode not present" );
                if(!isRequestNDCodeEmpty){
					console.log ("isRetailCopyAtCompanyEnabled true and  gccode not present but ndcode present" );
						
                    tempAccountListQuery = 'SELECT Dealer_GC_Code__c,Dealer_Rollout_Status__c FROM herokusbox.account WHERE RecordTypeId = (select sfid from herokusbox.recordtype where sobjecttype = \'Account\' and Name = \'Dealer\') AND Dealer_ND_Code__c = $1 AND Dealer_GC_Code__c IS NOT NULL AND Market__c = $2 AND Dealer_Active__c = true AND Dealer_Rollout_Status__c = \'Done\'';
									   
									   
					tempAccountListQueryParam = [request.dealerNdCode, request.market];	

					queryMap.set('tempAccountListQuery' , tempAccountListQuery);
					queryMap.set('tempAccountListQueryParam' , tempAccountListQueryParam);		
									   
									   
									   
                }else{
					console.log ("isRetailCopyAtCompanyEnabled true and  gccode not present and ndcode not present but gscode present" );
					
                    tempAccountListQuery = 'SELECT Dealer_GC_Code__c,Dealer_Rollout_Status__c FROM herokusbox.account WHERE RecordTypeId = (select sfid from herokusbox.recordtype where sobjecttype = \'Account\' and Name = \'Dealer\') AND Dealer_GS_Code__c = $1 AND Dealer_GC_Code__c IS NOT NULL AND Market__c = $2 AND Dealer_Active__c = true AND Dealer_Rollout_Status__c = \'Done\'';
									   
					tempAccountListQueryParam = [request.dealerGsCode, request.market];	
					
					queryMap.set('tempAccountListQuery' , tempAccountListQuery);
					queryMap.set('tempAccountListQueryParam' , tempAccountListQueryParam);	
									   
                }
                dealerAccountListquery = 'SELECT SfId,Dealer_GC_Code__c,Dealer_ND_Code__c,Dealer_GS_Code__c,Dealer_Rollout_Status__c FROM herokusbox.account  WHERE RecordTypeId = (select sfid from herokusbox.recordtype where sobjecttype = \'Account\' and Name = \'Dealer\') AND Dealer_GC_Code__c = $1 AND Market__c = $2 AND Dealer_Active__c = true AND Dealer_Rollout_Status__c = \'Done\' AND Dealer_Type__c = \'Company\'';
									 
									 
                dealerAccountListqueryParam = ['getgcidfromtmp', request.market]; 
				
				queryMap.set('dealerAccountListquery' , dealerAccountListquery);
				queryMap.set('dealerAccountListqueryParam' , dealerAccountListqueryParam);
				
            }
        }else {
            if(!isRequestNDCodeEmpty){
				
				console.log ("isRetailCopyAtCompanyEnabled false but ndcode present" );
				
                dealerAccountListquery = 'SELECT SfId,Dealer_GC_Code__c,Dealer_ND_Code__c,Dealer_GS_Code__c,Dealer_Rollout_Status__c FROM herokusbox.account  WHERE RecordTypeId = (select sfid from herokusbox.recordtype where sobjecttype = \'Account\' and Name = \'Dealer\') AND Dealer_ND_Code__c = $1 AND Market__c = $2 AND Dealer_Active__c = true AND Dealer_Rollout_Status__c = \'Done\'';
									  
				dealerAccountListqueryParam = [request.dealerNdCode, request.market];
				
				queryMap.set('tempAccountListQuery' , '');
				queryMap.set('dealerAccountListquery' , dealerAccountListquery);
				queryMap.set('dealerAccountListqueryParam' , dealerAccountListqueryParam);
									 
									 
									 
            }else if(isRequestNDCodeEmpty && !isRequestGSCodeEmpty){
				
				console.log ("isRetailCopyAtCompanyEnabled false and ndcode not present but gscode present" );
                
				dealerAccountListquery = 'SELECT SfId,Dealer_GC_Code__c,Dealer_ND_Code__c,Dealer_GS_Code__c,Dealer_Rollout_Status__c,Dealer_Default_Flag__c FROM herokusbox.account WHERE RecordTypeId = (select sfid from herokusbox.recordtype where sobjecttype = \'Account\' and Name = \'Dealer\') AND Dealer_GS_Code__c = $1 AND Market__c = $2 AND Dealer_Active__c = true AND Dealer_Rollout_Status__c = \'Done\'';
                
				
				dealerAccountListqueryParam = [request.dealerGsCode, request.market];
				
				queryMap.set('tempAccountListQuery' , '');
				queryMap.set('dealerAccountListquery' , dealerAccountListquery);
				queryMap.set('dealerAccountListqueryParam' , dealerAccountListqueryParam);
				
				
                console.log('-----dealer account list -------' + dealerAccList);
				
                /*this to be implemented in server.js where the actual query runs*/
                /* if(dealerAccList != null && dealerAccList.size > 1){
                    if(isDealerDefaultFlag){
                        for(Account dealerAccount : dealerAccList){
                            if(dealerAccount.Dealer_Default_Flag__c){
                                dealerAccountList.add(dealerAccount);
                                break;
                            }
                        }
                    }else {
                        dealerAccountList.add(dealerAccList.get(0));
                        console.log('entered here to get first dealer'+dealerAccountList);
                    }
                }else if(dealerAccList != null && dealerAccList.size() == 1){
                    console.log('-----GSCode/ GCCode present && isDealerDefaultFlag is false -------' + dealerAccList.get(0));
                    dealerAccountList.add(dealerAccList.get(0));
                } */               
            }
        }
        return queryMap;
    }
	
	

module.exports = {
  performValidations,
  performSearch,
  getDealerRecord,
  getAccountLinkDetails,
  calculateOffset
};
