const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const config = require('./config');
const db = require('./db');

// Create axios instance with auth configuration
const api = axios.create({
    auth: config.api.auth,
    baseURL: config.api.baseUrl
});

async function ensureDirectoryExists(directory) {
    try {
        await fs.access(directory);
    } catch {
        await fs.mkdir(directory, { recursive: true });
    }
}

async function saveJsonToFile(data, filename) {
    const outputDir = config.api.jsonOutputDir;
    await ensureDirectoryExists(outputDir);
    const filepath = path.join(outputDir, filename);
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
    console.log(`Saved data to ${filepath}`);
    return filepath;
}

async function fetchAllEvents() {
    try {
        const url = `/organizations/${config.api.organization}/events?limit=999&offset=0&expand=org,venue,groups`;
        console.log(`Fetching events from: ${config.api.baseUrl}${url}`);
        
        const response = await api.get(url);
        await saveJsonToFile(response.data.data, 'gridlifeAllEvents.json');
        return response.data.data;
    } catch (error) {
        console.error('Error fetching all events:', error.message);
        throw error;
    }
}

async function fetchEventDetails(eventId) {
    try {
        const url = `/events/${eventId}?expand=org,venue,groups`;
        console.log(`Fetching event details for ID ${eventId} from: ${config.api.baseUrl}${url}`);
        
        const response = await api.get(url);
        await saveJsonToFile(response.data, `event_${eventId}.json`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching event details for ID ${eventId}:`, error.message);
        throw error;
    }
}

async function fetchGroupDetails(eventId, groupId) {
    try {
        const url = `/events/${eventId}/groups/${groupId}`;
        console.log(`Fetching group details for event ${eventId}, group ${groupId} from: ${config.api.baseUrl}${url}`);
        
        const response = await api.get(url);
        await saveJsonToFile(response.data, `event_${eventId}_group_${groupId}.json`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching group details for event ${eventId}, group ${groupId}:`, error.message);
        throw error;
    }
}

async function processAllGroupDetails() {
    try {
        // Get event and group IDs from database
        const eventGroups = await db.getEventAndGroupIds();
        console.log(`Found ${eventGroups.length} event-group combinations to process`);

        for (const { event_id, group_id } of eventGroups) {
            console.log(`Processing event ${event_id}, group ${group_id}`);
            await fetchGroupDetails(event_id, group_id);
            
            // Add a small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('Finished processing all group details');
    } catch (error) {
        console.error('Error processing group details:', error);
        throw error;
    }
}

module.exports = {
    fetchAllEvents,
    fetchEventDetails,
    fetchGroupDetails,
    processAllGroupDetails
};
