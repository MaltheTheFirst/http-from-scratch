import { db } from "../db/database.js"

await db.query(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username TEXT NOT NULL,
    username_normalised TEXT
        GENERATED ALWAYS AS (LOWER(username)) STORED
        UNIQUE
    );
`);

await db.query(`
    INSERT INTO users (username)
    VALUES 
    ('alice'),
    ('bob'),
    ('charlie')
    ON CONFLICT DO NOTHING;
`);

await db.end();