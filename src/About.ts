function onAbout() {
    const openEWSiteLink = CardService.newOpenLink().setUrl('https://evolvingweb.ca/?ref=GCalendar2Redmine');
	const textWidget = CardService.newTextParagraph().setText('This is an Add-on created by: ');
	const imageWidget = CardService.newImage()
		.setAltText('Visit evolvingweb.ca')
		.setImageUrl('https://evolvingweb.ca/themes/custom/ewsite8/images/social-image.jpg')
		.setOpenLink(openEWSiteLink);

	const section = CardService.newCardSection()
		.addWidget(textWidget)
		.addWidget(imageWidget)
		;

	const footer = CardService.newFixedFooter()
		.setPrimaryButton(
			CardService.newTextButton()
				.setText('Powered by evolvingweb.ca')
				.setOpenLink(openEWSiteLink));

	const card = CardService.newCardBuilder()
		.addSection(section)
		// @ts-ignore // there is no documentation for the next method
		.setFixedFooter(footer);

	return card.build();
}