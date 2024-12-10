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

async function fileExists(filepath) {
    try {
        await fs.access(filepath);
        return true;
    } catch {
        return false;
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

async function readJsonFile(filepath) {
    const content = await fs.readFile(filepath, 'utf8');
    return JSON.parse(content);
}

async function fetchAllEvents() {
    const filename = 'gridlifeAllEvents.json';
    const filepath = path.join(config.api.jsonOutputDir, filename);
    
    try {
        // Check if file exists and force download is false
        if (!config.api.forceDownload && await fileExists(filepath)) {
            console.log(`Using existing file: ${filepath}`);
            const data = await readJsonFile(filepath);
            return data;
        }

        const url = `/organizations/${config.api.organization}/events?limit=999&offset=0&expand=org,venue,groups`;
        console.log(`Fetching events from: ${config.api.baseUrl}${url}`);
        
        const response = await api.get(url);
        await saveJsonToFile(response.data.data, filename);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay only after API call
        return response.data.data;
    } catch (error) {
        console.error('Error fetching all events:', error.message);
        throw error;
    }
}

async function fetchEventDetails(eventId) {
    const filename = `event_${eventId}.json`;
    const filepath = path.join(config.api.jsonOutputDir, filename);
    
    try {
        // Check if file exists and force download is false
        if (!config.api.forceDownload && await fileExists(filepath)) {
            console.log(`Using existing file: ${filepath}`);
            return await readJsonFile(filepath);
        }

        const url = `/events/${eventId}?expand=org,venue,groups`;
        console.log(`Fetching event details for ID ${eventId} from: ${config.api.baseUrl}${url}`);
        
        const response = await api.get(url);
        await saveJsonToFile(response.data, filename);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay only after API call
        return response.data;
    } catch (error) {
        console.error(`Error fetching event details for ID ${eventId}:`, error.message);
        throw error;
    }
}

async function fetchGroupDetails(eventId, groupId) {
    const filename = `event_${eventId}_group_${groupId}.json`;
    const filepath = path.join(config.api.jsonOutputDir, filename);
    
    try {
        // Check if file exists and force download is false
        if (!config.api.forceDownload && await fileExists(filepath)) {
            console.log(`Using existing file: ${filepath}`);
            return await readJsonFile(filepath);
        }

        const url = `/events/${eventId}/groups/${groupId}`;
        console.log(`Fetching group details for event ${eventId}, group ${groupId} from: ${config.api.baseUrl}${url}`);
        
        const response = await api.get(url);
        await saveJsonToFile(response.data, filename);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay only after API call
        return response.data;
    } catch (error) {
        console.error(`Error fetching group details for event ${eventId}, group ${groupId}:`, error.message);
        throw error;
    }
}

async function fetchEventRuns(eventId) {
    const filename = `event_${eventId}_runs.json`;
    const filepath = path.join(config.api.jsonOutputDir, filename);
    
    try {
        // Check if file exists and force download is false
        if (!config.api.forceDownload && await fileExists(filepath)) {
            console.log(`Using existing file: ${filepath}`);
            return await readJsonFile(filepath);
        }

        const url = `/events/${eventId}/runs`;
        console.log(`Fetching runs for event ${eventId} from: ${config.api.baseUrl}${url}`);
        
        const response = await api.get(url);
        await saveJsonToFile(response.data, filename);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay only after API call
        return response.data;
    } catch (error) {
        console.error(`Error fetching runs for event ${eventId}:`, error.message);
        throw error;
    }
}

async function fetchRunResults(eventId, runId) {
    const filename = `event_${eventId}_run_${runId}_results.json`;
    const filepath = path.join(config.api.jsonOutputDir, filename);
    
    try {
        // Check if file exists and force download is false
        if (!config.api.forceDownload && await fileExists(filepath)) {
            console.log(`Using existing file: ${filepath}`);
            return await readJsonFile(filepath);
        }

        const url = `/events/${eventId}/runs/${runId}/results?expand=laps,flags,notes`;
        console.log(`Fetching results for event ${eventId}, run ${runId} from: ${config.api.baseUrl}${url}`);
        
        const response = await api.get(url);
        await saveJsonToFile(response.data, filename);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay only after API call
        return response.data;
    } catch (error) {
        console.error(`Error fetching results for event ${eventId}, run ${runId}:`, error.message);
        throw error;
    }
}

async function fetchRunRacers(eventId, runId) {
    const filename = `event_${eventId}_run_${runId}_racers.json`;
    const filepath = path.join(config.api.jsonOutputDir, filename);
    
    try {
        // Check if file exists and force download is false
        if (!config.api.forceDownload && await fileExists(filepath)) {
            console.log(`Using existing file: ${filepath}`);
            return await readJsonFile(filepath);
        }

        const url = `/events/${eventId}/runs/${runId}/racers`;
        console.log(`Fetching racers for event ${eventId}, run ${runId} from: ${config.api.baseUrl}${url}`);
        
        const response = await api.get(url);
        await saveJsonToFile(response.data, filename);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay only after API call
        return response.data;
    } catch (error) {
        console.error(`Error fetching racers for event ${eventId}, run ${runId}:`, error.message);
        throw error;
    }
}

async function fetchRunFlags(eventId, runId) {
    const filename = `event_${eventId}_run_${runId}_flags.json`;
    const filepath = path.join(config.api.jsonOutputDir, filename);
    
    try {
        // Check if file exists and force download is false
        if (!config.api.forceDownload && await fileExists(filepath)) {
            console.log(`Using existing file: ${filepath}`);
            return await readJsonFile(filepath);
        }

        const url = `/events/${eventId}/runs/${runId}/flags`;
        console.log(`Fetching flags for event ${eventId}, run ${runId} from: ${config.api.baseUrl}${url}`);
        
        const response = await api.get(url);
        await saveJsonToFile(response.data, filename);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay only after API call
        return response.data;
    } catch (error) {
        console.error(`Error fetching flags for event ${eventId}, run ${runId}:`, error.message);
        throw error;
    }
}

async function fetchRunPassings(eventId, runId) {
    const filename = `event_${eventId}_run_${runId}_passings.json`;
    const filepath = path.join(config.api.jsonOutputDir, filename);
    
    try {
        // Check if file exists and force download is false
        if (!config.api.forceDownload && await fileExists(filepath)) {
            console.log(`Using existing file: ${filepath}`);
            return await readJsonFile(filepath);
        }

        const url = `/events/${eventId}/runs/${runId}/passings`;
        console.log(`Fetching passings for event ${eventId}, run ${runId} from: ${config.api.baseUrl}${url}`);
        
        const response = await api.get(url);
        await saveJsonToFile(response.data, filename);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay only after API call
        return response.data;
    } catch (error) {
        console.error(`Error fetching passings for event ${eventId}, run ${runId}:`, error.message);
        throw error;
    }
}

async function processAllGroupDetails() {
    try {
        // Get event and group IDs from database
        const eventGroups = await db.getEventAndGroupIds();
        console.log(`Found ${eventGroups.length} event-group combinations to process`);

        // Process in parallel when using existing files
        const batchSize = 10; // Process 10 at a time to avoid overwhelming the system
        for (let i = 0; i < eventGroups.length; i += batchSize) {
            const batch = eventGroups.slice(i, i + batchSize);
            await Promise.all(batch.map(({ event_id, group_id }) => 
                fetchGroupDetails(event_id, group_id)
            ));
        }

        console.log('Finished processing all group details');
    } catch (error) {
        console.error('Error processing group details:', error);
        throw error;
    }
}

async function processAllEventRuns() {
    try {
        // Get all event IDs from database
        const eventIds = await db.getAllEventIds();
        console.log(`Found ${eventIds.length} events to process runs for`);

        // Process in parallel when using existing files
        const batchSize = 10; // Process 10 at a time to avoid overwhelming the system
        for (let i = 0; i < eventIds.length; i += batchSize) {
            const batch = eventIds.slice(i, i + batchSize);
            await Promise.all(batch.map(eventId => fetchEventRuns(eventId)));
        }

        console.log('Finished processing all event runs');
    } catch (error) {
        console.error('Error processing event runs:', error);
        throw error;
    }
}

async function processAllRunResults() {
    try {
        // Get all event IDs from database
        const eventIds = await db.getAllEventIds();
        console.log(`Found ${eventIds.length} events to process results for`);

        for (const eventId of eventIds) {
            // Get runs for this event
            const runsFilename = `event_${eventId}_runs.json`;
            const runsFilepath = path.join(config.api.jsonOutputDir, runsFilename);
            
            if (await fileExists(runsFilepath)) {
                const runsData = await readJsonFile(runsFilepath);
                if (runsData && Array.isArray(runsData)) {
                    console.log(`Processing ${runsData.length} runs for event ${eventId}`);
                    
                    // Process in parallel when using existing files
                    const batchSize = 10; // Process 10 at a time to avoid overwhelming the system
                    for (let i = 0; i < runsData.length; i += batchSize) {
                        const batch = runsData.slice(i, i + batchSize);
                        await Promise.all(batch.map(run => 
                            fetchRunResults(eventId, run.id)
                        ));
                    }
                }
            } else {
                console.log(`No runs file found for event ${eventId}`);
            }
        }

        console.log('Finished processing all run results');
    } catch (error) {
        console.error('Error processing run results:', error);
        throw error;
    }
}

async function processAllRunRacers() {
    try {
        // Get all event IDs from database
        const eventIds = await db.getAllEventIds();
        console.log(`Found ${eventIds.length} events to process racers for`);

        for (const eventId of eventIds) {
            // Get runs for this event
            const runsFilename = `event_${eventId}_runs.json`;
            const runsFilepath = path.join(config.api.jsonOutputDir, runsFilename);
            
            if (await fileExists(runsFilepath)) {
                const runsData = await readJsonFile(runsFilepath);
                if (runsData && Array.isArray(runsData)) {
                    console.log(`Processing ${runsData.length} runs for event ${eventId}`);
                    
                    // Process in parallel when using existing files
                    const batchSize = 10; // Process 10 at a time to avoid overwhelming the system
                    for (let i = 0; i < runsData.length; i += batchSize) {
                        const batch = runsData.slice(i, i + batchSize);
                        await Promise.all(batch.map(run => 
                            fetchRunRacers(eventId, run.id)
                        ));
                    }
                }
            } else {
                console.log(`No runs file found for event ${eventId}`);
            }
        }

        console.log('Finished processing all run racers');
    } catch (error) {
        console.error('Error processing run racers:', error);
        throw error;
    }
}

async function processAllRunFlags() {
    try {
        // Get all event IDs from database
        const eventIds = await db.getAllEventIds();
        console.log(`Found ${eventIds.length} events to process flags for`);

        for (const eventId of eventIds) {
            // Get runs for this event
            const runsFilename = `event_${eventId}_runs.json`;
            const runsFilepath = path.join(config.api.jsonOutputDir, runsFilename);
            
            if (await fileExists(runsFilepath)) {
                const runsData = await readJsonFile(runsFilepath);
                if (runsData && Array.isArray(runsData)) {
                    console.log(`Processing ${runsData.length} runs for event ${eventId}`);
                    
                    // Process in parallel when using existing files
                    const batchSize = 10; // Process 10 at a time to avoid overwhelming the system
                    for (let i = 0; i < runsData.length; i += batchSize) {
                        const batch = runsData.slice(i, i + batchSize);
                        await Promise.all(batch.map(run => 
                            fetchRunFlags(eventId, run.id)
                        ));
                    }
                }
            } else {
                console.log(`No runs file found for event ${eventId}`);
            }
        }

        console.log('Finished processing all run flags');
    } catch (error) {
        console.error('Error processing run flags:', error);
        throw error;
    }
}

async function processAllRunPassings() {
    try {
        // Get all event IDs from database
        const eventIds = await db.getAllEventIds();
        console.log(`Found ${eventIds.length} events to process passings for`);

        for (const eventId of eventIds) {
            // Get runs for this event
            const runsFilename = `event_${eventId}_runs.json`;
            const runsFilepath = path.join(config.api.jsonOutputDir, runsFilename);
            
            if (await fileExists(runsFilepath)) {
                const runsData = await readJsonFile(runsFilepath);
                if (runsData && Array.isArray(runsData)) {
                    console.log(`Processing ${runsData.length} runs for event ${eventId}`);
                    
                    // Process in parallel when using existing files
                    const batchSize = 10; // Process 10 at a time to avoid overwhelming the system
                    for (let i = 0; i < runsData.length; i += batchSize) {
                        const batch = runsData.slice(i, i + batchSize);
                        await Promise.all(batch.map(run => 
                            fetchRunPassings(eventId, run.id)
                        ));
                    }
                }
            } else {
                console.log(`No runs file found for event ${eventId}`);
            }
        }

        console.log('Finished processing all run passings');
    } catch (error) {
        console.error('Error processing run passings:', error);
        throw error;
    }
}

module.exports = {
    fetchAllEvents,
    fetchEventDetails,
    fetchGroupDetails,
    fetchEventRuns,
    fetchRunResults,
    fetchRunRacers,
    fetchRunFlags,
    fetchRunPassings,
    processAllGroupDetails,
    processAllEventRuns,
    processAllRunResults,
    processAllRunRacers,
    processAllRunFlags,
    processAllRunPassings
};
