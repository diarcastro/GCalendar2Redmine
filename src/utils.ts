const enum TAGS {
    TIME_ENTRY_ID = 'TIME_ENTRY_ID',
};

const SAVED_ON_REDMINE_COLOR	= '8'; // Gray from https://developers.google.com/apps-script/reference/calendar/event-color
const DEFAULT_HOURS 			= 0.5;
const SAVED_ON_REDMINE_TEXT 	= '✅';

/**
 * Create a default card with a text
 *
 * @param text Text will be showed in the card
 */
function createTextCard(text: string): GoogleAppsScript.Card_Service.Card {
	const textWidget = CardService.newTextParagraph().setText(text);
	const section = CardService.newCardSection().addWidget(textWidget);
	const card = CardService.newCardBuilder().addSection(section);

	return card.build();
}

/**
 * Return the time between to dates in hours and fraction.
 * e.g. 2.5
 * Depends on parts variable
 *
 * @param date1 event start time
 * @param date2 event end date
 * @param parts How many parts to round the hours
 *
 * @returns The hour and its fraction
 */
function timeDiff(
	date1: GoogleAppsScript.Base.Date | Date,
	date2: GoogleAppsScript.Base.Date | Date,
	parts: number = 4
): number {
	const millisecondsDiff = date2.getTime() - date1.getTime();
	const totalHours = millisecondsDiff / 1000 / 3600;

	const hours = Math.floor(totalHours);
	const fraction = totalHours - hours;

	if (!fraction) return totalHours;

	const partUnit = 1 / parts;
	let roundedFraction = 0;

	for (let i = 0; i < parts; i++) {
		const currentPartUnit = partUnit * (i + 1);
		if (currentPartUnit >= fraction) {
			roundedFraction = currentPartUnit;
			break;
		}
	}

	return hours + roundedFraction;
}
const Utils = {

	getDateWithOffset (dateInitialized: GoogleAppsScript.Base.Date | Date  = null, offset: string | number = null): GoogleAppsScript.Base.Date | Date {
		const date = dateInitialized ||  new Date();
		const offsetNumber = Number(offset);
		const ofssetMinutes = offsetNumber ? offsetNumber / 1000 / 60 : false;
		const newOffset = ofssetMinutes || date.getTimezoneOffset();

		date.setMinutes(date.getMinutes() + newOffset);

		return date;
	},

	getDateForService (date): string {
		if (!date) {
			return '';
		}

		const month 		= date.getMonth() + 1;
		const day 			= date.getDate();
		const paddedMonth 	= month.toString().padStart(2, '0');
		const paddedday 	= day.toString().padStart(2, '0');

		return `${date.getFullYear()}-${paddedMonth}-${paddedday}`;
	},

	/**
	 * Verify if the string is a valid URL
	 *
	 * @param url Url to validate
	 * @internal from: https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url
	 */
	isURL (url) {
		const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
			'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
			'((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
			'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
			'(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
			'(\\#[-a-z\\d_]*)?$','i'); // fragment locator

		return !!pattern.test(url);
	},
	/**
	 * Remote tags from a text and truncate it
	 * @param text Text to clean and truncate
	 * @param truncate Is going the text to be truncated?
	 * @param maxStringLength Maximum number of character for the truncated text
	 */
	cleanText (text: string, truncate:boolean = false, maxStringLength:number = 200): string {
		const cleanText = text.replace(/<[^>]+>/g, "");

		if (!truncate) {
			return cleanText;
		}

		const truncatedText = cleanText.substr(0, maxStringLength);
		const ellipsis =  cleanText.length > maxStringLength ? '...' : '';
		return `${truncatedText}${ellipsis}`;
	}
}





const EventUtils 	= {

	parseEvent (event: GoogleAppsScript.Calendar.CalendarEvent): IEventData {
		if(!event) {
			return;
		}
		const eventTitle 		= event.getTitle();
		const eventDescription 	= event.getDescription();
		const eventStartTime 	= event.getStartTime();
		const eventEndTime 		= event.getEndTime();
		const defaultActivity 	= User.getDefaultActivity();
		const eventLocation 	= event.getLocation();
		const activityId 		= getActivityId(eventLocation) || defaultActivity;
		const regexp 			= /(?<saved>✅)*([ #-]*)(?<issue>[0-9]*)([: ]+)(?<title>.*)/igm;
		const matches 			= regexp.exec(eventTitle) as any;
		const issueId 			= matches?.groups?.issue || '';
		const title 			= matches?.groups?.title || '';
		const savedIcon 		= matches?.groups?.saved ? true :  false;
		const description		= eventDescription || title;
		const hours 			= timeDiff(eventStartTime, eventEndTime) || DEFAULT_HOURS;
		const timeEntryId 		= event.getTag(TAGS.TIME_ENTRY_ID) || null;

		const apiUrl			= User.getApiUrl();
		const issueUrl			= `${apiUrl}/issues/${issueId}`;

		return {
			saved : timeEntryId ? true : false,
			savedIcon,
			issueId,
			title,
			description,
			hours,
			timeEntryId,
			activity: eventLocation,
			activityId,
			issueUrl
		}
	},

	markAsSaved (event: GoogleAppsScript.Calendar.CalendarEvent, timeEntryId: string): GoogleAppsScript.Calendar.CalendarEvent {
		const calendarTitle = event.getTitle();
		const { savedIcon } = EventUtils.parseEvent(event);
		if (!savedIcon) {
			event.setTitle(`${SAVED_ON_REDMINE_TEXT}${calendarTitle}`);
		}
		event.setTag(TAGS.TIME_ENTRY_ID, timeEntryId);

		return event;
	}
};