import { db } from "../db/database.js"

const result = await db.query(`
    SELECT * FROM users;`
);

console.log(result.rows);

db.end();