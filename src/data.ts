// @TODO: Get the activities from service

const DEVELOPMENT_ACTIVITY = 'Development';
const ACTIVITIES = {
    'Content'       : 15,
    'Design'        : 8,
    'Development'   : 9,
    'Documentation' : 23,
    'HR'            : 54,
    'Maintenance'   : 26,
    'Marketing'     : 49,
    'Operations'    : 52,
    'Other'         : 53,
    'Planning'      : 14,
    'Project'       : 18,
    'QA'            : 27,
    'Research'      : 11,
    'Themeing'      : 17,
    'Training'      : 22,
    'Emails'        : 50,
    'Copy'          : 51,
    'Module'        : 16,
    'Revisions'     : 29,
    'RFP'           : 110,
};

function getActivityByValue (value) {
    const valueToFind = parseInt(value, 10);

    if(!valueToFind) {
        return false;
    }

    let keyToReturn = '';
    Object.keys(ACTIVITIES).forEach((key) => {
        const activity = ACTIVITIES[key];
        if (activity === valueToFind) {
            keyToReturn = key
        }
    });

    return keyToReturn;
}

function getActivityValue (keyToFind):number {
    let keyToReturn = 9;
    Object.keys(ACTIVITIES).forEach((key) => {
        if (key === keyToFind) {
            keyToReturn = ACTIVITIES[key]
        }
    });

    return keyToReturn;
}