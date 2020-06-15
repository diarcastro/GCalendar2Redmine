function onOpen1() {
	const ui = SpreadsheetApp.getUi();
	ui.createMenu('Extra Options')
		.addItem('Get Calendar events', 'getCalendar')
		.addToUi();
}


function getCalendar1 () {
  const activeSpreadsheet = SpreadsheetApp.getActive();

  const spreadsheetName = activeSpreadsheet.getSheetName();
  const currentMonthParts = spreadsheetName.split('/');
  const currentMonth = currentMonthParts && currentMonthParts.length && (Number(currentMonthParts[0]) - 1);
  const currentYear = currentMonthParts && currentMonthParts.length > 0 && (Number(currentMonthParts[1]));

  const redmineCalendarName = 'Redmine';
  var calendars = CalendarApp.getOwnedCalendarsByName(redmineCalendarName);

  if (calendars.length) {
    const calendar = calendars[0];
    const currentDate = new Date(`${currentYear}-${currentMonth}-1`);
    const endDate = new Date(`${currentYear}-${currentMonth}-1`);
    endDate.setDate(0);

    Browser.msgBox(currentDate.toString() +'\n'+ endDate.toString());

    const events = calendar.getEvents(currentDate, endDate);

    if (events.length) {
      let eventsString = '';
      events.forEach( (event) => {
        const eventStartDate = event.getStartTime();
        const eventStartDateHour = eventStartDate.getHours() * 60;
        const eventStartDateMinutes = eventStartDateHour + eventStartDate.getMinutes();

        const eventEndDate = event.getEndTime();
        const eventEndDateHour = eventEndDate.getHours() * 60;
        const eventEndDateMinutes = eventEndDateHour + eventEndDate.getMinutes();

        const timeDiff = eventEndDateMinutes - eventStartDateMinutes;
        Browser.msgBox(`${event.getTitle()} ${timeDiff}`);
        eventsString += event.getTitle() + '\n';
      });

      Browser.msgBox(eventsString);
    }



  }
}