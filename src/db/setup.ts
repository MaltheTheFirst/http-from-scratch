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
    CREATE TABLE IF NOT EXISTS notes (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL 
        REFERENCES users(id)
        ON DELETE CASCADE,
    content TEXT NOT NULL,
    UNIQUE (user_id, content));
`)

await db.query(`
    INSERT INTO users (username)
    VALUES 
    ('alice'),
    ('bob'),
    ('charlie')
    ON CONFLICT DO NOTHING;
`);

await db.query(`
    INSERT INTO notes (user_id, content)
    VALUES
        (1, 'Call customer'),
        (1, 'Check invoice'),
        (2, 'Send follow-up')
    ON CONFLICT DO NOTHING;
`);

await db.end();