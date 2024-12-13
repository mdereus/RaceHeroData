const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const config = require('./config');

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

// Helper function to implement retry logic with timeout
async function retryOperation(operation, maxRetries = 20, timeout = 20000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Operation timed out')), timeout);
            });
            
            const result = await Promise.race([
                operation(),
                timeoutPromise
            ]);
            
            return result; // Success, return the result
        } catch (error) {
            lastError = error;
            console.log(`Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
            
            if (attempt < maxRetries) {
                // Wait before retrying, using exponential backoff
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError; // If all retries failed, throw the last error
}

async function downloadCsv(resultsUrl, runId) {
    try {
        const csvUrl = `${resultsUrl}.csv`;
        console.log(`Downloading CSV from: ${csvUrl}`);
        
        const downloadOperation = async () => {
            const response = await axios.get(csvUrl);
            
            // Save to csv directory with run ID as filename
            const outputDir = 'csv';
            await ensureDirectoryExists(outputDir);
            const filepath = path.join(outputDir, `${runId}.csv`);
            
            await fs.writeFile(filepath, response.data);
            console.log(`Saved CSV to ${filepath}`);
            
            return filepath;
        };

        await retryOperation(downloadOperation);
        // Removed the 1-second delay after download
    } catch (error) {
        console.error(`Error downloading CSV for run ${runId} after all retries:`, error.message);
        throw error;
    }
}

async function processAllCsvDownloads() {
    try {
        const filename = `${config.api.organization}AllEvents.json`;
        const filepath = path.join(config.api.jsonOutputDir, filename);
        
        if (await fileExists(filepath)) {
            const events = await readJsonFile(filepath);
            console.log(`Processing CSV downloads for ${events.length} events`);
            
            for (const event of events) {
                if (event.groups && Array.isArray(event.groups)) {
                    for (const group of event.groups) {
                        if (group.runs && Array.isArray(group.runs)) {
                            for (const run of group.runs) {
                                if (run.results_url) {
                                    await downloadCsv(run.results_url, run.id);
                                }
                            }
                        }
                    }
                }
            }
            
            console.log('Finished processing all CSV downloads');
        }
    } catch (error) {
        console.error('Error processing CSV downloads:', error);
        throw error;
    }
}

async function fetchAllEvents() {
    const filename = `${config.api.organization}AllEvents.json`;
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

async function processAllEventDetails(events) {
    try {
        console.log(`Processing ${events.length} events in batches`);
        const batchSize = 10; // Process 10 at a time to avoid overwhelming the system
        
        for (let i = 0; i < events.length; i += batchSize) {
            const batch = events.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(events.length/batchSize)}`);
            await Promise.all(batch.map(event => fetchEventDetails(event.id)));
        }
        
        console.log('Finished processing all event details');
    } catch (error) {
        console.error('Error processing event details:', error);
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

async function getAllEventIds() {
    const filename = 'gridlifeAllEvents.json';
    const filepath = path.join(config.api.jsonOutputDir, filename);
    
    try {
        if (await fileExists(filepath)) {
            const events = await readJsonFile(filepath);
            return events.map(event => event.id);
        }
        return [];
    } catch (error) {
        console.error('Error getting event IDs:', error);
        throw error;
    }
}

async function getEventAndGroupIds() {
    const filename = 'gridlifeAllEvents.json';
    const filepath = path.join(config.api.jsonOutputDir, filename);
    
    try {
        if (await fileExists(filepath)) {
            const events = await readJsonFile(filepath);
            const eventGroups = [];
            
            for (const event of events) {
                if (event.groups && Array.isArray(event.groups)) {
                    for (const group of event.groups) {
                        eventGroups.push({
                            event_id: event.id,
                            group_id: group.id
                        });
                    }
                }
            }
            
            return eventGroups;
        }
        return [];
    } catch (error) {
        console.error('Error getting event and group IDs:', error);
        throw error;
    }
}

async function processAllGroupDetails() {
    try {
        // Get event and group IDs from JSON file
        const eventGroups = await getEventAndGroupIds();
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
        // Get all event IDs from JSON file
        const eventIds = await getAllEventIds();
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
        // Get all event IDs from JSON file
        const eventIds = await getAllEventIds();
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
        // Get all event IDs from JSON file
        const eventIds = await getAllEventIds();
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
        // Get all event IDs from JSON file
        const eventIds = await getAllEventIds();
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
        // Get all event IDs from JSON file
        const eventIds = await getAllEventIds();
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
    processAllEventDetails,
    processAllGroupDetails,
    processAllEventRuns,
    processAllRunResults,
    processAllRunRacers,
    processAllRunFlags,
    processAllRunPassings,
    processAllCsvDownloads
};
