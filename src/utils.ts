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