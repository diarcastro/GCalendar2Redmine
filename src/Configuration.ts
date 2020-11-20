function onConfiguration () {
	const savedToken	= User.getApiToken();
	const savedApiUrl	= User.getApiUrl();

	const redmineTokenWidget    = CardService.newTextInput()
		.setTitle('Redmine User API access key')
		.setValue(savedToken)
		.setHint('This token should be in the Redmine user account section. e.g. https://myredmine.com/my/api_key')
		.setFieldName(EUserProperty.API_TOKEN);

	const redmineApiUrlWidget    = CardService.newTextInput()
		.setTitle('Redmine API Server URL')
		.setValue(savedApiUrl)
		.setHint('e.g. https://my.redmine.com')
		.setFieldName(EUserProperty.API_URL);

	const onSaveUserConfigAction = CardService.newAction()
		.setFunctionName('onSaveUserConfig');

	const saveUserConfigWIdget = CardService.newTextButton()
		.setText('Save Configuration')
		.setTextButtonStyle(CardService.TextButtonStyle.FILLED)
		.setOnClickAction(onSaveUserConfigAction);

	const apiSection = CardService.newCardSection()
		.setHeader('Configuration')
		.setCollapsible(false)
		.addWidget(redmineTokenWidget)
		.addWidget(redmineApiUrlWidget)
		;

	const defaultCalendarName 	= User.getCalendarName();
	const calendarNameWidget	= CardService.newTextInput()
		.setTitle('Calendar Name')
		.setValue(defaultCalendarName)
		.setHint('Where your Redmine event will be located?')
		.setFieldName(EUserProperty.CALENDAR_NAME);

	const defaulOptionsSection = CardService
			.newCardSection()
			.setHeader('Default Options')
			.addWidget(calendarNameWidget);

	const serverActivities = redmineRequests.getActivities();
	if(serverActivities && serverActivities.length) {
		const userActivities = [];

		const defaultActivity 	= User.getDefaultActivity();
		const activitiesWidget 	= CardService.newSelectionInput()
			.setTitle('Default activity')
			.setFieldName(EUserProperty.DEFAULT_ACTIVITY)
			.setType(CardService.SelectionInputType.DROPDOWN);

		serverActivities.forEach(activity => {
			if (activity.active) {
				userActivities.push({id: activity.id, name: activity.name});
				let active = false;
				if (defaultActivity) {
					active = activity.id === Number(defaultActivity);
				} else {
					active = activity.is_default;
				}
				activitiesWidget.addItem(activity.name, activity.id, active);
			}
		});

		User.setUserActivities(userActivities);

		defaulOptionsSection.addWidget(activitiesWidget);
	}

	const overwriteTitle 		= User.getOverwriteTitle();
	console.log('overwriteTitle', overwriteTitle);
	const overwriteTitleWidget	= CardService.newSelectionInput()
		.setTitle('Time entry comment')
		.setFieldName(EUserProperty.OVERWRITE_TITLE)
		.setType(CardService.SelectionInputType.DROPDOWN)
		.addItem('Use title', '0', !overwriteTitle)
		.addItem('Use description if not empty', '1', overwriteTitle);

	defaulOptionsSection.addWidget(overwriteTitleWidget);


	const footerSection = CardService.newFixedFooter().setPrimaryButton(saveUserConfigWIdget);
	const card = CardService
		.newCardBuilder()
		.setName('Configuration')
		.addSection(apiSection)
		.addSection(defaulOptionsSection);
	// @ts-ignore // there is no documentation for the next method
	card.setFixedFooter(footerSection);
	return card.build();
}

function onSaveUserConfig (e: IOnSaveUserConfigEvent) {
	const apiToken 			= e.formInput[EUserProperty.API_TOKEN] || '';
	const apiUrl 			= e.formInput[EUserProperty.API_URL] || '';
	const defaultActivity 	= e.formInput[EUserProperty.DEFAULT_ACTIVITY] || '';
	const calendarName 		= e.formInput[EUserProperty.CALENDAR_NAME] || '';
	const overwriteTitle 	= e.formInput[EUserProperty.OVERWRITE_TITLE] || '';
	const isValidUrl 		= Utils.isURL(apiUrl);
	let errorMessage 		= '';
	let errorState 			= false;

	console.log(e.formInput, overwriteTitle);
	User.setProperty(EUserProperty.API_TOKEN, apiToken);
	User.setOverwriteTitle(overwriteTitle);

	if(defaultActivity) {
		User.setProperty(EUserProperty.DEFAULT_ACTIVITY, defaultActivity);
	}

	if(calendarName) {
		User.setProperty(EUserProperty.CALENDAR_NAME, calendarName);
	}

	if (isValidUrl) {
		User.setProperty(EUserProperty.API_URL, apiUrl);
	} else {
		User.setProperty(EUserProperty.API_URL, '');
		errorState = true;
		errorMessage = 'but, Redmine API Server URL is not a valid URL. Please fix it.';
	}

	const message 	 	 = `User configuration was saved ${errorMessage}`;
	const actionResponse = CardService.newActionResponseBuilder();

	if (!errorState) {
		const updatedCard = onConfiguration();
		const navigation =  CardService.newNavigation()
			.updateCard(updatedCard);
		actionResponse.setNavigation(navigation);
	}
	return actionResponse
	    .setNotification(
			CardService.newNotification().setText(message)
		)
		.setStateChanged(true)
	    .build();
}