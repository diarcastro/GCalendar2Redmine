const HTTP_RESPONSE_CREATED = 201;


class Redmine {
    public readonly HTTP_RESPONSE_CREATED = 201;
    public readonly TIME_ENTRIES = 'time_entries.json';
    public readonly TIME_ENTRY_ACTIVITIES = 'enumerations/time_entry_activities.json';

    private _apiUrl = '';

    constructor () {
        this._apiUrl = User.getRedmineApiUrl();
    }

    saveSpentTime (params: GoogleAppsScript.URL_Fetch.Payload): string {
        const response = this._fetch(this.TIME_ENTRIES, params, 'post');

        if (response) {
            const { time_entry: { id = null } = {}} =  response;
            return id;
        }

        return null;
    }

    saveSpentTimeBatch (data: GoogleAppsScript.URL_Fetch.Payload[]): string[] {
        const timeEntries = [];

        data.forEach((timeEntryData) => {
            // const headers = this._getRequestHeaders();
            // const requestUrl = `${this._apiUrl}/${this.TIME_ENTRIES}`;
            // const request = {
            //     url: requestUrl,
            //     headers,
            //     method: 'post',
            //     payload: timeEntryData
            // };

            const response = this._fetch(this.TIME_ENTRIES, timeEntryData, 'post');
            const id = response?.time_entry?.id || 0;
            timeEntries.push(id);
            // if (response) {
            //     const { time_entry: { id = null } = {}} =  response;
            //     timeEntries.push(id);
            // } else {
            //     timeEntries.push(0);
            // }

            // return request as GoogleAppsScript.URL_Fetch.URLFetchRequest;
        });

        /* const requests = data.map((timeEntryData) => {
            const headers = this._getRequestHeaders();
            const requestUrl = `${this._apiUrl}/${this.TIME_ENTRIES}`;
            const request = {
                url: requestUrl,
                headers,
                method: 'post',
                payload: timeEntryData
            }

            return request as GoogleAppsScript.URL_Fetch.URLFetchRequest;
        });

        if (requests && requests.length) {
            const responses = UrlFetchApp.fetchAll(requests);
            if (responses && responses.length) {
                return responses.map(response => {
                    const responseCode = response.getResponseCode();
                    if (responseCode === HTTP_RESPONSE_CREATED) {
                        try {
                            const body      = response.getContentText();
                            const jsonData  = JSON.parse(body);
                            const { time_entry: { id = null } = {}} =  jsonData;

                            return id;
                        } catch (e) {}
                    }
                    return null;
                });
            }
        } */

        return timeEntries;
    }

    getActivities (): IActivityResponse[] {
        const response = this._fetch(this.TIME_ENTRY_ACTIVITIES, {});
        const {
            time_entry_activities: activities = []
        } = response;

        return activities;
    }

    private _fetch (action, payload, method = 'get') {
        const headers = this._getRequestHeaders();
        const requestOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
            headers,
            method: method as GoogleAppsScript.URL_Fetch.HttpMethod,
            payload,
        };

        try {
            const requestUrl    = `${this._apiUrl}/${action}`;
            const fetchResponse = UrlFetchApp.fetch(requestUrl, requestOptions);
            const responseCode  = fetchResponse.getResponseCode();

            if (responseCode === HTTP_RESPONSE_CREATED) {
                const body = fetchResponse.getContentText();
                return JSON.parse(body);
            }
        } catch (e) {
            console.log('Request Error', e);
        }

        return false;
    }

    private _getRequestHeaders (): GoogleAppsScript.URL_Fetch.HttpHeaders {
        const headers = {
            'X-Redmine-API-Key': User.getRedmineApiToken(),
        };

        const isEvolvingWebEmail = User._isEvolvingWebEmail();

        if (isEvolvingWebEmail) { // Bypass Authorization
            const authString = `${RM_USER}:${RM_PASSWORD}`;
            const encodedString = Utilities.base64Encode(authString);
            headers['Authorization'] = `Basic ${encodedString}`;
        }

        return headers;
    }
}

const redmineRequests = new Redmine();