function onConfiguration () {
	const savedToken            = User.getRedmineApiToken();
	const savedApiUrl			= User.getRedmineApiUrl();
	const redmineTokenWidget    = CardService.newTextInput()
		.setTitle('Redmine User API access key')
		.setValue(savedToken || '')
		.setHint('This token should be find it in the Redmine user account section')
		.setFieldName(User.API_TOKEN);

	const redmineApiUrlWidget    = CardService.newTextInput()
		.setTitle('Redmine API Server URL')
		.setValue(savedApiUrl || '')
		.setHint('e.g. https://my.redmine.com')
		.setFieldName(User.API_URL);

	const onSaveUserConfigAction = CardService.newAction()
		.setMethodName('onSaveUserConfig');

	// let apiLinkWidget = null;
	// if (savedApiUrl && Utils.isURL(savedApiUrl)) {
	// // 	apiLinkWidget = CardService.newTextButton()
	// // 		.setText('Where can I find it?')
	// // 		.setTextButtonStyle(CardService.TextButtonStyle.TEXT)
	// // 		.setOpenLink(
	// // 			CardService.newOpenLink().setUrl(`${savedApiUrl}/my/api_key`)
	// // 		);
	// }

	const saveUserConfigWIdget = CardService.newTextButton()
		.setText('Save')
		.setTextButtonStyle(CardService.TextButtonStyle.FILLED)
		.setOnClickAction(onSaveUserConfigAction);

	const apiSection = CardService.newCardSection()
		.setHeader('Configuration')
		.setCollapsible(false)
		.addWidget(redmineTokenWidget)
		.addWidget(redmineApiUrlWidget)
		;

	apiSection.addWidget(saveUserConfigWIdget);

	const card = CardService.newCardBuilder().addSection(apiSection);

	return card.build();
}

function onSaveUserConfig (e: any) {
	const apiToken = e.formInput[User.API_TOKEN] || '';
	const apiUrl = e.formInput[User.API_URL] || '';
	const isValidUrl = Utils.isURL(apiUrl);
	let errorMessage;

	const currentProperties = PropertiesService.getUserProperties();
	currentProperties.setProperty(User.API_TOKEN, apiToken);

	if (isValidUrl) {
		currentProperties.setProperty(User.API_URL, apiUrl);
	} else {
		currentProperties.setProperty(User.API_URL, '');
		errorMessage = 'but, Redmine API Server URL is not a valid URL. Please fix it.';
	}

	const message = `User configuration was saved ${errorMessage}`;

	return CardService.newActionResponseBuilder()
	    .setNotification(CardService.newNotification()
			.setText(message))
			.setStateChanged(true)
	    .build();
}