/**
 * Homepage card
 * Shows all the events that can be saved on Redmine
 *
 * @return The card to show to the user.
 */
function onHomepage(e: IHomepageTriggerEvent, timestamp: number = null): GoogleAppsScript.Card_Service.Card {
	const hasConfiguration	= User.getApiUrl();
	const calendarName 	   	= User.getCalendarName();
	const overwriteTitle 	= User.getOverwriteTitle();

	/* If there is no configuration sabed before it shows the configuration page */
	if(!hasConfiguration) {
		return onConfiguration();
	}

	const calendars = CalendarApp.getCalendarsByName(calendarName);
	const [ calendar ] = calendars;
	if (!calendar) {
		return createTextCard(`Please be sure you have a calendar named ${calendarName}`);
	}

	const offSet = e?.userTimezone?.offSet;

	const eventsData = {
		forSaving: {
			count: 0,
			totalHours: 0,
		},
		saved: {
			count: 0,
			totalHours: 0,
		},
		error: {
			count: 0,
			totalHours: 0,
		},
	};

	User.setLastSelectedDate(timestamp || '');

	const dateObject 	= timestamp ? new Date(timestamp) : new Date();
	const currentDate 	= Utils.getDateWithOffset(dateObject, timestamp ? 0 : offSet);
	const dateString 	= Utils.getDateForService(currentDate);

	const onChangeDateAction = CardService.newAction()
		.setFunctionName('onChangeDate')
		.setLoadIndicator(CardService.LoadIndicator.SPINNER);

	const dateInputWidget = CardService.newDatePicker()
		.setTitle('')
		.setFieldName('date')
		.setValueInMsSinceEpoch(currentDate.getTime())
		.setFieldName('eventsOnDate')
		.setOnChangeAction(onChangeDateAction);

	const calendarSection = CardService.newCardSection().setHeader('Select a Date')
		.addWidget(dateInputWidget);

	const calendarEvents 			= calendar.getEventsForDay(currentDate);
	const forSavingEventsSection	= CardService.newCardSection().setHeader('Events for saving');
	const savedEventsSection		= CardService.newCardSection().setHeader('Saved Events').setCollapsible(true);
	const onErrorEventsSection		= CardService.newCardSection().setHeader('Events with no Redmine ID').setCollapsible(true);
	const defaultSection			= CardService.newCardSection();
	let card 						= CardService.newCardBuilder().addSection(calendarSection).setName('HomeCard');

	if(calendarEvents && calendarEvents.length) {
		calendarEvents.forEach((event) => {
			const eventData = EventUtils.parseEvent(event);
			const {
				saved,
				issueId,
				title,
				hours,
				activity,
				description,
				issueUrl,
			} = eventData;

			const linkIssue = issueId ? `<a href="${issueUrl}" title="Go to Redmine to see the issue">${title}</a>` : title;
			let eventText = `${linkIssue}
<b>Hours: </b> ${hours}
<b>Activity: </b> ${activity}`;

			if (overwriteTitle) {
				const cleanDescription = Utils.cleanText(description, true);
				if (cleanDescription !== title) {
					eventText += `
<b>Comments: </b> ${cleanDescription}`
				}
			}
			const eventWidget = CardService.newTextParagraph().setText(eventText);

			if (issueId) {
				if (saved) {
					savedEventsSection.addWidget(eventWidget);
					eventsData.saved.count++;
					eventsData.saved.totalHours += hours;
				} else {
					forSavingEventsSection.addWidget(eventWidget);
					eventsData.forSaving.totalHours += hours;
					eventsData.forSaving.count++;
				}
			} else {
				onErrorEventsSection.addWidget(eventWidget);
				eventsData.error.totalHours += hours;
				eventsData.error.count++;
			}
		});
	} else {
		const noEventsWidget =  CardService.newTextParagraph().setText(`There are no events for the selected date ${dateString}`);
		defaultSection.addWidget(noEventsWidget);
		card.addSection(defaultSection);
	}


	if (eventsData.forSaving.count) {
		const totalHoursWidget = CardService.newTextParagraph().setText(`<font color="#0000FF"><b>Total Hours: ${eventsData.forSaving.totalHours}</b></font>`);
		forSavingEventsSection.addWidget(totalHoursWidget);
		card.addSection(forSavingEventsSection);

		const footerSection = CardService.newFixedFooter();

		const saveOnRedmineAction	= CardService.newAction()
			.setFunctionName('saveEventsOnRedmine');

		const saveButtonWidget 		= CardService.newTextButton()
			.setText(`Save ${eventsData.forSaving.count} items on Redmine`)
			.setTextButtonStyle(CardService.TextButtonStyle.FILLED)
			.setOnClickAction(saveOnRedmineAction);

		footerSection.setPrimaryButton(saveButtonWidget);

		// @ts-ignore // there is no documentation for the next method
		card.setFixedFooter(footerSection);
	}

	if (eventsData.saved.count) {
		const collapsible 		= eventsData.forSaving.count ? true : false;
		const totalHoursWidget 	= CardService.newTextParagraph().setText(`<font color="#46a909"><b>Total Hours: ${eventsData.saved.totalHours}</b></font>`);

		savedEventsSection.setCollapsible(collapsible);
		savedEventsSection.addWidget(totalHoursWidget);
		card.addSection(savedEventsSection);
	}

	if (eventsData.error.count) {
		const totalHoursWidget = CardService.newTextParagraph().setText(`<font color="#0000FF"><b>Total Hours: ${eventsData.error.totalHours}</b></font>`);
		onErrorEventsSection.addWidget(totalHoursWidget);
		card.addSection(onErrorEventsSection);
	}

	return card.build();
}
/**
 * Reload the current page in order to shows the events for the new selected date
 *
 * @param eventData
 */
