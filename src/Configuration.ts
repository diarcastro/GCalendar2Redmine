function onConfiguration () {
	const savedToken            = getRedmineApiToken();
	const redmineTokenWidget    = CardService.newTextInput()
		.setTitle('Redmine User API Token')
		.setValue(savedToken || '')
		.setHint('This token should be find it in the Redmine user account section')
		.setFieldName(USER_PROPERTIES_API_TOKEN_NAME);

	const onSaveUserConfigAction = CardService.newAction()
		.setMethodName('onSaveUserConfig');

	const apiLinkWIdget = CardService.newTextButton()
		.setText('Where can I find it?')
        .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
        .setOpenLink(
            CardService.newOpenLink().setUrl(`${REDMINE_API_URL}/my/api_key`)
        );

	const saveUserConfigWIdget = CardService.newTextButton()
		.setText('Save')
		.setTextButtonStyle(CardService.TextButtonStyle.FILLED)
		.setOnClickAction(onSaveUserConfigAction);

	const apiSection = CardService.newCardSection()
		.setHeader('Configuration')
		.setCollapsible(false)
		.addWidget(redmineTokenWidget)
		.addWidget(apiLinkWIdget)
		.addWidget(saveUserConfigWIdget)
		;

	const card = CardService.newCardBuilder()
        .addSection(apiSection);

	return card.build();
}

function onSaveUserConfig (e: any) {
	const apiToken = e.formInput[USER_PROPERTIES_API_TOKEN_NAME] || '';

	const currentProperties = PropertiesService.getUserProperties();
	currentProperties.setProperty(USER_PROPERTIES_API_TOKEN_NAME, apiToken);

	return CardService.newActionResponseBuilder()
	    .setNotification(CardService.newNotification()
	        .setText('User configuration was saved'))
	    .build();
}