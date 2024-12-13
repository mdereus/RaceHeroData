const { 
    fetchAllEvents, 
    processAllEventDetails,
    processAllGroupDetails, 
    processAllEventRuns, 
    processAllRunResults, 
    processAllRunRacers,
    processAllRunFlags,
    processAllRunPassings,
    processAllCsvDownloads
} = require('./api');

async function processEvents() {
    try {
        const csvOnly = process.argv.includes('--csv-only');
        
        if (csvOnly) {
            console.log('Running in CSV-only mode...');
            await processAllCsvDownloads();
            console.log('All CSV files downloaded successfully');
            return;
        }

        // Fetch and save all events
        console.log('Fetching all events...');
        const events = await fetchAllEvents();
        console.log(`Found ${events.length} events to process`);

        // Process event details in batches
        console.log('Processing event details in batches...');
        await processAllEventDetails(events);
        console.log('All event details processed successfully');

        // Process group details
        console.log('Starting group details processing...');
        await processAllGroupDetails();
        console.log('All group details processed successfully');

        // Process event runs
        console.log('Starting event runs processing...');
        await processAllEventRuns();
        console.log('All event runs processed successfully');

        // Process run results
        console.log('Starting run results processing...');
        await processAllRunResults();
        console.log('All run results processed successfully');

        // Process run racers
        console.log('Starting run racers processing...');
        await processAllRunRacers();
        console.log('All run racers processed successfully');

        // Process run flags
        console.log('Starting run flags processing...');
        await processAllRunFlags();
        console.log('All run flags processed successfully');

        // Process run passings
        console.log('Starting run passings processing...');
        await processAllRunPassings();
        console.log('All run passings processed successfully');

        // Download CSV files
        console.log('Starting CSV downloads...');
        await processAllCsvDownloads();
        console.log('All CSV files downloaded successfully');

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
