const REDMINE_CALENDAR_NAME = 'My Redmine';
const DEFAULT_HOURS = '0.5';
const NEW_TIME_ENTRY_URL = 'https://rm.ewdev.ca/projects/operations/time_entries/new?';
const SAVED_ON_REDMINE_COLOR = '8'; // Gray  from https://developers.google.com/apps-script/reference/calendar/event-color
// const SAVED_ON_REDMINE_TAG = 'SAVED_ON_REDMINE'
const SAVED_ON_REDMINE_TEXT = '[SAVED] - ';

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
function onCalendarEventOpen(e: any): GoogleAppsScript.Card_Service.Card {
	const calendar = CalendarApp.getCalendarById(e?.calendar?.calendarId);
	const calendarName = calendar?.getName();

	if (calendarName !== REDMINE_CALENDAR_NAME) {
		return createTextCard(ERRORS.REDMINE_CALENDAR);
	}

	const event = calendar.getEventById(e?.calendar?.id);
	if (!event) {
		return createTextCard(ERRORS.NO_EVENT_CREATED);
	}

	const eventTitle = event.getTitle();
	const eventDescription = event.getDescription();
	const eventStartTime = event.getStartTime();
	const eventEndTime = event.getEndTime();
	const hours = timeDiff(eventStartTime, eventEndTime);

	const regexp = /(?<saved>\[SAVED\])*([ #]*)(?<issue>[0-9]*)([: ]+)(?<comments>.*)/igm;
	const matches = regexp.exec(eventTitle) as any;

	const issueId = matches?.groups?.issue || '#####';
	const issueDescription = matches?.groups?.comments || '';
	const issueSaved = matches?.groups?.saved || false;

	// @TODO: Verify is the event was already created on Redmine by using the API
	const isSaved = issueSaved? true : false; // event.getTag(SAVED_ON_REDMINE_TAG) ? true : false;

	const issueIdWidget = CardService.newTextInput().setTitle('Issue ID').setValue(issueId).setFieldName('issue_id');

	const issueDateWidget = CardService.newDatePicker()
		.setTitle('Issue Date')
		.setValueInMsSinceEpoch(eventStartTime.getTime())
		.setFieldName('spent_on');

	const issueHoursWidget = CardService.newTextInput()
		.setValue(hours.toString() || DEFAULT_HOURS)
		.setTitle('Hours')
		.setHint('e.g.: 2.5')
		.setFieldName('hours');

	const issueCommentsWidget = CardService.newTextInput()
		.setTitle('Comments')
		.setValue(eventDescription || issueDescription)
		.setHint('Type comments for the issue')
		.setFieldName('comments');

	const issueActivityWidget = CardService.newSelectionInput()
		.setTitle('Activity')
		.addItem('Content', '15', false)
		.addItem('Design', '8', false)
		.addItem('Development', '9', true)
		.addItem('Documentation', '23', false)
		.addItem('HR', '54', false)
		.addItem('Maintenance', '26', false)
		.addItem('Marketing', '49', false)
		.addItem('Operations', '52', false)
		.addItem('Other', '53', false)
		.addItem('Planning', '14', false)
		.addItem('Project', '18', false)
		.addItem('QA', '27', false)
		.addItem('Research', '11', false)
		.addItem('Themeing', '17', false)
		.addItem('Training', '22', false)
		.addItem('Emails', '50', false)
		.addItem('Copy', '51', false)
		.addItem('Module', '16', false)
		.addItem('Revisions', '29', false)
		.addItem('RFP', '110', false)
		.setType(CardService.SelectionInputType.DROPDOWN)
		.setFieldName('activity_id');

	const saveOnRedmineAction = CardService.newAction().setFunctionName('saveEventOnRedmine');
	const saveButtonWidget = CardService.newTextButton()
		.setText('Save on Redmine')
		.setTextButtonStyle(CardService.TextButtonStyle.FILLED)
		.setDisabled(isSaved)
		.setOnClickAction(saveOnRedmineAction);

	const section = CardService.newCardSection()
		.addWidget(issueIdWidget)
		.addWidget(issueDateWidget)
		.addWidget(issueHoursWidget)
		.addWidget(issueCommentsWidget)
		.addWidget(issueActivityWidget);

	const headerSection = CardService.newCardHeader()
		.setTitle(`${isSaved ? 'This time entry is already saved on Redmine':'New Redmine time entry for:'}`)
		.setSubtitle(eventTitle);
	const footerSection = CardService.newFixedFooter().setPrimaryButton(saveButtonWidget);

	const card = CardService.newCardBuilder()
		.setHeader(headerSection)
		.addSection(section)
		// @ts-ignore // there is no documentation for the next method
		.setFixedFooter(footerSection);
	return card.build();
}

function saveEventOnRedmine(e: any) {
	const SPENT_ON_FIELD = 'spent_on';
	const form = e.formInputs;
	const calendarEvent = getCalendarEvent(e.calendar);

	calendarEvent.setColor(SAVED_ON_REDMINE_COLOR);
	// calendarEvent.setTag(SAVED_ON_REDMINE_TAG, '');

	const calendarTitle = calendarEvent.getTitle();
	calendarEvent.setTitle(`${SAVED_ON_REDMINE_TEXT}${calendarTitle}`);

	let queryParams = '';

	Object.keys(form).forEach((key) => {
		const field = form[key];
		let fieldValue = field[0];

		if (key === SPENT_ON_FIELD) {
			const date = new Date(fieldValue.msSinceEpoch);
			const offset = date.getTimezoneOffset();
			date.setMinutes(date.getMinutes() + offset);
			fieldValue = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
		}
		queryParams += `time_entry[${key}]=${encodeURI(fieldValue)}&`;
	});

	const newTimeEntryUrl = `${NEW_TIME_ENTRY_URL}${queryParams}`;

	/* console.log('newTimeEntryUrl', newTimeEntryUrl);

	const requestHeaders = {
	  'Authorization': 'Basic ZGllZ28uY2FzdHJvOmUyODNUNioySTlrOXVTNiV1QXIhTkRQRGExaGI0IU9D'
	};

	const requestOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
	  contentType: 'application/json',
	  headers: requestHeaders
	};

	const fetchResponse = UrlFetchApp.fetch('https://rm.ewdev.ca/time_entries/84610.json', requestOptions);
	const body = fetchResponse.getContentText();

	console.log('BODY', body); */

	return CardService.newActionResponseBuilder()
		.setOpenLink(
			CardService.newOpenLink()
				.setUrl(newTimeEntryUrl)
				.setOpenAs(CardService.OpenAs.FULL_SIZE)
				.setOnClose(CardService.OnClose.RELOAD_ADD_ON)
		)
		.build();

	// return CardService.newActionResponseBuilder()
	//     .setNotification(CardService.newNotification()
	//         .setText('Redmine spent time was created!'))
	//     .build();
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