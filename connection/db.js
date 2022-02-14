const { Pool } = require('pg')

const isProduction = process.env.NODE_ENV === "production";
let pool

if (isProduction) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false,
        },
    });
} else {

    pool = new Pool({
        database: process.env.PG_DATABASE,
        port: process.env.PG_PORT,
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD
    })

}
module.exports = pool
