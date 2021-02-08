var responseTagAPIName = ''; 
var metadataFieldsMap = new Map();

var LEADSALESRECORDTYPEID = '(select sfid from herokusbox.recordtype where sobjecttype = \'Lead__c\' and Name = \'Sales Leads\')';
var LEADAFTERSALESRECORDTYPEID = '(select sfid from herokusbox.recordtype where sobjecttype = \'Lead__c\' and Name = \'Aftersales Leads\')';
var OPPTYSALESRECORDTYPEID = '(select sfid from herokusbox.recordtype where sobjecttype = \'Opportunity\' and Name = \'Sales Lead\')';
var OPPTYAFTERSALESRECORDTYPEID = '(select sfid from herokusbox.recordtype where sobjecttype = \'Opportunity\' and Name = \'Aftersales Leads\')';       
            
String.prototype.equalsIgnoreCase = function (compareString) 
	{ return this.toUpperCase() === compareString.toUpperCase(); 
	};
var enabledDynamicResponse;

function performRequestValidations(request) {
    
		console.log("inside performRequestValidations:::::::::::::::");
		
        var isValidRequest = false;
        
        var isApplicationNameAvailable = Boolean(request.applicationName);
        var isMessageIdAvailable = Boolean(request.messageId);
        
		var isMarketAvailable = Boolean(request.market);
		console.log("isMarketAvailable :::::::::::::::::" + isMarketAvailable);
        
		var isSearchTypeAvailable = Boolean(request.searchType);
		console.log("isSearchTypeAvailable :::::::::::::::::" + isSearchTypeAvailable);
        
		var isSalesConsultantSearch = isSearchTypeAvailable && (request.searchType =='SalesconsultantLeads');
        
        var isRecordTypeAvailable = Boolean(request.recordType);
        var isPagesizeAvailable = Boolean(request.pageSize);
        var isPageCountAvailable = Boolean(request.pageCount);
		var searchType = request.searchType;
		console.log("request.searchType :::::::::::::::::" + searchType);
        var isDealerOutletLeadsSearch = isSearchTypeAvailable && (searchType =='DealerOutletLeads');
		
		console.log("isDealerOutletLeadsSearch :::::::::::::::::" + isDealerOutletLeadsSearch);
		
        var isDealerCompanyLeadsSearch = isSearchTypeAvailable && (request.searchType =='DealerCompanyLeads');
        var isCustomerLeadsSearch = isSearchTypeAvailable && (request.searchType =='CustomerLeads');
        var isDealerGSCodeAvailable = Boolean(request.dealerGsCode);
        var isDealerNDCodeAvailable = Boolean(request.dealerNdCode);
        var isDealerGCCodeAvailable = Boolean(request.dealerGcCode);
        var isSalesConsFedIdPresent = Boolean(request.salesConsultantFedId);
        var isUcidPresent = Boolean(request.ucid);
        var isAccountIdPresent = Boolean(request.accountId);
        
        if(isSalesConsultantSearch){
           isValidRequest =  isApplicationNameAvailable && isMessageIdAvailable && isMarketAvailable && isSearchTypeAvailable &&
               				 isPagesizeAvailable && isPageCountAvailable && isSalesConsFedIdPresent && isRecordTypeAvailable;
           console.log('isValidRequest::::::::::'+isValidRequest);
        }
		else if(isDealerOutletLeadsSearch){
            isValidRequest = isApplicationNameAvailable && isMessageIdAvailable && isMarketAvailable && isSearchTypeAvailable &&
               				 isPagesizeAvailable && isPageCountAvailable && (isDealerGSCodeAvailable || isDealerNDCodeAvailable);
        }
		else if(isDealerCompanyLeadsSearch){
            isValidRequest = isApplicationNameAvailable && isMessageIdAvailable && isMarketAvailable && isSearchTypeAvailable &&
               				 isPagesizeAvailable && isPageCountAvailable && isDealerGCCodeAvailable;
        }
		else if(isCustomerLeadsSearch){
            isValidRequest = isApplicationNameAvailable && isMessageIdAvailable && isMarketAvailable && isSearchTypeAvailable &&
               				 isPagesizeAvailable && isPageCountAvailable && (isUcidPresent || isAccountIdPresent);
        }
        else{
            isValidRequest = false;
        }
        return isValidRequest;
        
        
    }



