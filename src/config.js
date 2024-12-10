require('dotenv').config();

module.exports = {
    api: {
        baseUrl: process.env.API_BASE_URL,
        organization: process.env.ORGANIZATION,
        jsonOutputDir: process.env.JSON_OUTPUT_DIR,
        auth: {
            username: process.env.API_USERNAME,
            password: process.env.API_PASSWORD || ''
        },
        endpoints: {
            events: process.env.EVENTS_ENDPOINT,
            eventDetails: process.env.EVENT_DETAILS_ENDPOINT,
        },
        forceDownload: process.env.FORCE_DOWNLOAD === 'true'
    }
};
