// @TODO: Get the activities from service
interface IActivityResponse {
    id: number;
    name: string;
    is_default: boolean;
    active: boolean;
}

/**
 * Get the activity name based on its id
 */
function getActivityName(id): string {
    const activities = User.getUserActivities();
    const activity = activities.find(activity => activity.id === Number(id));

    if (activity) {
        return activity.name
    }

    return '';
}

/**
 * Get the activity id by its name
 */
function getActivityId(value): number {
    const activities = User.getUserActivities();
    const activity = activities.find(activity => activity.name === value);

    if (activity) {
        return activity.id
    }

    return 0;
}