function performLeadSearch(oneAPIMetadataList, request, accrecordtype, dealerId) {
        
	 console.log('Inside performLeadSearch');
	 console.log('Inside performLeadSearch dealerId::::::' + dealerId);
     var isValidRequest = false;
	 var leadQuery = new Map();
	 var oppQuery = new Map();
	 var returnMap = new Map();
        
	 var leadObjString = oneAPIMetadataList[0].lead_object__c;
        
        
     enabledDynamicResponse = oneAPIMetadataList[0].enabled_dynamic_response__c;
        
	 if(true == enabledDynamicResponse){
        	createDynamicResponseTagsAndFields(oneAPIMetadataList[0].search_leads_response_mappings__c, leadObjString);    
        }
        
     try{
        var searchType = request.searchType;
        
		if(searchType!=null && searchType.equalsIgnoreCase('SalesconsultantLeads')){
			
            if(leadObjString.equalsIgnoreCase('Lead__c')){
                leadQuery = performSalesConsultantSearch(oneAPIMetadataList,request, accrecordtype);
                isValidRequest = true;
           		
            }else if(leadObjString.equalsIgnoreCase('Opportunity')){                
                oppQuery = performSalesConsultantSearch(oneAPIMetadataList, request, accrecordtype);
				isValidRequest = true;
           		
            }          
            
        }else if(searchType!=null && searchType.equalsIgnoreCase('DealerOutletLeads')){
            if(leadObjString.equalsIgnoreCase('Lead__c')){
                leadQuery = performDealerOutletLeadsSearch(oneAPIMetadataList, request, accrecordtype, dealerId);
           		isValidRequest = true;
           		
            }else if(leadObjString.equalsIgnoreCase('Opportunity')){
                oppQuery = performDealerOutletLeadsSearch(oneAPIMetadataList, request, accrecordtype, dealerId);
                isValidRequest = true;
            }
           
        }else if(searchType!=null && searchType.equalsIgnoreCase('DealerCompanyLeads')){
            if(leadObjString.equalsIgnoreCase('Lead__c')){
                leadQuery = performDealerCompanyLeadsSearch(oneAPIMetadataList, request, accrecordtype, dealerId);
           		isValidRequest = true;
            
			}else if(leadObjString.equalsIgnoreCase('Opportunity')){
                oppQuery = performDealerCompanyLeadsSearch(oneAPIMetadataList, request, accrecordtype, dealerId);
                isValidRequest = true;
           		
            }
            
        }else if(searchType!=null && searchType.equalsIgnoreCase('CustomerLeads')){
            if(leadObjString.equalsIgnoreCase('Lead__c')){
                leadQuery = performCustomerLeadsSearch(oneAPIMetadataList, request, accrecordtype);
           		isValidRequest = true;
            
			}else if(leadObjString.equalsIgnoreCase('Opportunity')){
                oppQuery = performCustomerLeadsSearch(oneAPIMetadataList, request, accrecordtype);
                isValidRequest = true;
            }
            
        }
            //console.log('Print the value of isValidRequest ----> ' + isValidRequest);
     }catch(error) {
            isValidRequest = false;
            console.error( "error in try block of performLeadSearch :::::::::" + error);
			//throw error;
         }
		
		if(leadObjString.equalsIgnoreCase('Lead__c'))
			returnMap.set('leadquery', leadQuery);
		else if(leadObjString.equalsIgnoreCase('Opportunity'))
			returnMap.set('leadquery', oppQuery);
		returnMap.set('isValidRequest', isValidRequest);
		returnMap.set('leadObjString', leadObjString);
		 
        return returnMap;
        
    }  
	
function performDealerOutletLeadsSearch(oneAPIMetadataList, request, accrecordtype, dealerId) {
        
		console.log('Inside performDealerOutletLeadsSearch');
        var leadQuery;
        var dealerAccList;        
        var DealerGSCode = request.dealerGsCode;
        var DealerNDCode = request.dealerNdCode;
        var WhereClauseStart =  ' ';
        var orderByClause = ' ';
        var orderbyField  = oneAPIMetadataList[0].order_by_field__c;
        var leadObjString = oneAPIMetadataList[0].lead_object__c;
        
		var marketValue = request.market;
        var returnMap = new Map();
        
        var leadbasequery;
        if(true == oneAPIMetadataList[0].enabled_dynamic_response__c){
            if(leadObjString.equalsIgnoreCase('Lead__c')){
                leadbasequery = 'SELECT ' + responseTagAPIName + ',l.OwnerId, al1.sfId as al1sfId, u.FederationIdentifier FROM herokusbox.Lead__c l INNER JOIN herokusbox.account a on l.Contact__c::VARCHAR = a.sfid::VARCHAR INNER JOIN herokusbox.account ad on l.Assigned_dealer__c::VARCHAR = ad.sfid:: VARCHAR left JOIN herokusbox.account ac on l.Company_Account__c::VARCHAR = ac.sfid::VARCHAR left JOIN herokusbox.account_link__c al2 on l.Retail_Contact__c::VARCHAR = al2.sfid::VARCHAR left JOIN herokusbox.account_link__c al1 on l.Retail_Company__c::VARCHAR = al1.sfid::VARCHAR left JOIN herokusbox.contact c on l.Sales_Consultant__c::VARCHAR = c.sfid::VARCHAR left JOIN herokusbox.user u on l.OwnerId::VARCHAR = u.sfid::VARCHAR INNER JOIN herokusbox.recordtype recordType ON l.recordTypeID::VARCHAR = recordType.sfid::VARCHAR ';
            }
			else if(leadObjString.equalsIgnoreCase('Opportunity')){
				leadbasequery = 'SELECT ' + responseTagAPIName + ',o.OwnerId, al1.sfId as al1sfId, u.FederationIdentifier FROM herokusbox.opportunity o INNER JOIN herokusbox.account a on o.AccountId::VARCHAR = a.sfid::VARCHAR INNER JOIN herokusbox.account ad on o.Assigned_dealer__c::VARCHAR = ad.sfid:: VARCHAR left JOIN herokusbox.account ac on o.Company_Account__c::VARCHAR = ac.sfid::VARCHAR left JOIN herokusbox.account_link__c al2 on o.Retail_Contact__c::VARCHAR = al2.sfid::VARCHAR left JOIN herokusbox.account_link__c al1 on o.Retail_Company__c::VARCHAR = al1.sfid::VARCHAR left JOIN herokusbox.contact c on o.Sales_Consultant__c::VARCHAR = c.sfid::VARCHAR left JOIN herokusbox.user u on o.OwnerId::VARCHAR = u.sfid::VARCHAR INNER JOIN herokusbox.recordtype recordType ON o.recordTypeID::VARCHAR = recordType.sfid::VARCHAR  ';
            }
        }
        
        console.log('Print base query ---> '+ leadbasequery);
        
        WhereClauseStart += returnQueryString(oneAPIMetadataList, request, accrecordtype);
                     
        if(orderbyField != null) {
            orderByClause += ' order by ' + orderbyField + ' LIMIT ' + parseInt(request.pageSize)  + ' OFFSET ' + calculateOffset(request);
            console.log('Print where part ---> ' + WhereClauseStart);
        }
		
		leadQuery = leadbasequery + ' and ad.sfid in (\'' + dealerId + '\')' + WhereClauseStart + orderByClause;
		
		var paramlist = [request.market];
		
		
		returnMap.set('leadQuery', leadQuery);
		returnMap.set('leadParam', paramlist);
        console.log("final lead query ::::::::::::" + leadQuery);      
        return returnMap;
    }
	
	
