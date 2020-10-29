interface IUserTimeZone {
	id: string;
	offSet: string | number;
}

interface IBaseEventCalendarCapabilities {
	canSeeAttendees: boolean;
	canSeeConferenceData: boolean;
}

interface IBaseEventCalendarOrganizer {
	email: string;
}

interface IBaseEventCalendar {
	calendarId: string;
	capabilities: IBaseEventCalendarCapabilities;
	id: string;
	organizer: IBaseEventCalendarOrganizer;
}

interface ICommonEventObject {
	hostApp: string;
	platform: string;
	timeZone: IUserTimeZone;
	userLocale: string;
}

interface ICommonEventProperties {
	calendar: IBaseEventCalendar;
	clientPlatform: string;
	commonEventObject: ICommonEventObject;
	hostApp: string;
	userCountry: string;
	userLocale: string;
	userTimezone: IUserTimeZone;
}

interface IHomepageTriggerEvent extends ICommonEventProperties {}

interface IEventOpenTriggerEvent extends ICommonEventProperties {}

interface IOnChangeDateEvent extends ICommonEventProperties {
	parameters: { [key: string]: string };
	formInput: any;
	formInputs: { eventsOnDate: { msSinceEpoch: number }[] };
}

interface ISaveEventOnRedmineEvent extends IOnChangeDateEvent {}

interface IOnSaveUserConfigEventFormInput {
	api_token: string;
	api_url: string;
	default_activity: string;
	calendar_name: string;
}

interface IOnSaveUserConfigEvent extends IOnChangeDateEvent {
	formInput: IOnSaveUserConfigEventFormInput;
}

interface IActivityResponse {
	id: number;
	name: string;
	is_default: boolean;
	active: boolean;
}

/**
 * Time entry data than accepts the Redmine API
 */
interface ETimeEntry {
	issue_id?: string;
	spent_on?: string;
	hours?: string;
	comments?: string;
	activity_id?: string;
}

interface IEventData {
	saved		: boolean;
	savedIcon	: boolean;
	issueId		: string;
	title		: string;
	description	: string;
	hours		: number;
	timeEntryId	: string;
	activity	: string;
	activityId	: number;
	issueUrl?	: string;
}