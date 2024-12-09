const { fetchAllEvents, fetchEventDetails, processAllGroupDetails } = require('./api');
const { initializeDatabase, insertEvent } = require('./db');
const fs = require('fs').promises;
const path = require('path');
const config = require('./config');

async function processEvents() {
    try {
        // Initialize database
        await initializeDatabase();
        console.log('Database initialized');

        // Fetch and save all events
        console.log('Fetching all events...');
        const events = await fetchAllEvents();
        console.log(`Found ${events.length} events to process`);

        // Fetch and save individual event details
        console.log('Fetching individual event details...');
        for (const event of events) {
            console.log(`Processing event ID: ${event.id}`);
            const eventData = await fetchEventDetails(event.id);
            
            // Import event data into database
            console.log(`Importing event ID ${event.id} into database...`);
            await insertEvent(eventData);
            console.log(`Successfully imported event ID ${event.id}`);

            // Add a small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('All events processed successfully');

        // Process group details
        console.log('Starting group details processing...');
        await processAllGroupDetails();
        console.log('All group details processed successfully');

    } catch (error) {
        console.error('Error processing events:', error);
        process.exit(1);
    }
}

// Run the application
processEvents().then(() => {
    console.log('Application completed successfully');
    process.exit(0);
}).catch(error => {
    console.error('Application failed:', error);
    process.exit(1);
});