function onChangeDate (eventData: IOnChangeDateEvent): GoogleAppsScript.Card_Service.Card {
	const { formInputs : { eventsOnDate =[] } = {} } = eventData;

	const date = eventsOnDate && eventsOnDate.length && eventsOnDate[0];
	const timestamp	= date && date.msSinceEpoch;

	const commonCard = onHomepage(eventData, timestamp);
	return CardService.newNavigation().updateCard(commonCard);
}
/**
 * Save all the events in the selected date on Redmine
 *
 * @param event Google form
 */
function saveEventsOnRedmine (event:ISaveEventOnRedmineEvent): GoogleAppsScript.Card_Service.Card {
	let responseMessage = '';
	const { formInputs : { eventsOnDate =[] } = {} } = event;

	const date = eventsOnDate && eventsOnDate.length && eventsOnDate[0];
	const timestamp	= date && date.msSinceEpoch;
	const overwriteTitle = User.getOverwriteTitle();

	try {
		const calendar 			= User.getRedmineCalendar();
		const dateObject 		= new Date(timestamp);
		const currentDate 		= Utils.getDateWithOffset(dateObject);
		const calendarEvents 	= calendar && calendar.getEventsForDay(currentDate);

		if (calendarEvents) {
			const eventsToSave = calendarEvents && calendarEvents.filter(event => {
				const { issueId, timeEntryId } = EventUtils.parseEvent(event);
				return issueId && !timeEntryId;
			}) || [];

			if (eventsToSave && eventsToSave.length) {
				const dataToSave = eventsToSave.map((event) => {
					const eventData = EventUtils.parseEvent(event);
					const {
						issueId,
						hours,
						activityId,
						title,
						description,
					} = eventData;

					const data = {};
					data['time_entry[issue_id]'] 	= issueId;
					data['time_entry[spent_on]'] 	= Utils.getDateForService(currentDate);
					data['time_entry[hours]'] 		= hours;
					data['time_entry[activity_id]'] = activityId;
					data['time_entry[comments]'] 	= overwriteTitle ? description : title;

					return data;
				});

				const timeEntries 		= redmineRequests.saveSpentTimeBatch(dataToSave);
				const realSavedEntries 	= timeEntries.reduce((acc, current) => acc + (current ? 1: 0), 0); // Sum the saved time entries
				const pluralString 		= realSavedEntries > 1 ? 'entries were' : 'entry was';
				responseMessage 		= `${realSavedEntries} ${pluralString} saved on Redmine.`;

				if (realSavedEntries !== timeEntries.length) {
					const timeEntriesDifference = timeEntries.length - realSavedEntries;
					const pluralString = timeEntriesDifference > 1 ? 'entries' : 'entry';
					responseMessage += `
NOTICE: ${timeEntriesDifference} ${pluralString} couldn't be saved!
Please check if the id is correct.`;
				}

				eventsToSave.forEach((event, index) => {
					const timeEntry = timeEntries[index];

					if (!timeEntry) {
						return false;
					}

					const eventData = EventUtils.parseEvent(event);
					const {
						activity,
					} = eventData;

					EventUtils.markAsSaved(event, timeEntry);
					event.setLocation(activity);
				});
			}
		}
	} catch(e) {
		Logger.log('Error saveEventsOnRedmine');
		Logger.log(e);
		responseMessage = 'Some time entries were not saved. Please try again!';
	}

	const homeCard = onHomepage(event, timestamp);
	const actionResponse = CardService.newActionResponseBuilder()
		.setNavigation(
			CardService.newNavigation()
				.popToRoot()
				.updateCard(homeCard)
		)
		.setStateChanged(true)
		.setNotification(
			CardService.newNotification().setText(responseMessage)
		)
		.build();

	return actionResponse;
}