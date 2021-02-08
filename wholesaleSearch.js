var searchUtility = require("./searchUtility.js");
var retailSearch = require("./retailSearch.js");

var responseTagAPIName = ''; 
var metadataFieldsMap = new Map();
var salesConsultantSearch;
var salesConsultantFedIdInRequest;

String.prototype.equalsIgnoreCase = function (compareString) 
	{ return this.toUpperCase() === compareString.toUpperCase(); 
	};


function performValidations(request) {
        console.log('Inside performValidations');
        var isValidRequest = false;
        var isSearchTypeAvailable = Boolean(request.searchType);
        var isMessageIdAvailable = Boolean(request.messageId);
        var isWholeSaleOrMatchingRuleSearch = Boolean(isSearchTypeAvailable && (request.searchType=='Wholesale'));
        var isMarketAvailable = Boolean(request.market);
        var isApplicationNameAvailable = Boolean(request.applicationName);
        var isRecordTypeAvailable = Boolean(request.recordType);
        var isLastNameAvailable = Boolean(request.lastname);
        var isPageSizeAvailable = Boolean(request.pageSize);
        var isPageCountAvailable = Boolean(request.pageCount);
        var market = request.market;
        var isFirstNameAvailable = Boolean(request.firstname);
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
        
        if(isWholeSaleOrMatchingRuleSearch && isMarketAvailable && isRecordTypeAvailable) {
            if((request.recordType).equalsIgnoreCase('Person Account')){
                if((!market.equalsIgnoreCase('ID') 
                   && !market.equalsIgnoreCase('KR') 
                   && !market.equalsIgnoreCase('VN'))){
                       isValidRequest = isApplicationNameAvailable 
                           && isMessageIdAvailable 
                           && isMarketAvailable
                           && isFirstNameAvailable
                           && isLastNameAvailable
                           && isPageSizeAvailable
                           && isPageCountAvailable
                           && (isSocialIDAvailable || isIDNumberAvailable || isEmailAvailable || isEmail3Available || isMobileAvailable || isHomePhoneAvailable || isWorkPhoneAvailable);
                       if(isValidRequest == false && market.equalsIgnoreCase('JP')){
                           isValidRequest = isApplicationNameAvailable 
                               && isMessageIdAvailable 
                               && isMarketAvailable
                               && isNativeFirstNameAvailable
                               && isNativeLastNameAvailable
                               && isPageSizeAvailable
                               && isPageCountAvailable
                               && (isEmailAvailable || isEmail3Available || isMobileAvailable || isHomePhoneAvailable || isWorkPhoneAvailable);
                       }
                   }else if(market.equalsIgnoreCase('ID')
                            || market.equalsIgnoreCase('KR') 
                            || market.equalsIgnoreCase('VN')){
                                isValidRequest = isApplicationNameAvailable 
                                    && isMessageIdAvailable 
                                    && isMarketAvailable
                                    && isLastNameAvailable
                                    && isPageSizeAvailable
                                    && isPageCountAvailable
                                    && (isSocialIDAvailable || isIDNumberAvailable || isEmailAvailable || isMobileAvailable || isHomePhoneAvailable || isWorkPhoneAvailable); 
                            }
            }else if((request.recordType).equalsIgnoreCase('Company')){
                if(isMarketAvailable){
                    isValidRequest = isApplicationNameAvailable 
                        && isMessageIdAvailable 
                        && isMarketAvailable
                        && isCompanyNameAvailable
                        && isPageSizeAvailable
                        && isPageCountAvailable
                        && (isVatNoAvailable || isCRNAvailable || isEmailAvailable || isEmail2Available || isMobileAvailable || isHomePhoneAvailable || isWorkPhoneAvailable);
                    if(isValidRequest == false && market.equalsIgnoreCase('JP')){
                        isValidRequest = isApplicationNameAvailable 
                            && isMessageIdAvailable 
                            && isMarketAvailable
                            && isNativeCompanyNameAvailable
                            && isPageSizeAvailable
                            && isPageCountAvailable
                            && (isEmailAvailable || isEmail2Available || isMobileAvailable || isHomePhoneAvailable || isWorkPhoneAvailable); 
                    }
                }
            }
        }
        console.log('---------> performValidations method - isValidRequest ---'+isValidRequest);
        return isValidRequest;
    }  
	
	
	 
   //Checking Search is Wholesale or not
    function performSearch(oneAPIMetadataList, request) {
        
		//var isValidRequest = false;
		var returnMap = new Map();
        
        //Modify map with formatted phone number values
        searchUtility.getFormattedPhoneNumbers(oneAPIMetadataList, request);
        
		salesConsultantFedIdInRequest = request.salesConsultantFedId;
        
        salesConsultantSearch = oneAPIMetadataList[0].sales_consultant_search__c;
        returnMap = performWholeSaleSearch(oneAPIMetadataList,request);
        
		return returnMap;
    }
    
   //WholeSearch Condition Check (Static or Dynamic)
    function performWholeSaleSearch(oneAPIMetadataList, request) {
        console.log('Entered in WholeSale');
        var isValidRequest = false;
		var returnMap = new Map();
		var finalQueryMap = new Map();
        try{
            
            var wholeSaleSearch = oneAPIMetadataList[0].dynamic_exact_search__c;
			
            console.log('dedupSearch Value==> '+wholeSaleSearch);
			//Skipping the static search for poc purpose
            /*if(false == wholeSaleSearch) {
                console.log('inside IF Static WholeSale===> '+wholeSaleSearch);
                var lstStaticWholeSaleSearchAcc= performStaticWholeSaleSearch(oneAPIMetadataList,request);
				
                /*console.log('----lstStaticWholeSaleSearchAcc---'+lstStaticWholeSaleSearchAcc);
                if(lstStaticWholeSaleSearchAcc!=null){
                   responseMap.set('accountList', getAccountDetails(oneAPIMetadataList, lstStaticWholeSaleSearchAcc, requestMap));
                }*/
                 //isValidRequest = true;
           // } else if(true == wholeSaleSearch) {
                
				console.log('inside IF Dynamic WholeSale===> '+wholeSaleSearch);
                finalQueryMap = performdynamicWholeSaleSearch(oneAPIMetadataList,request);
                console.log('----finalQueryWholesaleSearchAcc---'+finalQueryMap.get('finalQuery'));
               
                isValidRequest = true;
            //}
            
        } catch(error) {            
            console.error( "error in try block of performWholeSaleSearch :::::::::" + error);
			isValidRequest = false;
         }
		 
		//console.log('---------> performWholeSaleSearch method - isValidRequest ---'+isValidRequest);
		
		returnMap.set('isValidRequest' , isValidRequest);
		returnMap.set('finalQueryMap' , finalQueryMap);
		
        return returnMap;
		 
		 
        //return isValidRequest;
    }
	
	//Dynamic WholeSale Main 
    function performdynamicWholeSaleSearch(oneAPIMetadataList,request) {
        
		console.log('Inside performdynamicWholeSaleSearch::::::::::::::::::');
		
		var finalQueryMap = new Map();
		
        //Calling method to populate the global (dynamic) variables BASED on the Dynamic response switch
        if(true == oneAPIMetadataList[0].enabled_dynamic_response__c){
        	createDynamicResponseTagsAndFields(oneAPIMetadataList[0].wholesale_response_mapping__c);
        }
        
        var isEcoSystemEnabled = oneAPIMetadataList[0].ecosystem_enabled__c;
        
		var isPersonAccount = request.recordType != null && ((request.recordType).equalsIgnoreCase('Person Account'));
		
        var isCompanyAccount = request.recordType != null && ((request.recordType).equalsIgnoreCase('Company'));
        //Matching Rule search
        var isMatchingRuleSearch = oneAPIMetadataList[0].use_matching_rules__c;
         console.log('--isMatchingRuleSearch--'+isMatchingRuleSearch);
         console.log('--isPersonAccount--'+isPersonAccount);
        
		/*if(true == isMatchingRuleSearch) {
            accList = getMatchingRuleDupAccounts(oneAPIMetadataList[0],requestMap); 
            }*/
            //else if(false == isMatchingRuleSearch && true == isPersonAccount) {
				if(true == isPersonAccount) {
                console.log('ENTERED INTO PERSON DYNAMIC');
                finalQueryMap = dynamicPersonSearch(oneAPIMetadataList[0],request);
            }
            //else if(false == isMatchingRuleSearch && true == isCompanyAccount) {
			    else if(true == isCompanyAccount) {
                finalQueryMap = dynamicCompanySearch(oneAPIMetadataList[0],request);
            }
           //code from matching rule if check
           /*if( true == isEcoSystemEnabled ){
               console.log('enabled return them');
                accList = getWholeSaleResponseAccounts(accList, requestMap,isEcoSystemEnabled);
            } 
            else if(false == isEcoSystemEnabled) {
                console.log('entered here BEFORE=======>'+accList); 
                accList = getWholeSaleResponseAccounts(accList,requestMap,isEcoSystemEnabled);
                console.log('entered here AFTER=======>'+accList);
            }*/
       return finalQueryMap;
    }


    //Dynamic Person Search based on Dynamic_Person_Search_Fields__c
    function dynamicPersonSearch(metadata , request) {
      
        console.log('Entered into dynamicPersonSearch');
        
		var strWholeSaleDynamicQuery;
		var orAccountLnkMap = new Map();
		var andAccountLnkMap = new Map();
		var finalQueyParam = [];
		var finalMap = new Map();
		var accList;
		var whereClause;
               
        //Implementing KR Switch 
        if(true == metadata.enabled_dynamic_response__c){
            if(responseTagAPIName != ''){
                strWholeSaleDynamicQuery = 'SELECT ' + responseTagAPIName + ' FROM herokusbox.account a INNER JOIN herokusbox.recordtype recordType ON a.recordTypeID::VARCHAR = recordType.sfid::VARCHAR AND ';
                console.log('------strWholeSaleDynamicQuery------' + strWholeSaleDynamicQuery);
            }else {
                return accList;
            }
        }
        
        var iscustomTypeEnabled = metadata.enabled_customer_type__c;
        
        console.log('strWholeSaleDynamicQuery:::::::::'+strWholeSaleDynamicQuery);
       
	    whereClause = 'recordType.Name=\''+ request.recordType + '\' AND Market__c= \''+request.market + '\' ';   
		console.log('whereClause :::::::::' + whereClause);	
        
		if(iscustomTypeEnabled == true){
         console.log('customertype enabled once');
         whereClause += ' AND  a.Customer_Type__c=\''+ request.customerType + '\' ';
        }
        
		
        var searchPersonCriteria =metadata.dynamic_person_search_fields__c;
		
       // Boolean isEcoSystemEnabled = oneAPiSearchConfigMdt[0].EcoSystem_Enabled__c;
	   
        searchPersonCriteria = searchPersonCriteria.replace(/\(/g,'');		
        searchPersonCriteria = searchPersonCriteria.replace(/\)/g,'');
		
		var personSerachFileds = searchPersonCriteria.trim().split('&&');
		
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
			{
                console.log('inside if of requestAndString');
				//whereClause += ' AND '+objKeySetANDCaluse +'='+'\''+ String.escapeSingleQuotes(requestMap.get(andAccountLnkMap.get(objKeySetANDCaluse).trim())) + '\'';
				whereClause += ' AND ' + 'a.' + objKeySetANDCaluse.trim() +' like '+'$' + paramCounter;
            }
			
			else
			{
				console.log('inside else of requestAndString');
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
	   
	   console.log ("whereClause :::::::::" + whereClause);
	   
	   console.log ("finalQueyParam :::::::::" + finalQueyParam);
	   
       strWholeSaleDynamicQuery += whereClause;
	   
       var orderByFieldName = metadata.order_by_field__c;// Get the field from metadata   
	   console.log ("orderByFieldName :::::::::" + orderByFieldName);
	   var offset = retailSearch.calculateOffset(request);
       
	   if(orderByFieldName != null) {
          strWholeSaleDynamicQuery +=   ' order by a.' +  orderByFieldName + ' LIMIT ' + parseInt(request.pageSize) + ' OFFSET ' + offset;
       }
       var replacemobile = 'REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(a.Mobile__c,' + '\'\-\'' + ',' + '\'\'' + ')' + ',' + '\'\+\'' + ',' + '\'\'' + ')' + ',' + '\'\)\'' + ',' + '\'\'' + ')' + ',' + '\'\(\'' + ',' + '\'\'' + ')' + ',' + '\'\  \'' + ',' + '\'\'' + ')';
		
		var replacehomeph = 'REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(a.Individual_Home_Phone__c,' + '\'\-\'' + ',' + '\'\'' + ')' + ',' + '\'\+\'' + ',' + '\'\'' + ')' + ',' + '\'\)\'' + ',' + '\'\'' + ')' + ',' + '\'\(\'' + ',' + '\'\'' + ')' + ',' + '\'\  \'' + ',' + '\'\'' + ')';
		
		var replaceworkph = 'REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(a.Work_Phone__c,' + '\'\-\'' + ',' + '\'\'' + ')' + ',' + '\'\+\'' + ',' + '\'\'' + ')' + ',' + '\'\)\'' + ',' + '\'\'' + ')' + ',' + '\'\(\'' + ',' + '\'\'' + ')' + ',' + '\'\  \'' + ',' + '\'\'' + ')';
		
		strWholeSaleDynamicQuery = strWholeSaleDynamicQuery.replace(/a.Mobile_For_Search__c/g, replacemobile);
		strWholeSaleDynamicQuery = strWholeSaleDynamicQuery.replace(/a.Home_Phone_For_Search__c/g, replacehomeph);
		strWholeSaleDynamicQuery = strWholeSaleDynamicQuery.replace(/a.Work_Phone_For_Search__c/g, replaceworkph);
		
		finalMap.set('finalQuery', strWholeSaleDynamicQuery);
		finalMap.set('finalQueryParam', finalQueyParam);
		
        console.log('-----------> final query ::strWholeSaleDynamicQuery ::::::::::' + strWholeSaleDynamicQuery);
        
		return finalMap;
    }
    
    //Dynamic Company Search based on Dynamic_Company_Search_Fields__c
    function dynamicCompanySearch(metadata ,request) {
        
		console.log('Entered into dynamicCompanySearch');
		
		var orAccountLnkMap = new Map();
		var andAccountLnkMap = new Map();
		var finalQueyParam = [];
		var finalMap = new Map();
		var accList;		
		var strWholeSaleCompanyDynamicQuery;
		var whereClause;
		
        //Implementing KR Switch 
        if(true == metadata.enabled_dynamic_response__c){
            if(responseTagAPIName!=''){
                strWholeSaleCompanyDynamicQuery = 'SELECT ' + responseTagAPIName + ' FROM herokusbox.account a INNER JOIN herokusbox.recordtype recordType ON a.recordTypeID::VARCHAR = recordType.sfid::VARCHAR AND ';
                console.log('------strWholeSaleDynamicQuery------' + strWholeSaleCompanyDynamicQuery);
            }else {
                return accList;
            }
        }
        
        //String strWholeSaleCompanyDynamicQuery;
        whereClause = 'recordType.Name=\''+ request.recordType + '\' AND Market__c= \''+request.market + '\' ';   
        var iscustomTypeEnabled = metadata.enabled_customer_type__c;
        if(iscustomTypeEnabled == true) {
         console.log('customertype enabled onceCOMPANY');
         whereClause += ' AND  Customer_Type__c=\''+request.customerType + '\' ';
        }
        //Map<String, String> andMap = new Map<String,String>();
        //Map<String, String> orMap = new Map<String,String>();
        
        var searchCompanyCriteria = metadata.dynamic_company_search_fields__c;
		
        //Boolean isEcoSystemEnabled = oneAPiSearchConfigMdt[0].EcoSystem_Enabled__c;
       // console.log('isEcoSystemEnabled 902===> '+isEcoSystemEnabled);
	   
        searchCompanyCriteria = searchCompanyCriteria.replace(/\(/g,'');
        searchCompanyCriteria = searchCompanyCriteria.replace(/\)/g,'');
		
		var companySerachFileds = searchCompanyCriteria.trim().split('&&');
		
		for(i=0; i<companySerachFileds.length;i++) {
			
            if(String(companySerachFileds[i]).includes('OR')) {
				
                var orArray = companySerachFileds[i].split('OR');	
				
                for(j=0; j<orArray.length;j++){	
                    
					var orValues=orArray[j].split(':');
                    console.log('orValues'+orValues);
					
                    if(orValues!=null){
                        if(String(orValues[1]).trim() != ''){
                            orAccountLnkMap.set(String(orValues[0]),String(orValues[1]));
							//console.log ('orAccountLnkMap:::' + orAccountLnkMap);
                        }
                    }
                }
            } else {
				var andValues=companySerachFileds[i].split(':');
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
			if(requestAndString.length >0){
			
            if(param1.trim().equalsIgnoreCase('firstname') || param1.trim().equalsIgnoreCase('lastname') || param1.trim().equalsIgnoreCase('mobilePhone') || param1.trim().equalsIgnoreCase('homePhone') || param1.trim().equalsIgnoreCase('workPhone'))
			{
                console.log('inside if of requestAndString');
				//whereClause += ' AND '+objKeySetANDCaluse +'='+'\''+ String.escapeSingleQuotes(requestMap.get(andAccountLnkMap.get(objKeySetANDCaluse).trim())) + '\'';
				whereClause += ' AND ' + 'a.' + objKeySetANDCaluse.trim() +' like '+'$' + paramCounter;
            }
			
			else
			{
				console.log('inside else of requestAndString');
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
						whereClause += 'a.' + objKeySetORCaluse.trim() +'like ' +'$' + paramCounter;
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
						
						whereClause += ' OR '+ 'a.' + objKeySetORCaluse.trim() +'like ' +'$' + paramCounter;
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
        strWholeSaleCompanyDynamicQuery += whereClause;
		
        var orderByFieldName;
        if(metadata != null) { 
            orderByFieldName = metadata.order_by_field__c;// Get the field from metadata
        }
		var offset = retailSearch.calculateOffset(request);
       
        if(orderByFieldName != null) {
            strWholeSaleCompanyDynamicQuery +=  ' order by a.' +  orderByFieldName + ' LIMIT ' + parseInt(request.pageSize) + ' OFFSET ' + offset;
        }
        
       var replacemobile = 'REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(a.Mobile__c,' + '\'\-\'' + ',' + '\'\'' + ')' + ',' + '\'\+\'' + ',' + '\'\'' + ')' + ',' + '\'\)\'' + ',' + '\'\'' + ')' + ',' + '\'\(\'' + ',' + '\'\'' + ')' + ',' + '\'\  \'' + ',' + '\'\'' + ')';
		
		var replacehomeph = 'REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(a.Individual_Home_Phone__c,' + '\'\-\'' + ',' + '\'\'' + ')' + ',' + '\'\+\'' + ',' + '\'\'' + ')' + ',' + '\'\)\'' + ',' + '\'\'' + ')' + ',' + '\'\(\'' + ',' + '\'\'' + ')' + ',' + '\'\  \'' + ',' + '\'\'' + ')';
		
		var replaceworkph = 'REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(a.Work_Phone__c,' + '\'\-\'' + ',' + '\'\'' + ')' + ',' + '\'\+\'' + ',' + '\'\'' + ')' + ',' + '\'\)\'' + ',' + '\'\'' + ')' + ',' + '\'\(\'' + ',' + '\'\'' + ')' + ',' + '\'\  \'' + ',' + '\'\'' + ')';
		
		strWholeSaleCompanyDynamicQuery = strWholeSaleCompanyDynamicQuery.replace(/a.Mobile_For_Search__c/g, replacemobile);
		strWholeSaleCompanyDynamicQuery = strWholeSaleCompanyDynamicQuery.replace(/a.Home_Phone_For_Search__c/g, replacehomeph);
		strWholeSaleCompanyDynamicQuery = strWholeSaleCompanyDynamicQuery.replace(/a.Work_Phone_For_Search__c/g, replaceworkph);
		
		finalMap.set('finalQuery', strWholeSaleCompanyDynamicQuery);
		finalMap.set('finalQueryParam', finalQueyParam);
		
        console.log('-----------> final query ::strWholeSaleDynamicQuery ::::::::::' + strWholeSaleCompanyDynamicQuery);
        
		return finalMap;
    }	
	
	function createDynamicResponseTagsAndFields(searchDynamicMapping){
        
		var value='';
        var responseTagAPINameSet = [];
        var apiNameList;   
		responseTagAPIName = '';
        
		var result = searchDynamicMapping.split(',');
		for (i=0; i<result.length;i++) {	
            
			var arrayfield = result[i].split(':');			
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
                    value = 'a.' + String(arrayfield[1]).trim();
					console.log('value inside else -------------->' + value);
                }
            }			
			else if(String(arrayfield[1]).equalsIgnoreCase("NA")){
				value = '';
			}				
            if(value != '')
            responseTagAPINameSet.push(value); 
            //responseTagAPIName +=  value + ' ';
        }
		
		console.log ('metadataFieldsMap size::::::::::::::::' + metadataFieldsMap.size);
        
        responseTagAPINameSet.forEach(apiName => 
		responseTagAPIName += apiName + ' '
		);       
        
        console.log('responseTagAPIName before replace -------------->' + responseTagAPIName);        
        
        responseTagAPIName = responseTagAPIName.trim();
        responseTagAPIName = responseTagAPIName.replace(/ /g, ',');
		responseTagAPIName = responseTagAPIName.replace(/recordType.Name/, 'recordType.Name as rname');
		
		
        console.log('responseTagAPIName -------------->' + responseTagAPIName);
        console.log('metadataFieldsMap -------------->' + metadataFieldsMap);
    }
	
	
	    //Whole Sale Account Details mappings to Match JSON Response 
    function getAccountDetails(oneAPIMetadataList, accountDetails, request){
         
		 
         var accountListRecords = [];
		 
         if(accountDetails.length >0) { 
            for(i = 0; i<accountDetails.length; i++) {
				 
                if(accountDetails[i] != null) {
                    console.log('----eachAccount---'+accountDetails[i]);
                    accountDetails[i].Dealer_ND_Code__c = null;
                    accountDetails[i].Dealer_GS_Code__c = null;
                    accountDetails[i].Dealer_GC_Code__c = null;
                }	
                 
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
                    }else {
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
                            }
							else {
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