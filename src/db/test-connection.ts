import { db } from "../db/database.js"

const result = await db.query("SELECT NOW()");

console.log(result.rows);

db.end();