function performDealerCompanyLeadsSearch(oneAPIMetadataList, request, accrecordtype, dealerId) {
       
	   console.log('Inside performDealerCompanyLeadsSearch');
	   
	   console.log('Inside performDealerCompanyLeadsSearch dealerId ::::::::::' + dealerId);
       	
		var leadQuery;
		
        var dealerAccList;
        
        var DealerGCCode = request.dealerGcCode;      
        var WhereClauseStart =  ' ';
        var orderByClause = ' ';
        var orderbyField  = oneAPIMetadataList[0].order_by_field__c;
        var leadObjString = oneAPIMetadataList[0].lead_object__c;
        var marketValue = request.market;  
        
        var leadbasequery;
		var returnMap = new Map();
		
        if(true == oneAPIMetadataList[0].enabled_dynamic_response__c){
            
			if(leadObjString.equalsIgnoreCase('Lead__c')){
                leadbasequery = 'SELECT ' + responseTagAPIName + ',l.OwnerId, al1.sfId as al1sfId, u.FederationIdentifier FROM herokusbox.Lead__c l INNER JOIN herokusbox.account a on l.Contact__c::VARCHAR = a.sfid::VARCHAR INNER JOIN herokusbox.account ad on l.Assigned_dealer__c::VARCHAR = ad.sfid:: VARCHAR left JOIN herokusbox.account ac on l.Company_Account__c::VARCHAR = ac.sfid::VARCHAR left JOIN herokusbox.account_link__c al2 on l.Retail_Contact__c::VARCHAR = al2.sfid::VARCHAR left JOIN herokusbox.account_link__c al1 on l.Retail_Company__c::VARCHAR = al1.sfid::VARCHAR left JOIN herokusbox.contact c on l.Sales_Consultant__c::VARCHAR = c.sfid::VARCHAR left JOIN herokusbox.user u on l.OwnerId::VARCHAR = u.sfid::VARCHAR INNER JOIN herokusbox.recordtype recordType ON l.recordTypeID::VARCHAR = recordType.sfid::VARCHAR ';
				
            }
			
			else if(leadObjString.equalsIgnoreCase('Opportunity')){
                leadbasequery = 'SELECT ' + responseTagAPIName + ',o.OwnerId, al1.sfId as al1sfId, u.FederationIdentifier FROM herokusbox.opportunity o INNER JOIN herokusbox.account a on o.AccountId::VARCHAR = a.sfid::VARCHAR INNER JOIN herokusbox.account ad on o.Assigned_dealer__c::VARCHAR = ad.sfid:: VARCHAR left JOIN herokusbox.account ac on o.Company_Account__c::VARCHAR = ac.sfid::VARCHAR left JOIN herokusbox.account_link__c al2 on o.Retail_Contact__c::VARCHAR = al2.sfid::VARCHAR left JOIN herokusbox.account_link__c al1 on o.Retail_Company__c::VARCHAR = al1.sfid::VARCHAR left JOIN herokusbox.contact c on o.Sales_Consultant__c::VARCHAR = c.sfid::VARCHAR left JOIN herokusbox.user u on o.OwnerId::VARCHAR = u.sfid::VARCHAR INNER JOIN herokusbox.recordtype recordType ON o.recordTypeID::VARCHAR = recordType.sfid::VARCHAR  ';
            }
        }
        
        WhereClauseStart += returnQueryString(oneAPIMetadataList, request, accrecordtype);
                     
        if(orderbyField != null) {
            orderByClause += ' order by ' + orderbyField + ' LIMIT ' + parseInt(request.pageSize) + ' OFFSET ' + calculateOffset(request);
            console.log('Print where part ---> ' + WhereClauseStart);
        }
        
		
		leadQuery = leadbasequery + ' and ad.sfid in (\'' + dealerId + '\')' + WhereClauseStart + orderByClause;
		
		var paramlist = [request.market];
		
		returnMap.set('leadQuery', leadQuery);
		returnMap.set('leadParam', paramlist);
        console.log("final lead query ::::::::::::" + leadQuery);      
        return returnMap;
    }


