const HTTP_RESPONSE_CREATED = 201;

function getRequestHeaders () {
    return {
        Authorization               : getRedmineApiToken(true, true),
        'CF-Access-Client-ID'       : CLIENT_ID,
        'CF-Access-Client-Secret'   : CLIENT_SECRET,
    };
}

function saveSpentTime (params: any) {
    const headers = getRequestHeaders();
    const requestOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        headers,
        method: 'post',
        payload: params,
    };

    const url           = `${REDMINE_API_URL}/time_entries.json`;
    const fetchResponse = UrlFetchApp.fetch(url, requestOptions);
    const body          = fetchResponse.getContentText();
    const responseCode  = fetchResponse.getResponseCode();

    if (responseCode === HTTP_RESPONSE_CREATED) {
        try{
            const data = JSON.parse(body);
            const timeEntry = data && data.time_entry;
            const timeEntryId   = timeEntry && timeEntry.id;

            return timeEntryId;
        } catch (e) {

        }
    }

    return false;
}