const REDMINE_CALENDAR_NAME 	= 'My Redmine';
const DEFAULT_HOURS 			= '0.5';
const NEW_TIME_ENTRY_URL 		= 'https://rm.ewdev.ca/projects/operations/time_entries/new?';
const SAVED_ON_REDMINE_COLOR	= '8'; // Gray from https://developers.google.com/apps-script/reference/calendar/event-color
const SAVED_ON_REDMINE_TEXT 	= '✅';

/**
 * Some error messages
 */
const enum ERRORS {
	REDMINE_CALENDAR 		= 'Please select a calendar with name <b>My Redmine</b>',
	NO_EVENT_CREATED 		= 'The event should created before use this Add on',
	EVENT_IS_ALREADY_SAVED	= 'The current event is on Redmine already!',
}

/**
 * Shows the new time entry Redmine form
 *
 * @param The event object.
 * @return The card to show to the user.
 */
function onCalendarEventOpen(e: any, saved: boolean = false): GoogleAppsScript.Card_Service.Card {
	const calendar 		= CalendarApp.getCalendarById(e?.calendar?.calendarId);
	const calendarName 	= calendar?.getName();

	if (calendarName !== REDMINE_CALENDAR_NAME) {
		return createTextCard(ERRORS.REDMINE_CALENDAR);
	}

	const event = calendar.getEventById(e?.calendar?.id);
	if (!event) {
		return createTextCard(ERRORS.NO_EVENT_CREATED);
	}

	const eventTitle 		= event.getTitle();
	const eventDescription 	= event.getDescription();
	const eventStartTime 	= event.getStartTime();
	const eventEndTime 		= event.getEndTime();
	const hours 			= timeDiff(eventStartTime, eventEndTime);
	const regexp 			= /(?<saved>✅)*(\[(?<id>[0-9]*)\])*([ #-]*)(?<issue>[0-9]*)([: ]+)(?<comments>.*)/igm;
	const matches 			= regexp.exec(eventTitle) as any;
	const issueId 			= matches?.groups?.issue 	|| '#####';
	const issueDescription 	= matches?.groups?.comments || '';
	const issueSaved 		= matches?.groups?.saved 	|| false;
	const timeEntryId 		= matches?.groups?.id 		|| false;
	// @TODO: Verify is the event was already created on Redmine by using the API
	const isSaved 			= issueSaved ? true : false; // event.getTag(SAVED_ON_REDMINE_TAG) ? true : false;
	const issueIdWidget 	= CardService.newTextInput().setTitle('Issue ID').setValue(issueId).setFieldName('issue_id');
	const issueDateWidget 	= CardService.newDatePicker()
		.setTitle('Issue Date')
		.setValueInMsSinceEpoch(eventStartTime.getTime())
		.setFieldName('spent_on');
	const issueHoursWidget 	= CardService.newTextInput()
		.setValue(hours.toString() || DEFAULT_HOURS)
		.setTitle('Hours')
		.setHint('e.g.: 2.5')
		.setFieldName('hours');

	const issueCommentsWidget = CardService.newTextInput()
		.setTitle('Comments')
		.setValue(eventDescription || issueDescription)
		.setHint('Type comments for the issue')
		.setFieldName('comments');

	const eventActivity = event.getLocation() || DEVELOPMENT_ACTIVITY;
	const issueActivityWidget = CardService.newSelectionInput()
		.setTitle('Activity')
		.setType(CardService.SelectionInputType.DROPDOWN)
		.setFieldName('activity_id');

	Object.keys(ACTIVITIES).forEach((key: string) => {
		const activity = ACTIVITIES[key];
		issueActivityWidget.addItem(key, activity, key === eventActivity);
	});

	const section = CardService.newCardSection()
		.addWidget(issueIdWidget)
		.addWidget(issueDateWidget)
		.addWidget(issueHoursWidget)
		.addWidget(issueCommentsWidget)
		.addWidget(issueActivityWidget);

	const footerSection = CardService.newFixedFooter();

	if (timeEntryId) {
		const visitTimeEntryWidget = CardService.newTextButton()
			.setText('See on Redmine')
			.setTextButtonStyle(CardService.TextButtonStyle.TEXT)
			.setOpenLink(
				CardService.newOpenLink()
					.setUrl(`${REDMINE_API_URL}/time_entries/${timeEntryId}/edit`)
			);

		section.addWidget(visitTimeEntryWidget);
	} else {
		const saveOnRedmineAction	= CardService.newAction().setFunctionName('saveEventOnRedmine');
		const saveButtonWidget 		= CardService.newTextButton()
			.setText('Save on Redmine')
			.setTextButtonStyle(CardService.TextButtonStyle.FILLED)
			.setOnClickAction(saveOnRedmineAction);

		footerSection.setPrimaryButton(saveButtonWidget);
	}

	const headerSection = CardService.newCardHeader()
		.setTitle(`${isSaved ? 'This time entry is already saved on Redmine':'New Redmine time entry for:'}`)
		.setSubtitle(eventTitle);

	const card = CardService.newCardBuilder()
		.setHeader(headerSection)
		.addSection(section);

	if (!timeEntryId) {
		// @ts-ignore // there is no documentation for the next method
		card.setFixedFooter(footerSection);
	}
	return card.build();
}

interface ETimeEntry {
	issue_id?	: string;
	spent_on?	: string;
	hours?		: string;
	comments?	: string;
	activity_id?: string;
}

function saveEventOnRedmine(e: any) {
	const SPENT_ON_FIELD = 'spent_on';
	const form = e.formInputs;
	const formData:ETimeEntry = {};
	const data = {};

	Object.keys(form).forEach((key) => {
		const field = form[key];
		let fieldValue = field[0];

		if (key === SPENT_ON_FIELD) {
			const date = new Date(fieldValue.msSinceEpoch);
			const offset = date.getTimezoneOffset();
			date.setMinutes(date.getMinutes() + offset);
			const month = date.getMonth() + 1;
			const day = date.getDate();
			const paddedMonth 	= month.toString().padStart(2, '0');
			const paddedday 	= day.toString().padStart(2, '0');

			fieldValue = `${date.getFullYear()}-${paddedMonth}-${paddedday}`;
		}
		formData[key] = fieldValue;
		data[`time_entry[${key}]`] = fieldValue;
	});

	const timeEntryId 	= saveSpentTime(data);

	if (timeEntryId) {
		const calendarEvent = getCalendarEvent(e.calendar);

		calendarEvent.setColor(SAVED_ON_REDMINE_COLOR);

		const calendarTitle = calendarEvent.getTitle();
		const activity 		= getActivityByValue(formData.activity_id);
		calendarEvent.setTitle(`${SAVED_ON_REDMINE_TEXT}[${timeEntryId}]${calendarTitle}`);
		calendarEvent.setLocation(activity || '');

		// Update event description if the user edited the feld before saving
		if (calendarEvent.getTitle() !== formData.comments && calendarEvent.getDescription() !== formData.comments) {
			calendarEvent.setDescription(formData.comments);
		}

		return onCalendarEventOpen(e, true);
	}

	return CardService.newActionResponseBuilder()
		.setNotification(
			CardService.newNotification().setText('There was an error trying to ave the time entry')
		)
		.build();
}

/**
 * Get a calendar event
 *
 * @param event event or calendar data
 * @returns Calendar event
 */
function getCalendarEvent(calendarData: any): GoogleAppsScript.Calendar.CalendarEvent {
	const calendarId = calendarData && calendarData.calendarId;
	const calendar = CalendarApp.getCalendarById(calendarId);
	const eventId = calendarData && calendarData.id;

	return calendar && calendar.getEventById(eventId);
}