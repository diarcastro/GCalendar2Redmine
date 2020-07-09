const USER_PROPERTIES_API_TOKEN_NAME = 'api_token';
const REDMINE_API_URL = 'https://rm.ewdev.ca';

function getRedmineApiToken (encrypt: boolean = false, returnAsHeader:boolean =  false) {
    const currentProperties = PropertiesService.getUserProperties();
    const savedToken = currentProperties.getProperty(USER_PROPERTIES_API_TOKEN_NAME);

    if (encrypt) {
        const stringToCrypt = `${savedToken}:${new Date().getTime()}`;
        const encrypted     = Utilities.base64Encode(stringToCrypt);

        return returnAsHeader ? `Basic ${encrypted}` : encrypted;
    }

    return savedToken;
}