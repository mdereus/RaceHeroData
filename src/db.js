const { Pool } = require('pg');
const config = require('./config');

// Create a pool for connecting to the default 'postgres' database first
const initialPool = new Pool({
    ...config.db,
    database: 'postgres' // Connect to default database first
});

// Pool for connecting to our application database
const pool = new Pool(config.db);

const createTablesQuery = `
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    sport_name VARCHAR(50),
    is_live BOOLEAN,
    notes JSON,
    timezone VARCHAR(50),
    meta JSON,
    event_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    org_id INTEGER,
    org_name VARCHAR(255),
    org_url TEXT,
    org_html_url TEXT,
    org_avatar_url TEXT,
    venue_id INTEGER,
    venue_name VARCHAR(255),
    venue_address TEXT,
    venue_address2 TEXT,
    venue_city VARCHAR(100),
    venue_region VARCHAR(50),
    venue_postal_code VARCHAR(20),
    venue_country VARCHAR(2),
    venue_website_url TEXT,
    venue_lat DECIMAL,
    venue_lng DECIMAL,
    venue_url TEXT,
    venue_html_url TEXT,
    venue_avatar_url TEXT,
    venue_configuration_id INTEGER,
    venue_configuration_name VARCHAR(255),
    venue_configuration_length DECIMAL,
    venue_configuration_units VARCHAR(10),
    venue_configuration_direction VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS event_groups (
    id INTEGER PRIMARY KEY,
    event_id INTEGER REFERENCES events(id),
    name VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS group_runs (
    id INTEGER PRIMARY KEY,
    group_id INTEGER REFERENCES event_groups(id),
    name VARCHAR(255),
    type VARCHAR(50),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    last_received_data_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50),
    total_laps INTEGER,
    has_results BOOLEAN,
    results_url TEXT
);
`;

async function createDatabase() {
    const client = await initialPool.connect();
    try {
        // Check if database exists
        const checkDb = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [config.db.database]
        );

        // Create database if it doesn't exist
        if (checkDb.rowCount === 0) {
            // Disconnect all other clients
            await client.query(
                `SELECT pg_terminate_backend(pid) 
                 FROM pg_stat_activity 
                 WHERE datname = $1`,
                [config.db.database]
            );

            // Create the database
            await client.query(`CREATE DATABASE ${config.db.database}`);
            console.log(`Database ${config.db.database} created successfully`);
        }
    } finally {
        client.release();
    }
}

async function initializeDatabase() {
    try {
        // Ensure database exists
        await createDatabase();

        // Create tables in the application database
        const client = await pool.connect();
        try {
            await client.query(createTablesQuery);
            console.log('Database tables created successfully');
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

async function insertEvent(event) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Insert event
        const eventQuery = `
            INSERT INTO events (
                id, name, started_at, ended_at, sport_name, is_live, notes, timezone,
                meta, event_url, created_at, updated_at, org_id, org_name, org_url,
                org_html_url, org_avatar_url, venue_id, venue_name, venue_address,
                venue_address2, venue_city, venue_region, venue_postal_code, venue_country,
                venue_website_url, venue_lat, venue_lng, venue_url, venue_html_url,
                venue_avatar_url, venue_configuration_id, venue_configuration_name,
                venue_configuration_length, venue_configuration_units, venue_configuration_direction
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                    $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
                    $29, $30, $31, $32, $33, $34, $35, $36)
            ON CONFLICT (id) DO UPDATE SET
                updated_at = EXCLUDED.updated_at
            RETURNING id;
        `;

        const eventValues = [
            event.id,
            event.name,
            event.started_at,
            event.ended_at,
            event.sport?.name,
            event.is_live,
            JSON.stringify(event.notes),
            event.timezone,
            event.meta,
            event.event_url,
            event.created_at,
            event.updated_at,
            event.org?.id,
            event.org?.name,
            event.org?.url,
            event.org?.html_url,
            event.org?.avatar_url,
            event.venue?.id,
            event.venue?.name,
            event.venue?.address,
            event.venue?.address2,
            event.venue?.city,
            event.venue?.region,
            event.venue?.postal_code,
            event.venue?.country,
            event.venue?.website_url,
            event.venue?.lat,
            event.venue?.lng,
            event.venue?.url,
            event.venue?.html_url,
            event.venue?.avatar_url,
            event.venue?.configuration?.id,
            event.venue?.configuration?.name,
            event.venue?.configuration?.length,
            event.venue?.configuration?.units,
            event.venue?.configuration?.direction
        ];

        await client.query(eventQuery, eventValues);

        // Insert groups and runs
        if (event.groups) {
            for (const group of event.groups) {
                const groupQuery = `
                    INSERT INTO event_groups (id, event_id, name)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (id) DO NOTHING
                    RETURNING id;
                `;
                await client.query(groupQuery, [group.id, event.id, group.name]);

                if (group.runs) {
                    for (const run of group.runs) {
                        const runQuery = `
                            INSERT INTO group_runs (
                                id, group_id, name, type, started_at, ended_at,
                                last_received_data_at, status, total_laps, has_results, results_url
                            )
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                            ON CONFLICT (id) DO NOTHING;
                        `;
                        await client.query(runQuery, [
                            run.id,
                            group.id,
                            run.name,
                            run.type,
                            run.started_at,
                            run.ended_at,
                            run.last_received_data_at,
                            run.status,
                            run.total_laps,
                            run.has_results,
                            run.results_url
                        ]);
                    }
                }
            }
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

async function getEventAndGroupIds() {
    const client = await pool.connect();
    try {
        const query = `
            SELECT e.id as event_id, g.id as group_id
            FROM events e
            JOIN event_groups g ON e.id = g.event_id
            ORDER BY e.id, g.id;
        `;
        const result = await client.query(query);
        return result.rows;
    } finally {
        client.release();
    }
}

async function getAllEventIds() {
    const client = await pool.connect();
    try {
        const query = `
            SELECT id
            FROM events
            ORDER BY id;
        `;
        const result = await client.query(query);
        return result.rows.map(row => row.id);
    } finally {
        client.release();
    }
}

module.exports = {
    pool,
    initializeDatabase,
    insertEvent,
    getEventAndGroupIds,
    getAllEventIds
};
