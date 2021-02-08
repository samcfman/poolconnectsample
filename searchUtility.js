function getFormattedPhoneNumbers(newMetadataList, request){
	console.log ("inside getFormattedPhoneNumbers ::::::::::");
	
        var mobilePhone = request.mobilePhone;
        var homePhone = request.homePhone;
        var workPhone = request.workPhone;
		var isConvertPhoneNumberFormat = newMetadataList[0].convert_phone_number_format__c;
		//console.log ("inside getFormattedPhoneNumbers isConvertPhoneNumberFormat ::::::::::" + isConvertPhoneNumberFormat);
        var countryCode = newMetadataList[0].country_code__c;
		//console.log ("inside getFormattedPhoneNumbers countryCode ::::::::::" + countryCode);
        countryCode = countryCode != null ? countryCode.trim() : countryCode;
        
        if(Boolean(request.homePhone)){
            homePhone = isConvertPhoneNumberFormat && countryCode != null && homePhone.startsWith(countryCode) ? homePhone.replace(countryCode, '0') : homePhone;
            homePhone = homePhone.replace(/-/g,'');
            homePhone = homePhone.replace(/\+/g,'');
            homePhone = homePhone.replace(/\(/g,'');
            homePhone = homePhone.replace(/\)/g,'');
            homePhone = homePhone.replace(/  /g,'');
            request.homePhone = homePhone;
        }
        if(Boolean(request.mobilePhone)){
            mobilePhone = isConvertPhoneNumberFormat && countryCode != null && mobilePhone.startsWith(countryCode) ? mobilePhone.replace(countryCode, '0') : mobilePhone;
            mobilePhone = mobilePhone.replace(/-/g,'');
            mobilePhone = mobilePhone.replace(/\+/g,'');
            mobilePhone = mobilePhone.replace(/\(/g,'');
            mobilePhone = mobilePhone.replace(/\)/g,'');
            mobilePhone = mobilePhone.replace(/  /g,'');
            request.mobilePhone = mobilePhone;
        }
        if(Boolean(request.workPhone)){
            workPhone = isConvertPhoneNumberFormat && countryCode != null && workPhone.startsWith(countryCode) ? workPhone.replace(countryCode, '0') : workPhone;
            workPhone = workPhone.replace(/-/g,'');
            workPhone = workPhone.replace(/\+/g,'');
            workPhone = workPhone.replace(/\(/g,'');
            workPhone = workPhone.replace(/\)/g,'');
            workPhone = workPhone.replace(/  /g,'');
            request.workPhone = workPhone;
        }
        
    }
	

/*function noOfNotes(parentid, salesforceEnv)
    {
        var IntCount = 0;
        if(salesforceEnv.equalsIgnoreCase('LIGHTNING')){
            IntCount = [SELECT count() FROM contentdocumentlink where linkedentityid=:parentid];
        }
        else{
            IntCount = [SELECT count() FROM note where parentid=:parentid];
        }
        // noteCount = String.valueOf(IntCount);
        return IntCount;
    }
 */   	
	
module.exports = {
  getFormattedPhoneNumbers
};	
	