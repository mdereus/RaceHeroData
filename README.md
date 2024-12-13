# RaceHero Data Importer

A Node.js application that fetches and stores race event data from the RaceHero API into JSON files and CSV data.

## Features

- Fetches race event data from RaceHero API
- Stores raw API responses as JSON files for backup/reference
- Downloads CSV data for race results
- Efficient batched processing of API requests
- Handles relationships between events, groups, and runs
- Fetches detailed group information for each event
- Collects run data, results, racers, flags, and passings for each event
- Smart file caching with force download option
- Configurable through environment variables
- Resilient CSV downloads with automatic retries
- Supports CSV-only mode for quick data updates

## Prerequisites

- Node.js (v14 or higher)
- RaceHero API credentials

## Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd RaceHeroData
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your configuration:
   ```env
   # API Configuration
   API_BASE_URL=https://api.racehero.io/v1
   ORGANIZATION=your-org-name
   JSON_OUTPUT_DIR=json
   API_USERNAME=your-api-username
   API_PASSWORD=your-api-password
   FORCE_DOWNLOAD=false
   ```

## Configuration Options

### File Download Control
The application includes smart file caching to avoid unnecessary API calls:

- `FORCE_DOWNLOAD`: 
  - When set to `false` (default), the application will:
    - Check for existing JSON files before making API calls
    - Use cached files if they exist
    - Only download from the API if files are missing
  - When set to `true`:
    - Force fresh downloads from the API
    - Override existing files with new data

This helps reduce API calls and processing time when data has already been collected.

## Data Collection

The application collects data in multiple stages, using efficient batch processing:

1. **Events Collection**:
   - Checks for existing event data files
   - If not found or force download enabled:
     - Fetches list of all events for the specified organization
     - Saves event list to `{organization}AllEvents.json`
     - Processes events in batches of 10 for improved performance
     - Saves each event's details to `event_{id}.json`

2. **Group Details Collection**:
   - Processes event-group combinations in batches of 10
   - For each combination:
     - Checks for existing group data file
     - If not found or force download enabled:
       - Fetches detailed information using `/events/{event_id}/groups/{group_id}`
       - Saves to `event_{id}_group_{group_id}.json`

3. **Run Collection**:
   - Processes events in batches of 10
   - For each event:
     - Checks for existing run data file
     - If not found or force download enabled:
       - Fetches run data using `/events/{event_id}/runs`
       - Saves to `event_{id}_runs.json`

4. **Additional Data Collection**:
   - Processes in batches of 10 for each data type:
     - Run results
     - Run racers
     - Run flags
     - Run passings
   - Each type of data is saved to its respective JSON file

5. **CSV Data Collection**:
   - Downloads CSV files for all race results
   - Features automatic retry mechanism:
     - 20-second timeout per attempt
     - Up to 3 retry attempts for failed downloads
     - Exponential backoff between retries
     - Detailed logging of retry attempts

## Usage

The application can be run in two modes:

1. Full mode (processes all data):
```bash
npm start
# or
node src/index.js
```

2. CSV-only mode (only downloads CSV files):
```bash
node src/index.js --csv-only
```

The full mode will:
1. Fetch the initial list of events
2. Process event details in parallel batches
3. Process group details in parallel batches
4. Process runs in parallel batches
5. Process additional data (results, racers, flags, passings) in parallel batches
6. Download CSV files for all race results

The CSV-only mode will:
1. Skip all JSON data processing
2. Only download CSV files for race results
3. Use existing JSON data to locate CSV files to download

To force fresh downloads of all data:
1. Set `FORCE_DOWNLOAD=true` in `.env`
2. Run `npm start`

## Project Structure

```
RaceHeroData/
├── src/
│   ├── index.js      # Main application entry point
│   ├── config.js     # Configuration management
│   └── api.js        # API interactions and file operations
├── json/             # JSON file storage
│   ├── {organization}AllEvents.json           # List of all events
│   ├── event_{id}.json                       # Individual event details
│   ├── event_{id}_group_{group_id}.json      # Individual group details
│   ├── event_{id}_runs.json                  # Event run data
│   ├── event_{id}_run_{run_id}_results.json  # Run results
│   ├── event_{id}_run_{run_id}_racers.json   # Run racers
│   ├── event_{id}_run_{run_id}_flags.json    # Run flags
│   └── event_{id}_run_{run_id}_passings.json # Run passings
├── csv/              # CSV file storage for race results
├── .env              # Environment configuration
└── package.json      # Project dependencies
```

## Data Flow

1. **File Check**:
   - Check for existing JSON files
   - Determine if download is needed based on existence and force flag

2. **API Fetching** (if needed):
   - Fetches list of events with organization and venue details
   - Processes events in efficient batches of 10
   - Maintains rate limiting with 1-second delay between API calls
   - Saves data to JSON files as it's collected

3. **File Storage**:
   - Saves raw API responses as JSON files
   - Maintains a backup of all fetched data
   - Organizes files by event, group, and run IDs
   - Stores CSV files in dedicated csv directory

## Error Handling

The application includes comprehensive error handling for:
- API connection issues
- File system operations
- Data validation and processing
- Batch processing recovery
- CSV download retries with timeout

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
