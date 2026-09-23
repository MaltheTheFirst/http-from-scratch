import { db } from "../db/database.js"

await db.query(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL)
`);

await db.query(`
    INSERT INTO users (id, username)
    VALUES (1, 'alice'),
           (2, 'bob'),
           (3, 'charlie')
    ON CONFLICT (id) DO NOTHING;
`);

await db.end();