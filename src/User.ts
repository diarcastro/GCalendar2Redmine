const DEFAULT_API_URL       = 'https://rm.ewdev.ca';
const DEFAULT_CALENDAR_NAME = 'My Redmine';

enum EUserProperty {
    ACTIVITIES              = 'activities',
    API_TOKEN               = 'api_token',
    API_URL                 = 'api_url',
    CALENDAR_NAME           = 'calendar_name',
    DEFAULT_ACTIVITY        = 'default_activity',
    LAST_SELECTED_DATE_KEY  = 'last_selected_date',
    OVERWRITE_TITLE         = 'overwrite_title', /* Redmine time comment will be the event description or just the title */
};

const User = {
    getLastSelectedDate (): number {
        try {
            const savedData = this._getProperty(EUserProperty.LAST_SELECTED_DATE_KEY);
            return Number(savedData);
        } catch (e) {}

        return 0;
    },

    setLastSelectedDate (newDate) {
        try {
            const dateToSave = typeof newDate === 'number' ? newDate.toString() : newDate;
            this.setProperty(EUserProperty.LAST_SELECTED_DATE_KEY, dateToSave);
        } catch (e) {}
    },

    /**
     * Should overwrite the event title with the event description for use it as Redmine time comment?
     */
    getOverwriteTitle (): boolean {
        try {
            const savedData = this._getProperty(EUserProperty.OVERWRITE_TITLE);
            return savedData !== null ? Boolean(Number(savedData)) : true;
        } catch (e) {}

        return true;
    },

    /**
     * Save user configuration
     *
     * @param value
     */
    setOverwriteTitle (value: string) {
        try {
            this.setProperty(EUserProperty.OVERWRITE_TITLE, value);
        } catch (e) {}
    },

    getApiUrl ():string  {
        const savedApiUrl = this._getProperty(EUserProperty.API_URL, '');

        if (savedApiUrl) {
            return savedApiUrl;
        }

        const isEvolvingWebEmail = this._isEvolvingWebEmail();
        if (isEvolvingWebEmail) {
            return DEFAULT_API_URL;
        }

        return null;
    },

    hasConfiguration (): boolean {
        const apiUrl = this.getApiUrl() || false;
        const token  = this.getApiToken() || false;

        return apiUrl && token;
    },

    getApiToken ():string {
        return this._getProperty(EUserProperty.API_TOKEN, '');
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
        const calendarName  = this.getCalendarName();
        const calendars     = CalendarApp.getCalendarsByName(calendarName);
        const calendar      = calendars && calendars.length && calendars[0];

        return calendar;
    },

    /**
     * Get the saved Redmine activities
     */
    getUserActivities (): IActivityResponse[] {
        const activitiesString = this._getProperty(EUserProperty.ACTIVITIES, '{}');

        try {
            const activities = JSON.parse(activitiesString);
            return activities;
        } catch (e){}
    },

    /**
     * Save Redmine activities
     */
    setUserActivities (activities) {
        try {
            const activitiesString = JSON.stringify(activities);
            this.setProperty(EUserProperty.ACTIVITIES, activitiesString);
        } catch (e) {}
    },

    properties(): GoogleAppsScript.Properties.Properties {
        return PropertiesService.getUserProperties();
    },

    /**
     * Save a value in user properties state
     */
    setProperty(propertyName:string, propertyValue: string): GoogleAppsScript.Properties.Properties {
        return this.properties().setProperty(propertyName, propertyValue);
    },

    /**
     * Get the current calendar where Redmine events are located
     */
    getCalendarName():string {
        return this._getProperty(EUserProperty.CALENDAR_NAME, DEFAULT_CALENDAR_NAME);
    },

    getDefaultActivity():number {
        const defaultActivity = this._getProperty(EUserProperty.DEFAULT_ACTIVITY, 0);
        return Number(defaultActivity);
    },

    _getProperty(propertyName: string, defaultValue:any = null): string | any {
        try {
            const propertyValue = this.properties().getProperty(propertyName);
            return propertyValue ? propertyValue : defaultValue;
        } catch (e) {
            console.log('_getProperty error', e);
            return defaultValue;
        }
    }

};