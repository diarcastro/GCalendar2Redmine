const USER_PROPERTIES_API_TOKEN_NAME = 'api_token';

/**
 * Homepage card
 *
 * @return The card to show to the user.
 */
function onHomepage(e: any): GoogleAppsScript.Card_Service.Card {
	const openEWSiteLink = CardService.newOpenLink().setUrl('https://evolvingweb.ca/?ref=GCalendar2Redmine');
	const textWidget = CardService.newTextParagraph().setText('This is an Add on created by: ');
	const imageWidget = CardService.newImage()
		.setAltText('Visit evolvingweb.ca')
		.setImageUrl('https://evolvingweb.ca/themes/custom/ewsite8/images/social-image.jpg')
		.setOpenLink(openEWSiteLink);
	const text2Widget = CardService.newTextParagraph().setText('Please select an event on your calendar. This event should be in a Calendar named <b>My Redmine</b>');

	const section = CardService.newCardSection()
		// .setHeader('About')
		// .setCollapsible(true)
		.addWidget(textWidget)
		.addWidget(imageWidget)
		.addWidget(text2Widget)
		;

	const currentProperties = PropertiesService.getUserProperties();
	const savedToken = currentProperties.getProperty(USER_PROPERTIES_API_TOKEN_NAME);

	const redmineTokenWidget = CardService.newTextInput()
		.setTitle('Redmine User API Token')
		.setValue(savedToken || '')
		.setHint('This token should be find it in the Redmine user account section')
		.setFieldName(USER_PROPERTIES_API_TOKEN_NAME);

	const onSaveUserConfigAction = CardService.newAction()
		.setMethodName('onSaveUserConfig');

	const saveUserConfigWIdget = CardService.newTextButton()
		.setText('Save')
		.setTextButtonStyle(CardService.TextButtonStyle.FILLED)
		.setOnClickAction(onSaveUserConfigAction);

	const apiSection = CardService.newCardSection()
		.setHeader('User Configuration')
		.setCollapsible(true)
		.addWidget(redmineTokenWidget)
		.addWidget(saveUserConfigWIdget)
		;

	const footer = CardService.newFixedFooter()
		.setPrimaryButton(
			CardService.newTextButton()
				.setText('Powered by evolvingweb.ca')
				.setOpenLink(openEWSiteLink));

	const card = CardService.newCardBuilder()
		.addSection(section)
		.addSection(apiSection)
		.setFixedFooter(footer);

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
