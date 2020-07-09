/**
 * Homepage card
 *
 * @return The card to show to the user.
 */
function onHomepage(e: any): GoogleAppsScript.Card_Service.Card {
	const text2Widget = CardService.newTextParagraph().setText('Please select an event on your calendar. This event should be in a Calendar named <b>My Redmine</b>');

	const section = CardService.newCardSection()
		.addWidget(text2Widget);

	const card = CardService.newCardBuilder()
		.addSection(section);

	return card.build();
}