function performCustomerLeadsSearch(oneAPIMetadataList, request, accrecordtype) {
	
       console.log('Inside performCustomerLeadsSearch');
       
	   var leadQuery;
       var WhereClauseStart =  ' ';
       var orderByClause = ' ';
       var orderbyField  = oneAPIMetadataList[0].order_by_field__c;
       var leadObjString = oneAPIMetadataList[0].lead_object__c;
       
       var leadbasequery;
	   var returnMap = new Map();
	   
        if(true == oneAPIMetadataList[0].enabled_dynamic_response__c){
			
            if(leadObjString.equalsIgnoreCase('Lead__c')){
                leadbasequery = 'SELECT ' + responseTagAPIName + ',l.OwnerId, al1.sfId as al1sfId, u.FederationIdentifier FROM herokusbox.Lead__c l INNER JOIN herokusbox.account a on l.Contact__c::VARCHAR = a.sfid::VARCHAR INNER JOIN herokusbox.account ad on l.Assigned_dealer__c::VARCHAR = ad.sfid:: VARCHAR left JOIN herokusbox.account ac on l.Company_Account__c::VARCHAR = ac.sfid::VARCHAR left JOIN herokusbox.account_link__c al2 on l.Retail_Contact__c::VARCHAR = al2.sfid::VARCHAR left JOIN herokusbox.account_link__c al1 on l.Retail_Company__c::VARCHAR = al1.sfid::VARCHAR left JOIN herokusbox.contact c on l.Sales_Consultant__c::VARCHAR = c.sfid::VARCHAR left JOIN herokusbox.user u on l.OwnerId::VARCHAR = u.sfid::VARCHAR INNER JOIN herokusbox.recordtype recordType ON l.recordTypeID::VARCHAR = recordType.sfid::VARCHAR ';
            }
			else if(leadObjString.equalsIgnoreCase('Opportunity')){
                leadbasequery = 'SELECT ' + responseTagAPIName + ',o.OwnerId, al1.sfId as al1sfId, u.FederationIdentifier FROM herokusbox.opportunity o INNER JOIN herokusbox.account a on o.AccountId::VARCHAR = a.sfid::VARCHAR INNER JOIN herokusbox.account ad on o.Assigned_dealer__c::VARCHAR = ad.sfid:: VARCHAR left JOIN herokusbox.account ac on o.Company_Account__c::VARCHAR = ac.sfid::VARCHAR left JOIN herokusbox.account_link__c al2 on o.Retail_Contact__c::VARCHAR = al2.sfid::VARCHAR left JOIN herokusbox.account_link__c al1 on o.Retail_Company__c::VARCHAR = al1.sfid::VARCHAR left JOIN herokusbox.contact c on o.Sales_Consultant__c::VARCHAR = c.sfid::VARCHAR left JOIN herokusbox.user u on o.OwnerId::VARCHAR = u.sfid::VARCHAR INNER JOIN herokusbox.recordtype recordType ON o.recordTypeID::VARCHAR = recordType.sfid::VARCHAR  ';
            }
        }
         
       var midQueryString = returnQueryString(oneAPIMetadataList, request, accrecordtype);
         console.log('Print the midQueryString ---> ' + midQueryString);
       
	   var correctedOne = midQueryString.substring(5);
         
		 console.log('Print the correctedOne ---> '+ correctedOne);
       WhereClauseStart += correctedOne;
	   
	   var paramlist = [request.market];
	               
        if(orderbyField != null) {
            orderByClause += ' order by ' + orderbyField + ' LIMIT ' + parseInt(request.pageSize) + ' OFFSET ' + calculateOffset(request);
            console.log('Print where part ---> ' + WhereClauseStart);
        }
        
        leadQuery = leadbasequery + ' and ' + WhereClauseStart + orderByClause;
        console.log('Print the lead query --->' + leadQuery);
		
		
        
		/*if(leadObjString.equalsIgnoreCase('Lead__c')){
            leadList = Database.query(leadQuery);
        	console.log('leadList after query execution --->'+leadList); 
        }else if(leadObjString.equalsIgnoreCase('Opportunity')){
            opptyList = Database.query(leadQuery); 
            console.log('OpptyList after query execution --->'+opptyList); 
        }*/
         
          
		returnMap.set('leadQuery', leadQuery);
		returnMap.set('leadParam', paramlist);
        console.log("final lead query ::::::::::::" + leadQuery);      
        return returnMap;
     }	
	 
