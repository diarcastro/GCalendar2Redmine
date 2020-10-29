const HTTP_RESPONSE_CREATED = 201;
const HTTP_RESPONSE_OK      = 200;


class Redmine {
    public readonly TIME_ENTRIES = 'time_entries.json';
    public readonly TIME_ENTRY_ACTIVITIES = 'enumerations/time_entry_activities.json';

    private _apiUrl = '';

    constructor () {
        this._apiUrl = User.getApiUrl();
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
            const response = this._fetch(this.TIME_ENTRIES, timeEntryData, 'post');
            const id = response?.time_entry?.id || 0;
            timeEntries.push(id);
        });

        return timeEntries;
    }

    getActivities (): IActivityResponse[] {
        const response = this._fetch(this.TIME_ENTRY_ACTIVITIES, {});
        const activities = response?.time_entry_activities || null;

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
            console.log('request', requestUrl);

            if (responseCode === HTTP_RESPONSE_OK || responseCode === HTTP_RESPONSE_CREATED) {
                const body = fetchResponse.getContentText();
                return JSON.parse(body);
            } else {
                console.log('response Error', fetchResponse.getContentText());
            }
        } catch (e) {
            console.log('Request Error', e);
        }

        return false;
    }

    private _getRequestHeaders (): GoogleAppsScript.URL_Fetch.HttpHeaders {
        const headers = {
            'X-Redmine-API-Key': User.getApiToken(),
        };

        const isEvolvingWebEmail = User._isEvolvingWebEmail();

        if (isEvolvingWebEmail) { // Bypass Authorization for EvolvingWeb Useres
            const authString = `${RM_USER}:${RM_PASSWORD}`;
            const encodedString = Utilities.base64Encode(authString);
            headers['Authorization'] = `Basic ${encodedString}`;
        }

        return headers;
    }
}

const redmineRequests = new Redmine();