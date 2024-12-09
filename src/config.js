require('dotenv').config();

module.exports = {
    db: {
        host: process.env.PGHOST,
        user: process.env.PGUSER,
        database: process.env.PGDATABASE,
        password: process.env.PGPASSWORD,
        port: parseInt(process.env.PGPORT, 10),
    },
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
        }
    }
};