function performSalesConsultantSearch(oneAPIMetadataList, request, accrecordtype) {
       
	   console.log('Inside performSalesConsultantSearch');	   
        
        var leadQuery;        
        var WhereClauseStart = null;
        
        var FederationIdentifierValue = request.salesConsultantFedId;
        
        var orderbyField  = oneAPIMetadataList[0].order_by_field__c;
        
        var leadObjString = oneAPIMetadataList[0].lead_object__c;        
      
        var leadbasequery;
		var returnMap = new Map();
		
		
        if(true == oneAPIMetadataList[0].enabled_dynamic_response__c){
            if(leadObjString.equalsIgnoreCase('Lead__c')){
                leadbasequery = 'SELECT ' + responseTagAPIName + ',l.OwnerId, al1.sfId as al1sfId, u.FederationIdentifier FROM herokusbox.Lead__c l INNER JOIN herokusbox.account a on l.Contact__c::VARCHAR = a.sfid::VARCHAR INNER JOIN herokusbox.account ad on l.Assigned_dealer__c::VARCHAR = ad.sfid:: VARCHAR left JOIN herokusbox.account ac on l.Company_Account__c::VARCHAR = ac.sfid::VARCHAR left JOIN herokusbox.account_link__c al2 on l.Retail_Contact__c::VARCHAR = al2.sfid::VARCHAR left JOIN herokusbox.account_link__c al1 on l.Retail_Company__c::VARCHAR = al1.sfid::VARCHAR left JOIN herokusbox.contact c on l.Sales_Consultant__c::VARCHAR = c.sfid::VARCHAR left JOIN herokusbox.user u on l.OwnerId::VARCHAR = u.sfid::VARCHAR INNER JOIN herokusbox.recordtype recordType ON l.recordTypeID::VARCHAR = recordType.sfid::VARCHAR ';
            }
			else if(leadObjString.equalsIgnoreCase('Opportunity')){
                leadbasequery = 'SELECT ' + responseTagAPIName + ',o.OwnerId, al1.sfId as al1sfId, u.FederationIdentifier FROM herokusbox.opportunity o INNER JOIN herokusbox.account a on o.AccountId::VARCHAR = a.sfid::VARCHAR INNER JOIN herokusbox.account ad on o.Assigned_dealer__c::VARCHAR = ad.sfid:: VARCHAR left JOIN herokusbox.account ac on o.Company_Account__c::VARCHAR = ac.sfid::VARCHAR left JOIN herokusbox.account_link__c al2 on o.Retail_Contact__c::VARCHAR = al2.sfid::VARCHAR left JOIN herokusbox.account_link__c al1 on o.Retail_Company__c::VARCHAR = al1.sfid::VARCHAR left JOIN herokusbox.contact c on o.Sales_Consultant__c::VARCHAR = c.sfid::VARCHAR left JOIN herokusbox.user u on o.OwnerId::VARCHAR = u.sfid::VARCHAR INNER JOIN herokusbox.recordtype recordType ON o.recordTypeID::VARCHAR = recordType.sfid::VARCHAR  ';
            }
        }
        
        
        var recordtypeVal = request.recordType;
		
        var salesleadSearchType = oneAPIMetadataList[0].sales_lead_search__c; 
        var aftersalesSearchType = oneAPIMetadataList[0].after_sales_lead_search__c;
        
        if((FederationIdentifierValue != null && FederationIdentifierValue.length>0) && (recordtypeVal != null && recordtypeVal.length>0)){
        	
			if( recordtypeVal.equalsIgnoreCase('Sales Leads') || recordtypeVal.equalsIgnoreCase('Sales Lead')){
            	
				if(salesleadSearchType != null && salesleadSearchType.length>0){
					
                	if(salesleadSearchType.equalsIgnoreCase('Sales Consultant')){
						
                    	//List<Contact> contactVal = [SELECT Id, Federation_ID__c from Contact where Federation_ID__c =:FederationIdentifierValue];
                     	//if(contactVal != null && contactVal.size() > 0){
						
                         	WhereClauseStart = ' and c.sfid = (SELECT SfId FROM herokusbox.contact where Federation_ID__c = $2';
						
                     	//}
                    }else if(salesleadSearchType.equalsIgnoreCase('Owner')){
						
                        //ANURAG Fixed Exception - List has no rows for assignment to SObject
                       // List<User> leadOwnerList = [Select Id from User where FederationIdentifier =: FederationIdentifierValue];
                        //if(leadOwnerList.size()>0 && leadOwnerList != null){
                            //Id leadOwnerId = leadOwnerList[0].Id;
                           if(leadObjString.equalsIgnoreCase('Lead__c'))
						      WhereClauseStart = ' and l.OwnerId = (SELECT SfId FROM herokusbox.user WHERE FederationIdentifier = $2)';
					       else if(leadObjString.equalsIgnoreCase('Opportunity'))
							  WhereClauseStart = ' and o.OwnerId = (SELECT SfId FROM herokusbox.user WHERE FederationIdentifier = $2)';
                        //}
                    }else if(salesleadSearchType.equalsIgnoreCase('All')){
						
                        /*List<Contact> contactVal = [SELECT Id, Federation_ID__c from Contact where Federation_ID__c =:FederationIdentifierValue];
                     	if(contactVal != null && contactVal.size() > 0){
                            WhereClauseStart = ' WHERE Sales_Consultant__r.Id =' + '\''+ contactVal[0].Id + '\'' ;
                        }
                        User leadOwner = [Select Id from User where FederationIdentifier =: FederationIdentifierValue];
            		 	Id leadOwnerId = leadOwner.Id; */
						if(leadObjString.equalsIgnoreCase('Lead__c'))
                     	
							WhereClauseStart += ' and (c.sfid = (SELECT SfId FROM herokusbox.contact where Federation_ID__c = $2) or l.OwnerId = (SELECT SfId FROM herokusbox.user WHERE FederationIdentifier = $2))';
					
					    else if(leadObjString.equalsIgnoreCase('Opportunity'))
							WhereClauseStart += ' and (c.sfid = (SELECT SfId FROM herokusbox.contact where Federation_ID__c = $2) or o.OwnerId = (SELECT SfId FROM herokusbox.user WHERE FederationIdentifier = $2))';
					
							
                    }
            	}
        	}else if( recordtypeVal.equalsIgnoreCase('Aftersales Leads') || recordtypeVal.equalsIgnoreCase('Aftersales Lead')){
				
                //User serviceAdvisor = [Select Id from User where FederationIdentifier =: FederationIdentifierValue];
                //Id serviceAdvisorId = serviceAdvisor.Id;
                
				if(aftersalesSearchType.equalsIgnoreCase('Service Advisor')){                    
                    
					if(leadObjString.equalsIgnoreCase('Lead__c')){
                        WhereClauseStart = ' and u.sfid = (Select Id from User where FederationIdentifier = $2)';
                    }
					/*else if(leadObjString.equalsIgnoreCase('Opportunity')){
                        WhereClauseStart = ' and Assigned_Service_Advisor__r.Id =' + '\''+ serviceAdvisorId + '\'';                        
                    } */                   
                }
				
				else if(aftersalesSearchType.equalsIgnoreCase('Owner')){
					
					if(leadObjString.equalsIgnoreCase('Lead__c'))
                        WhereClauseStart = ' and l.OwnerId = $2';
					else if(leadObjString.equalsIgnoreCase('Opportunity'))
						 WhereClauseStart = ' and o.OwnerId = $2';
                }
				
				else if(aftersalesSearchType.equalsIgnoreCase('All')){
                    /*if(leadObjString.equalsIgnoreCase('Lead__c')){
                        WhereClauseStart = ' and Service_Advisor__r.Id =' + '\''+ serviceAdvisorId + '\'';
                    }
					else if(leadObjString.equalsIgnoreCase('Opportunity')){
                        WhereClauseStart = ' WHERE Assigned_Service_Advisor__r.Id =' + '\''+ serviceAdvisorId + '\'';                        
                    }*/
                    if(leadObjString.equalsIgnoreCase('Lead__c'))
						WhereClauseStart += 'and (u.sfid = (Select Id from User where FederationIdentifier = $2) OR l.OwnerId = $2)';
					else if(leadObjString.equalsIgnoreCase('Opportunity'))
						WhereClauseStart += 'and (u.sfid = (Select Id from User where FederationIdentifier = $2) OR o.OwnerId = $2)';
                }                
            }
        }  
            
        WhereClauseStart += returnQueryString(oneAPIMetadataList, request, accrecordtype); 
        
        console.log('Print base query ---> '+ leadbasequery);
        
        if(orderbyField != null) {
            WhereClauseStart += ' order by ' + orderbyField + ' LIMIT ' + parseInt(request.pageSize) + ' OFFSET ' + calculateOffset(request);
            console.log('Print where part ---> ' + WhereClauseStart);
        }
        
		leadQuery = leadbasequery + WhereClauseStart ;
        console.log('Print the lead query --->' + leadQuery);
		
		var paramlist = [request.market, request.salesConsultantFedId];
		
		returnMap.set('leadQuery', leadQuery);
		returnMap.set('leadParam', paramlist);
        console.log("final lead query ::::::::::::" + leadQuery);      
        return returnMap;
        
    }	 
	 


