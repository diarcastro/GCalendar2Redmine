const REDMINE_API_URL           = 'https://rm.ewdev.ca';
const LAST_SELECTED_DATE_KEY    = 'LAST_SELECTED_DATE';
const REDMINE_CALENDAR_NAME 	= 'My Redmine';

const User = {
    API_TOKEN  : 'api_token',
    API_URL    : 'api_url',
    getLastSelectedDate (): number {
        const savedData = PropertiesService.getUserProperties().getProperty(LAST_SELECTED_DATE_KEY);
        return Number(savedData);
    },
    setLastSelectedDate (newDate) {
        const dateToSave = typeof newDate === 'number' ? newDate.toString() : newDate;
        PropertiesService.getUserProperties().setProperty(LAST_SELECTED_DATE_KEY, dateToSave);
    },

    getRedmineApiUrl ():string  {
        const currentProperties = PropertiesService.getUserProperties();
        const savedApiUrl = currentProperties.getProperty(this.API_URL);

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

        if (encrypt) {
            const stringToCrypt = `${savedToken}:${new Date().getTime()}`;
            const encrypted     = Utilities.base64Encode(stringToCrypt);

            return returnAsHeader ? `Basic ${encrypted}` : encrypted;
        }
        return savedToken;
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
    }
};