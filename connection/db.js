const { Pool } = require('pg')

// const dbPool = new Pool({
//     database: 'personal_web_b29',
//     port: 5432,
//     user: 'postgres',
//     password: 'root'
// })

// module.exports = dbPool

const isProduction = process.env.NODE_ENV === "production";

const connectionString = `postgresql://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_DATABASE}`;

const pool = new Pool({
    connectionString: isProduction ? process.env.DATABASE_URL : connectionString,
    ssl: {
        rejectUnauthorized: false,
    },
});

module.exports = pool;