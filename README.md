<<<<<<< HEAD
# RaceHeroData
=======
# RaceHero Data Importer

A Node.js application that fetches race event data from the RaceHero API and stores it in both JSON files and a PostgreSQL database.

## Features

- Fetches race event data from RaceHero API
- Stores raw API responses as JSON files for backup/reference
- Imports data into a structured PostgreSQL database
- Handles relationships between events, groups, and runs
- Fetches detailed group information for each event
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

   # API Endpoints
   EVENTS_ENDPOINT=/organizations/${ORGANIZATION}/events
   EVENT_DETAILS_ENDPOINT=/events
   ```

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
   - Fetches list of all events for the specified organization
   - Saves event list to `gridlifeAllEvents.json`
   - Fetches detailed information for each event
   - Saves each event's details to `event_{id}.json`

2. **Group Details Collection**:
   - Retrieves all event-group combinations from the database
   - Fetches detailed information for each group using `/events/{event_id}/groups/{group_id}`
   - Saves each group's details to `event_{id}_group_{group_id}.json`

3. **Database Import**:
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
2. Fetch the list of events from RaceHero API
3. Save the events list to `json/gridlifeAllEvents.json`
4. Fetch detailed information for each event
5. Save each event's details to `json/event_{id}.json`
6. Import all event data into the PostgreSQL database
7. Fetch detailed information for each group
8. Save each group's details to `json/event_{id}_group_{group_id}.json`

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
│   └── event_{id}_group_{group_id}.json # Individual group details
├── .env              # Environment configuration
└── package.json      # Project dependencies
```

## Data Flow

1. **API Fetching**:
   - Fetches list of events with organization and venue details
   - Fetches detailed information for each event
   - Fetches detailed information for each group

2. **File Storage**:
   - Saves raw API responses as JSON files
   - Maintains a backup of all fetched data
   - Organizes files by event and group IDs

3. **Database Import**:
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
>>>>>>> 56818e2 (initial commit)
