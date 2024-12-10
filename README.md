# RaceHero Data Importer

A Node.js application that fetches race event data from the RaceHero API and stores it in both JSON files and a PostgreSQL database.

## Features

- Fetches race event data from RaceHero API
- Stores raw API responses as JSON files for backup/reference
- Imports data into a structured PostgreSQL database
- Handles relationships between events, groups, and runs
- Fetches detailed group information for each event
- Collects run data for each event
- Smart file caching with force download option
- Configurable through environment variables

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL server
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
   # Database Configuration
   PGHOST=your-db-host
   PGUSER=your-db-user
   PGDATABASE=racehero
   PGPASSWORD=your-db-password
   PGPORT=5432

   # API Configuration
   API_BASE_URL=https://api.racehero.io/v1
   ORGANIZATION=gridlife
   JSON_OUTPUT_DIR=json
   API_USERNAME=your-api-username
   API_PASSWORD=your-api-password
   FORCE_DOWNLOAD=false

   # API Endpoints
   EVENTS_ENDPOINT=/organizations/${ORGANIZATION}/events
   EVENT_DETAILS_ENDPOINT=/events
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

## Database Schema

The application creates three main tables:

1. `events`: Stores main event information
   - Basic event details (name, dates, timezone)
   - Organization information
   - Venue information
   - Configuration details

2. `event_groups`: Stores event group information
   - Linked to events via foreign key
   - Group name and details

3. `group_runs`: Stores individual run information
   - Linked to groups via foreign key
   - Run details (type, status, timing)
   - Results information

## Data Collection

The application collects data in multiple stages:

1. **Events Collection**:
   - Checks for existing event data files
   - If not found or force download enabled:
     - Fetches list of all events for the specified organization
     - Saves event list to `gridlifeAllEvents.json`
     - Fetches detailed information for each event
     - Saves each event's details to `event_{id}.json`

2. **Group Details Collection**:
   - Retrieves all event-group combinations from the database
   - For each combination:
     - Checks for existing group data file
     - If not found or force download enabled:
       - Fetches detailed information using `/events/{event_id}/groups/{group_id}`
       - Saves to `event_{id}_group_{group_id}.json`

3. **Run Collection**:
   - Retrieves all event IDs from the database
   - For each event:
     - Checks for existing run data file
     - If not found or force download enabled:
       - Fetches run data using `/events/{event_id}/runs`
       - Saves to `event_{id}_runs.json`

4. **Database Import**:
   - Creates normalized database structure
   - Imports all event data with proper relationships
   - Handles updates for existing records

## Usage

Run the application:
```bash
npm start
```

This will:
1. Initialize the database and create necessary tables
2. Process events (download if needed or use cached files)
3. Process groups (download if needed or use cached files)
4. Process runs (download if needed or use cached files)
5. Import all data into the PostgreSQL database

To force fresh downloads of all data:
1. Set `FORCE_DOWNLOAD=true` in `.env`
2. Run `npm start`

## Project Structure

```
RaceHeroData/
├── src/
│   ├── index.js      # Main application entry point
│   ├── config.js     # Configuration management
│   ├── db.js         # Database operations
│   └── api.js        # API interactions
├── json/             # JSON file storage
│   ├── gridlifeAllEvents.json           # List of all events
│   ├── event_{id}.json                  # Individual event details
│   ├── event_{id}_group_{group_id}.json # Individual group details
│   └── event_{id}_runs.json            # Event run data
├── .env              # Environment configuration
└── package.json      # Project dependencies
```

## Data Flow

1. **File Check**:
   - Check for existing JSON files
   - Determine if download is needed based on existence and force flag

2. **API Fetching** (if needed):
   - Fetches list of events with organization and venue details
   - Fetches detailed information for each event
   - Fetches detailed information for each group
   - Fetches run data for each event

3. **File Storage**:
   - Saves raw API responses as JSON files
   - Maintains a backup of all fetched data
   - Organizes files by event and group IDs

4. **Database Import**:
   - Creates normalized database structure
   - Imports data with proper relationships
   - Handles updates for existing records

## Error Handling

The application includes comprehensive error handling for:
- API connection issues
- Database connection problems
- File system operations
- Data validation and processing

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
