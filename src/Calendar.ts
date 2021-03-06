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
 * This is triggered when a user selects an event in the calendar
 * In this card we could save the current event to Redmine and also we could visit saved time logs on Redmine
 *
 * @param The event object.
 * @return The card to show to the user.
 */
function onCalendarEventOpen(e: IEventOpenTriggerEvent): GoogleAppsScript.Card_Service.Card {
	const calendar 		= CalendarApp.getCalendarById(e?.calendar?.calendarId);
	const calendarName 	= calendar?.getName();

	if (calendarName !== User.getCalendarName()) {
		return createTextCard(ERRORS.REDMINE_CALENDAR);
	}

	const event = calendar.getEventById(e?.calendar?.id);
	if (!event) {
		return createTextCard(ERRORS.NO_EVENT_CREATED);
	}

	const eventData = EventUtils.parseEvent(event);
	const {
		issueId,
		title,
		description,
		hours,
		timeEntryId,
	} = eventData;

	const issueIdWidget 	= CardService.newTextInput().setTitle('Issue ID').setValue(issueId).setFieldName('issue_id');
	const issueHoursWidget 	= CardService.newTextInput()
		.setValue(hours.toString())
		.setTitle('Hours')
		.setHint('e.g.: 2.5')
		.setFieldName('hours');

	const issueCommentsWidget = CardService.newTextInput()
		.setTitle('Comments')
		.setValue(description)
		.setHint('Type comments for the issue')
		.setFieldName('comments');

	const eventActivity = event.getLocation();
	const issueActivityWidget = CardService.newSelectionInput()
		.setTitle('Activity')
		.setType(CardService.SelectionInputType.DROPDOWN)
		.setFieldName('activity_id');

	const activities = User.getUserActivities();
	const defaultActivity = User.getDefaultActivity();
	activities.forEach(activity => {
		const active = eventActivity ? activity.name === eventActivity : activity.id === Number(defaultActivity);
		issueActivityWidget.addItem(activity.name, activity.id, active);
	});

	const section = CardService.newCardSection()
		.addWidget(issueIdWidget)
		.addWidget(issueHoursWidget)
		.addWidget(issueCommentsWidget)
		.addWidget(issueActivityWidget);

	const footerSection = CardService.newFixedFooter();

	if (timeEntryId) {
		const apiUrl 				= User.getApiUrl();
		const visitTimeEntryWidget 	= CardService.newTextButton()
			.setText('See on Redmine')
			.setTextButtonStyle(CardService.TextButtonStyle.TEXT)
			.setOpenLink(
				CardService.newOpenLink()
					.setUrl(`${apiUrl}/time_entries/${timeEntryId}/edit`)
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
		.setTitle(`${timeEntryId ? 'This time entry is already saved on Redmine':'New Redmine time entry for:'}`)
		.setSubtitle(title);

	const card = CardService.newCardBuilder().setName('onCalendarEventOpen')
		.setHeader(headerSection)
		.addSection(section);

	if (!timeEntryId) {
		// @ts-ignore // there is no documentation for the next method
		card.setFixedFooter(footerSection);
	}
	return card.build();
}

/**
 * Save the current event on Redmine
 *
 * @param e Current form data
 */
function saveEventOnRedmine(e: ISaveEventOnRedmineEvent) {
	const calendarEvent 	= getCalendarEvent(e.calendar);
	const eventDate 		= calendarEvent.getStartTime();
	const SPENT_ON_FIELD 	= 'spent_on';
	const form 				= e.formInputs;
	const data 				= {};
	const formData:ETimeEntry = {};

	form[SPENT_ON_FIELD] = [eventDate];

	Object.keys(form).forEach((key) => {
		const field = form[key];
		let fieldValue = field[0];

		if (key === SPENT_ON_FIELD) {
			fieldValue = Utils.getDateForService(fieldValue);
		}
		formData[key] = fieldValue;
		data[`time_entry[${key}]`] = fieldValue;
	});

	const timeEntryId = redmineRequests.saveSpentTime(data);

	if (timeEntryId) {
		EventUtils.markAsSaved(calendarEvent, timeEntryId);
		const activity = getActivityName(formData.activity_id);
		calendarEvent.setLocation(activity || '');

		/* Update event description if the user edited the feld before saving */
		if (calendarEvent.getTitle() !== formData.comments && calendarEvent.getDescription() !== formData.comments) {
			calendarEvent.setDescription(formData.comments);
		}

		EventUtils.markAsSaved(calendarEvent, timeEntryId);
		const homeCard = onHomepage(e, User.getLastSelectedDate());
		const actionResponse = CardService.newActionResponseBuilder()
			.setNavigation(
				CardService.newNavigation()
					.popToRoot()
					.updateCard(homeCard)
			)
			.setStateChanged(true)
			.setNotification(
				CardService.newNotification().setText('The time entry was saved!')
			)
			.build();

		return actionResponse;
	}

	return CardService.newActionResponseBuilder()
		.setNotification(
			CardService.newNotification().setText('There was an error trying to save the time entry')
		)
		.build();
}

/**
 * Get a calendar event
 *
 * @param event event or calendar data
 * @returns Calendar event
 */
function getCalendarEvent(calendarData: IBaseEventCalendar): GoogleAppsScript.Calendar.CalendarEvent {
	const calendarId = calendarData && calendarData.calendarId;
	const calendar = CalendarApp.getCalendarById(calendarId);
	const eventId = calendarData && calendarData.id;

	return calendar && calendar.getEventById(eventId);
}