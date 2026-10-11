import { db } from "../db/database.js"

await db.query(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username TEXT NOT NULL UNIQUE)
`);

await db.query(`
    INSERT INTO users (username)
    VALUES 
    ('alice'),
    ('bob'),
    ('charlie');
`);

await db.end();