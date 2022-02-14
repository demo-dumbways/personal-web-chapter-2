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
        database: 'db_blog',
        port: 5432,
        user: 'postgres',
        password: 'root'
    })

}
module.exports = pool
