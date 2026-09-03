const { Pool } = require("pg")

const env =
    require("./env")


const pool =
    new Pool({
        connectionString:
            env.DATABASE_URL,

        ssl:
            env.NODE_ENV ===
            "production"
                ? {
                    rejectUnauthorized:
                        false,
                }
                : false,

        max: 10,

        idleTimeoutMillis:
            30000,

        connectionTimeoutMillis:
            10000,
    })


pool.on(
    "error",
    (error) => {
        console.error(
            "Unexpected PostgreSQL pool error:",
            error
        )
    }
)


async function query(
    text,
    params = []
) {
    return pool.query(
        text,
        params
    )
}


async function withTransaction(
    callback
) {
    const client =
        await pool.connect()

    try {
        await client.query(
            "BEGIN"
        )

        const result =
            await callback(
                client
            )

        await client.query(
            "COMMIT"
        )

        return result
    } catch (error) {
        await client.query(
            "ROLLBACK"
        )

        throw error
    } finally {
        client.release()
    }
}


async function checkDatabase() {
    await pool.query(
        "SELECT 1"
    )
}


module.exports = {
    pool,
    query,
    withTransaction,
    checkDatabase,
}