function returnQueryString(oneAPIMetadataList, request, accrecordtype){
        
		var otherValuesQueryString = ' ';
        var ucidInRequest = null;
        var accountIdFromRequest = null;
        
		var includeClosedLeads = false;
		
        var recordTypeValue = request.recordType;
        var marketValue = request.market;
		
        var closeLeads = request.includeClosedLeads;
        
		if(typeof closeLeads === "boolean"){
            includeClosedLeads = closeLeads;
        }
        
		var sourceSystemLeads = false;
		
        var sourceSysLeads = request.restrictSourceSystemLeadsOnly;
        
		if(typeof sourceSysLeads === "boolean"){
            sourceSystemLeads = sourceSysLeads;
        }
		
        var includeVanLeads = false;
		
        var vanLeads = request.includeVanLeads;
		
        if(typeof vanLeads === "boolean"){
            includeVanLeads = vanLeads;
        }
       
        var closedLeadStatus = oneAPIMetadataList[0].closed_lead_stages__c;
        
        var leadObjectName = oneAPIMetadataList[0].lead_object__c;
        
        console.log('Print otherValuesQueryString start ---> ' + otherValuesQueryString);
		
		var ucid = request.ucid;
        
        if (ucid != null && ucid.length>0){
			
            var appendUcid = ' ';
			
            //ucidInRequest = request.ucid;
			
            if(leadObjectName.equalsIgnoreCase('Lead__c')){
                appendUcid = ' AND ( a.UCID__c =' + '\''+ ucid + '\'' + ' OR ac.UCID__c =' + '\''+ ucid + '\'' + ' )  ' ; 
            }
			else if(leadObjectName.equalsIgnoreCase('Opportunity')){
            	appendUcid = ' AND ( a.UCID__c =' + '\''+ ucid + '\'' + ' OR ac.UCID__c =' + '\''+ ucid + '\'' + ' )  ' ; 
            }
            otherValuesQueryString +=  appendUcid; 
        }
        
        console.log('Print otherValuesQueryString ucid ---> ' + otherValuesQueryString);
		
		var accountId = request.accountId;
        
        if (accountId != null && accountId.length>0){
			
           // accountIdFromRequest = (String)requestMap.get('accountId');
		   
            
           
		   if(accrecordtype == 'Person Account'){  
               
			   var appendAccountId = ' ';
			   
                if(leadObjectName.equalsIgnoreCase('Lead__c')){
					
                    appendAccountId = ' AND a.sfId =' + '\''+ accountId + '\'';
                }
				else if(leadObjectName.equalsIgnoreCase('Opportunity')){
					
                    appendAccountId = ' AND a.sfId =' + '\''+ accountId + '\'';
                }                 
                otherValuesQueryString +=  appendAccountId;
            }
            else if(accrecordtype == 'Company'){                              
               
			   var appendAccCompany = ' AND ac.sfId =' + '\''+ accountId + '\'';
                otherValuesQueryString +=  appendAccCompany;
            }
        }
        
        console.log('Print otherValuesQueryString accid ---> ' + otherValuesQueryString);
        
        if(leadObjectName.equalsIgnoreCase('Lead__c')){
           
		   if(recordTypeValue != null && recordTypeValue.length>0 && recordTypeValue.equalsIgnoreCase('Sales Leads')){
            	var appendRecordType = ' AND l.RecordtypeId =' + LEADSALESRECORDTYPEID;
            	otherValuesQueryString +=  appendRecordType;
        	}
			else if(recordTypeValue != null && recordTypeValue.length>0 && recordTypeValue.equalsIgnoreCase('Aftersales Leads')){
         		var appendRecordType = ' AND l.RecordtypeId =' + LEADAFTERSALESRECORDTYPEID ;
            	otherValuesQueryString +=  appendRecordType;
        	}
        }
		
		else if(leadObjectName.equalsIgnoreCase('Opportunity')){
            
			if(recordTypeValue != null && recordTypeValue.length>0 && recordTypeValue.equalsIgnoreCase('Sales Lead')){
            	var appendRecordType = ' AND o.RecordtypeId =' + OPPTYSALESRECORDTYPEID;
            	otherValuesQueryString +=  appendRecordType;
        	}
			else if(recordTypeValue != null && recordTypeValue.length>0 && recordTypeValue.equalsIgnoreCase('Aftersales Lead')){
         		var appendRecordType = ' AND o.RecordtypeId =' + OPPTYAFTERSALESRECORDTYPEID;
            	otherValuesQueryString +=  appendRecordType;
        	}            
        }
        
        
        console.log('Print otherValuesQueryString recordtype ---> ' + otherValuesQueryString);
        
        if(marketValue != null && marketValue.length>0){
          if(leadObjectName.equalsIgnoreCase('Lead__c'))  
			var appendMarket = ' AND l.market__c = $1' ;
		  else if(leadObjectName.equalsIgnoreCase('Opportunity'))
			var appendMarket = ' AND o.market__c = $1' ;  
            
			otherValuesQueryString += appendMarket;
			
        }
        
        console.log('Print otherValuesQueryString market ---> ' + otherValuesQueryString);
        
        if(oneAPIMetadataList[0].include_closed_leads__c) {
            if(!includeClosedLeads){
                if(leadObjectName.equalsIgnoreCase('Lead__c')){
                    otherValuesQueryString += ' AND l.Dealer_Lead_Status__c NOT IN (' + '\''+ closedLeadStatus + '\'' + ')';
                }else if(leadObjectName.equalsIgnoreCase('Opportunity')){
            		otherValuesQueryString += ' AND o.StageName NOT IN (' + '\''+ closedLeadStatus + '\'' + ')';
                }
        	}
        }        
        
        console.log('Print otherValuesQueryString close leads ---> ' + otherValuesQueryString);
        
        if(oneAPIMetadataList[0].Restrict_source_system_leads__c && sourceSystemLeads){
            
			var sourcesystem = request.applicationName;
			
            if(leadObjectName.equalsIgnoreCase('Lead__c')){
				
                otherValuesQueryString += ' AND l.Application_Name__c =' + '\''+ sourcesystem + '\'';
            }else if(leadObjectName.equalsIgnoreCase('Opportunity')){
            	otherValuesQueryString += ' AND o.Application_Name__c =' + '\''+ sourcesystem + '\'';
            }            
        }
        
        console.log('Print otherValuesQueryString appln name ---> ' + otherValuesQueryString);
        
        if(oneAPIMetadataList[0].include_van_leads__c && includeVanLeads){
		if(leadObjectName.equalsIgnoreCase('Lead__c'))	
            otherValuesQueryString += ' AND l.Entity__c IS NOT NULL';
		if(leadObjectName.equalsIgnoreCase('Opportunity'))	
			otherValuesQueryString += ' AND o.Entity__c IS NOT NULL';
        }
        
        console.log('Print otherValuesQueryString van leads ---> ' + otherValuesQueryString);
        
        return otherValuesQueryString;
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

function createDynamicResponseTagsAndFields(dynamicMapping, leadObjString){
        
		var value='';
        var responseTagAPINameSet = [];
        var apiNameList;
		responseTagAPIName = '';
		
        console.log('INSIDE createDynamicResponseTagsAndFields -------------->');
		
		var result = dynamicMapping.split(',');
		
        for(i=0; i<result.length;i++){
            
			console.log('row value -------------->' + result[i]);
			
            var arrayfield = result[i].split(':');			
			
            console.log('arrayfield -------------->' + arrayfield);
			
			metadataFieldsMap.set(String(arrayfield[0]), String(arrayfield[1]));
			
            if(!(String(arrayfield[1]).equalsIgnoreCase("NA"))){
				
                if(String(arrayfield[1]).includes('-')){
					
                    apiNameList = String(arrayfield[1]).split('-');
                    
					console.log('apiNameList -------------->' + apiNameList);					
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
					if(leadObjString.equalsIgnoreCase('Lead__c'))
                     value = 'l.' + String(arrayfield[1]).trim();
					else if(leadObjString.equalsIgnoreCase('Opportunity'))
					 value = 'o.' + String(arrayfield[1]).trim();
					
					console.log('value inside else -------------->' + value);
                }                
            }            
            else if(String(arrayfield[1]).equalsIgnoreCase("NA")){
				value = '';
			}				
            if(value != '')
            responseTagAPINameSet.push(value); 
			
        }
		
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
		
		
		
		
        console.log('responseTagAPIName -------------->' + responseTagAPIName);
        console.log('metadataFieldsMap -------------->' + metadataFieldsMap);
    }



function getleadDetails(leadDetails, request, leadObjString) {
	
console.log ('Inside getleadDetails ::::::::::::::::::');
         var responseMap = new Map();
         var leadListRecords = [];
         if(leadDetails.length>0) {
              for(i = 0; i<leadDetails.length; i++) {
				  console.log ('Inside for ::::::::::::::::::');
				  if(true == enabledDynamicResponse){
					  console.log ('Inside if ::::::::::::::::::');
                  var responseMap = dynamicResponseMappings(leadDetails[i], request, leadObjString);
					
					console.log ('responseMap size::::::::' + responseMap.size);
					
                    leadListRecords.push(responseMap);  
				  }
				}
          
         }
		 
		console.log ('leadListRecords length::::::::' + leadListRecords.length);
        return leadListRecords;
    }



function dynamicResponseMappings(leadDetails, request, leadObjString){
        
        console.log('<--------- INSIDE dynamicAccountLinkMappings ------------>');
        
        var objectValue;
        var value;
        //sObject obj;
        var apiNameList;
		
		var leadMap = new Map(Object.entries(leadDetails));
        
        var responseMap = new Map();
		
        responseMap.set('messageId', request.messageId);
        responseMap.set('messageStatus', 'Success');
        responseMap.set('errorCode', '');
        responseMap.set('errorMessage', '');
        responseMap.set('errorCategory', '');
        
        /*if(objectName instanceof Lead__c){
            console.log('INSIDE LEAD --- Lead__c ====>');
            obj = (Lead__c) objectName;
        }else if(objectName instanceof Opportunity){
            console.log('INSIDE OPPORTUNITY --- Opportunity ====>');
            obj = (Opportunity) objectName;
        } */
        
//Id leadOwnerId = (Id) obj.get('OwnerId'); 
        //List<User> ownerUsr = [SELECT Id, FederationIdentifier From User where Id =: leadOwnerId];
        
            console.log('metadataFieldsMap ====>' + metadataFieldsMap);
			
            if(metadataFieldsMap != null && metadataFieldsMap.size>0){
				
                for(let responseTag of metadataFieldsMap.keys()){
					
                    console.log('responseTag ====>' + responseTag);
					
                    if(responseTag.equalsIgnoreCase('corporateLead') 
                       || responseTag.equalsIgnoreCase('accountLinkId')
                       || responseTag.equalsIgnoreCase('salesConsultantFedId')){
                           
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
                            responseMap.set(responseTag, '');  
							
                        }else {
                            console.log('=== INSIDE ELSE ==');
							
                            if(objectValue.includes('-')){
								
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
                                    responseMap.set(responseTag, '');
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
        
        console.log('responseMap ----->' + responseMap);
        return responseMap;
    }



	
module.exports = {
  getleadDetails,
  performRequestValidations,
  performLeadSearch
};	
	