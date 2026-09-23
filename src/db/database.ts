import { Pool } from "pg"

const url = process.env.DATABASE_URL;

if (url === undefined) {
    throw new Error("DATABASE_URL is required");
}

export const db = new Pool({
    connectionString: url
});