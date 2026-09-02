process.env.NODE_ENV = "test"

process.env.DATABASE_URL =
    "postgresql://postgres:postgres@localhost:5432/genai_resume_test"

process.env.JWT_SECRET =
    "test-jwt-secret-that-is-long-enough-for-validation"

process.env.GOOGLE_GENAI_API_KEY =
    "test-google-genai-key"

process.env.GEMINI_MODEL =
    "gemini-2.0-flash"

process.env.EMBEDDING_MODEL =
    "text-embedding-004"


const {
    describe,
    test,
    before,
    after,
} = require("node:test")

const assert =
    require("node:assert/strict")

const app =
    require("../src/app")


let server
let baseUrl


// -----------------------------------------------------------------------------
// Start Express on a random free port
// -----------------------------------------------------------------------------

before(async () => {
    await new Promise(
        (resolve) => {
            server =
                app.listen(
                    0,
                    "127.0.0.1",
                    () => {
                        const address =
                            server.address()

                        baseUrl =
                            `http://127.0.0.1:${address.port}`

                        resolve()
                    }
                )
        }
    )
})


// -----------------------------------------------------------------------------
// Shut server down after tests
// -----------------------------------------------------------------------------

after(async () => {
    if (!server) {
        return
    }

    await new Promise(
        (resolve, reject) => {
            server.close(
                (error) => {
                    if (error) {
                        reject(error)
                        return
                    }

                    resolve()
                }
            )
        }
    )
})


// -----------------------------------------------------------------------------
// Health endpoint
// -----------------------------------------------------------------------------

describe("Health API", () => {

    test("GET /health returns 200", async () => {
        const response =
            await fetch(
                `${baseUrl}/health`
            )

        assert.equal(
            response.status,
            200
        )

        const body =
            await response.json()

        assert.equal(
            body.success,
            true
        )

        assert.equal(
            body.status,
            "ok"
        )

        assert.ok(
            body.timestamp
        )
    })

})


// -----------------------------------------------------------------------------
// API versioning
// -----------------------------------------------------------------------------

describe("API versioning", () => {

    test("versioned auth route exists", async () => {
        const response =
            await fetch(
                `${baseUrl}/api/v1/auth/me`
            )

        assert.equal(
            response.status,
            401
        )

        const body =
            await response.json()

        assert.equal(
            body.success,
            false
        )
    })

})


// -----------------------------------------------------------------------------
// Authentication protection
// -----------------------------------------------------------------------------

describe("Authentication middleware", () => {

    test("protected endpoint rejects missing authentication cookie", async () => {
        const response =
            await fetch(
                `${baseUrl}/api/v1/auth/me`
            )

        assert.equal(
            response.status,
            401
        )

        const body =
            await response.json()

        assert.equal(
            body.success,
            false
        )

        assert.ok(
            typeof body.message ===
                "string"
        )
    })

})


// -----------------------------------------------------------------------------
// Register validation
// -----------------------------------------------------------------------------

describe("Register validation", () => {

    test("rejects invalid email", async () => {
        const response =
            await fetch(
                `${baseUrl}/api/v1/auth/register`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            username:
                                "Abhinav",

                            email:
                                "not-an-email",

                            password:
                                "password123",
                        }),
                }
            )

        assert.equal(
            response.status,
            400
        )

        const body =
            await response.json()

        assert.equal(
            body.success,
            false
        )

        assert.equal(
            body.message,
            "Validation failed"
        )
    })


    test("rejects short password", async () => {
        const response =
            await fetch(
                `${baseUrl}/api/v1/auth/register`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            username:
                                "Abhinav",

                            email:
                                "abhinav@example.com",

                            password:
                                "123",
                        }),
                }
            )

        assert.equal(
            response.status,
            400
        )

        const body =
            await response.json()

        assert.equal(
            body.success,
            false
        )

        assert.equal(
            body.message,
            "Validation failed"
        )
    })


    test("rejects username shorter than 2 characters", async () => {
        const response =
            await fetch(
                `${baseUrl}/api/v1/auth/register`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            username:
                                "A",

                            email:
                                "test@example.com",

                            password:
                                "password123",
                        }),
                }
            )

        assert.equal(
            response.status,
            400
        )

        const body =
            await response.json()

        assert.equal(
            body.success,
            false
        )
    })

})


// -----------------------------------------------------------------------------
// Login validation
// -----------------------------------------------------------------------------

describe("Login validation", () => {

    test("rejects invalid email format", async () => {
        const response =
            await fetch(
                `${baseUrl}/api/v1/auth/login`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            email:
                                "wrong-email",

                            password:
                                "password123",
                        }),
                }
            )

        assert.equal(
            response.status,
            400
        )

        const body =
            await response.json()

        assert.equal(
            body.success,
            false
        )
    })


    test("rejects empty password", async () => {
        const response =
            await fetch(
                `${baseUrl}/api/v1/auth/login`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            email:
                                "test@example.com",

                            password:
                                "",
                        }),
                }
            )

        assert.equal(
            response.status,
            400
        )
    })

})


// -----------------------------------------------------------------------------
// JSON body handling
// -----------------------------------------------------------------------------

describe("Request body handling", () => {

    test("rejects malformed JSON", async () => {
        const response =
            await fetch(
                `${baseUrl}/api/v1/auth/login`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body:
                        `{
                            "email":
                            "test@example.com",
                        `,
                }
            )

        assert.equal(
            response.status,
            400
        )
    })

})


// -----------------------------------------------------------------------------
// Unknown routes
// -----------------------------------------------------------------------------

describe("404 handler", () => {

    test("unknown endpoint returns 404", async () => {
        const response =
            await fetch(
                `${baseUrl}/api/v1/does-not-exist`
            )

        assert.equal(
            response.status,
            404
        )

        const body =
            await response.json()

        assert.equal(
            body.success,
            false
        )

        assert.ok(
            body.message.includes(
                "Route not found"
            )
        )
    })

})


// -----------------------------------------------------------------------------
// Security headers
// -----------------------------------------------------------------------------

describe("Security headers", () => {

    test("Helmet security headers are enabled", async () => {
        const response =
            await fetch(
                `${baseUrl}/health`
            )

        assert.equal(
            response.headers.get(
                "x-content-type-options"
            ),
            "nosniff"
        )

        assert.equal(
            response.headers.get(
                "x-powered-by"
            ),
            null
        )
    })

})


// -----------------------------------------------------------------------------
// Request ID
// -----------------------------------------------------------------------------

describe("Request tracing", () => {

    test("error responses include a request ID", async () => {
        const response =
            await fetch(
                `${baseUrl}/api/v1/auth/me`
            )

        const body =
            await response.json()

        assert.equal(
            response.status,
            401
        )

        assert.ok(
            body.requestId
        )

        assert.equal(
            typeof body.requestId,
            "string"
        )
    })

})