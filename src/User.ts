const REDMINE_API_URL           = 'https://rm.ewdev.ca';
const LAST_SELECTED_DATE_KEY    = 'LAST_SELECTED_DATE';
const REDMINE_CALENDAR_NAME 	= 'My Redmine';
const RM_ACTIVITIES_KEY   	    = 'RM_ACTIVITIES';

const User = {
    API_TOKEN  : 'api_token',
    API_URL    : 'api_url',
    getLastSelectedDate (): number {
        try {
            const savedData = PropertiesService.getUserProperties().getProperty(LAST_SELECTED_DATE_KEY);
            return Number(savedData);
        } catch (e) {}

        return 0;
    },
    setLastSelectedDate (newDate) {
        try {
            const dateToSave = typeof newDate === 'number' ? newDate.toString() : newDate;
            PropertiesService.getUserProperties().setProperty(LAST_SELECTED_DATE_KEY, dateToSave);
        } catch (e) {}
    },

    getRedmineApiUrl ():string  {
        const currentProperties = PropertiesService.getUserProperties();
        let savedApiUrl;
        try {
            savedApiUrl = currentProperties.getProperty(this.API_URL);
        } catch (e) {}

        if (savedApiUrl) {
            return savedApiUrl;
        }

        const isEvolvingWebEmail = this._isEvolvingWebEmail();
        if (isEvolvingWebEmail) {
            return REDMINE_API_URL;
        }

        return null;
    },

    hasConfiguration (): boolean {
        const apiUrl = this.getRedmineApiUrl() || false;
        const token = this.getRedmineApiToken() || false;

        return apiUrl && token;
    },

    getRedmineApiToken (encrypt: boolean = false, returnAsHeader:boolean =  false):string {
        const currentProperties = PropertiesService.getUserProperties();
        const savedToken = currentProperties.getProperty(this.API_TOKEN);

        if (!encrypt) {
            return savedToken;
        }

        const stringToCrypt = `${savedToken}:${new Date().getTime()}`;
        const encrypted     = Utilities.base64Encode(stringToCrypt);

        return returnAsHeader ? `Basic ${encrypted}` : encrypted;
    },

    _isEvolvingWebEmail ():boolean {
        const email = this.getEmail();
        const evolvingWebDomain = '@evolvingweb.ca';
        const index = email.indexOf(evolvingWebDomain);

        return index > 0;
    },

    getEmail ():string {
        try {
            return Session.getActiveUser().getEmail();
        } catch (e) { }

        return '';
    },

    getRedmineCalendar () {
        const calendars = CalendarApp.getCalendarsByName(REDMINE_CALENDAR_NAME);
        const calendar = calendars && calendars.length && calendars[0];

        return calendar;
    },

    /**
     * Get the saved Redmine activities
     */
    getUserActivities ():IActivityResponse[] {
        const currentProperties = PropertiesService.getUserProperties();
        const activitiesString = currentProperties.getProperty(RM_ACTIVITIES_KEY) || '{}';

        try {
            const activities = JSON.parse(activitiesString);
            return activities;
        } catch (e){}
    },

    /**
     * Save Redmine activities
     */
    setUserActivities (activities) {
        const currentProperties = PropertiesService.getUserProperties();

        try {
            const activitiesString = JSON.stringify(activities);
            currentProperties.setProperty(RM_ACTIVITIES_KEY, activitiesString);
        } catch (e){}
    }
};