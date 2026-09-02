const SKILLS = [
    // Programming languages
    "c",
    "c++",
    "python",
    "javascript",
    "typescript",
    "java",
    "sql",

    // Frontend
    "html",
    "css",
    "react",
    "redux",

    // Backend
    "node.js",
    "express",
    "rest api",
    "graphql",

    // Databases
    "mysql",
    "postgresql",
    "mongodb",
    "redis",

    // DevOps / Cloud
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "gcp",
    "git",
    "github",
    "linux",
    "ci/cd",

    // Testing
    "jest",
    "supertest",

    // Core CS
    "data structures",
    "algorithms",
    "oop",
    "dbms",
    "operating systems",
    "computer networks",
    "system design",

    // Backend architecture
    "microservices",
    "websocket",
    "socket.io",

    // AI / GenAI
    "machine learning",
    "deep learning",
    "nlp",
    "llm",
    "rag",
    "embeddings",
    "vector database",
    "pgvector",
    "langchain",
    "langgraph",
    "generative ai",
]


// -----------------------------------------------------------------------------
// Skill aliases
// -----------------------------------------------------------------------------

const aliases = {
    "c++": [
        "c++",
        "cpp",
    ],

    javascript: [
        "javascript",
        "java script",
        "js",
    ],

    typescript: [
        "typescript",
        "type script",
        "ts",
    ],

    "node.js": [
        "node.js",
        "nodejs",
        "node js",
    ],

    express: [
        "express",
        "express.js",
        "expressjs",
    ],

    "rest api": [
        "rest api",
        "rest apis",
        "restful api",
        "restful apis",
        "restful service",
        "restful services",
        "rest services",
    ],

    postgresql: [
        "postgresql",
        "postgres",
    ],

    mongodb: [
        "mongodb",
        "mongo db",
        "mongo",
    ],

    "ci/cd": [
        "ci/cd",
        "ci cd",
        "continuous integration",
        "continuous deployment",
        "continuous delivery",
        "github actions",
    ],

    "data structures": [
        "data structures",
        "data structure",
        "dsa",
    ],

    algorithms: [
        "algorithm",
        "algorithms",
        "dsa",
    ],

    oop: [
        "oop",
        "object oriented programming",
        "object-oriented programming",
        "object oriented design",
    ],

    dbms: [
        "dbms",
        "database management system",
        "database management systems",
    ],

    "operating systems": [
        "operating systems",
        "operating system",
        "os fundamentals",
        "os concepts",
    ],

    "computer networks": [
        "computer networks",
        "computer networking",
        "networking",
        "cn",
    ],

    "system design": [
        "system design",
        "system architecture",
        "software architecture",
    ],

    websocket: [
        "websocket",
        "websockets",
        "web socket",
        "web sockets",
    ],

    "socket.io": [
        "socket.io",
        "socketio",
        "socket io",
    ],

    "machine learning": [
        "machine learning",
        "ml",
    ],

    "deep learning": [
        "deep learning",
        "dl",
    ],

    nlp: [
        "nlp",
        "natural language processing",
    ],

    llm: [
        "llm",
        "llms",
        "large language model",
        "large language models",
    ],

    rag: [
        "rag",
        "retrieval augmented generation",
        "retrieval-augmented generation",
    ],

    embeddings: [
        "embedding",
        "embeddings",
        "vector embedding",
        "vector embeddings",
    ],

    "vector database": [
        "vector database",
        "vector databases",
        "vector db",
        "vector store",
        "vector stores",
    ],

    pgvector: [
        "pgvector",
        "pg vector",
    ],

    "generative ai": [
        "generative ai",
        "genai",
        "gen ai",
    ],
}


// -----------------------------------------------------------------------------
// Normalize text
// -----------------------------------------------------------------------------

function normalize(text = "") {
    return text
        .toLowerCase()
        .replace(/[\n\r\t]+/g, " ")
        .replace(/[•|]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
}


// -----------------------------------------------------------------------------
// Phrase matcher
//
// Prevents false positives.
//
// Example:
//
// "c" must NOT match:
//
// CSS
// Cognizant
// React
//
// But punctuation such as:
//
// PostgreSQL.
// Express.js
// Node.js,
//
// must still work correctly.
// -----------------------------------------------------------------------------

function includesPhrase(text, phrase) {
    const escaped =
        phrase.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        )

    /*
     * IMPORTANT:
     *
     * "." is intentionally NOT included in the
     * boundary character set.
     *
     * This means punctuation can act as a valid
     * separator:
     *
     * PostgreSQL.
     * Express.js
     * Node.js,
     *
     * while still preventing:
     *
     * c -> CSS
     * c -> Cognizant
     */
    const regex =
        new RegExp(
            `(^|[^a-z0-9+#])${escaped}(?=$|[^a-z0-9+#])`,
            "i"
        )

    return regex.test(text)
}


// -----------------------------------------------------------------------------
// Extract skills
// -----------------------------------------------------------------------------

function extractSkills(text = "") {
    const normalized =
        normalize(text)

    const detected =
        SKILLS.filter((skill) => {
            const possibleTerms =
                aliases[skill] ||
                [skill]

            return possibleTerms.some(
                (term) =>
                    includesPhrase(
                        normalized,
                        term
                    )
            )
        })

    return [
        ...new Set(detected),
    ]
}


// -----------------------------------------------------------------------------
// Keyword extraction
// -----------------------------------------------------------------------------

function extractKeywords(text = "") {
    const stopWords =
        new Set([
            "with",
            "from",
            "that",
            "this",
            "your",
            "will",
            "have",
            "into",
            "about",
            "using",
            "work",
            "role",
            "team",
            "years",
            "year",
            "experience",
            "experienced",
            "skills",
            "skill",
            "required",
            "requirements",
            "preferred",
            "responsibilities",
            "responsibility",
            "candidate",
            "candidates",
            "knowledge",
            "understanding",
            "strong",
            "good",
            "excellent",
            "ability",
            "working",
            "development",
            "develop",
            "software",
            "engineer",
            "engineering",
            "and",
            "the",
            "for",
            "are",
            "you",
            "our",
            "who",
            "but",
            "not",
            "can",
            "all",
            "any",
            "other",
            "within",
        ])

    const words =
        normalize(text).match(
            /[a-z][a-z0-9+#.]{2,}/g
        ) || []

    return new Set(
        words.filter(
            (word) =>
                !stopWords.has(word)
        )
    )
}


// -----------------------------------------------------------------------------
// Keyword score
// -----------------------------------------------------------------------------

function keywordScore(
    resumeText,
    jobText
) {
    const resumeKeywords =
        extractKeywords(
            resumeText
        )

    const jobKeywords =
        extractKeywords(
            jobText
        )

    if (!jobKeywords.size) {
        return 0
    }

    let matches = 0

    for (
        const keyword
        of jobKeywords
    ) {
        if (
            resumeKeywords.has(
                keyword
            )
        ) {
            matches++
        }
    }

    return Math.round(
        (
            matches /
            jobKeywords.size
        ) *
        100
    )
}


// -----------------------------------------------------------------------------
// Profile completeness
// -----------------------------------------------------------------------------

function profileScore(text = "") {
    const normalized =
        normalize(text)

    const signals = [
        {
            name: "contact",

            found:
                /@/.test(text) ||
                /\b\d{10}\b/.test(
                    text.replace(
                        /\s+/g,
                        ""
                    )
                ),
        },

        {
            name: "linkedin",

            found:
                /linkedin/.test(
                    normalized
                ),
        },

        {
            name: "education",

            found:
                /(education|b\.?tech|bachelor|degree|college|university)/.test(
                    normalized
                ),
        },

        {
            name: "projects",

            found:
                /(project|projects)/.test(
                    normalized
                ),
        },

        {
            name: "experience",

            found:
                /(experience|intern|internship|employment|work experience)/.test(
                    normalized
                ),
        },

        {
            name: "skills",

            found:
                /(skill|skills|technical skills|technologies)/.test(
                    normalized
                ),
        },
    ]

    const completed =
        signals.filter(
            (signal) =>
                signal.found
        ).length

    return Math.round(
        (
            completed /
            signals.length
        ) *
        100
    )
}


// -----------------------------------------------------------------------------
// Cosine similarity
// -----------------------------------------------------------------------------

function cosineSimilarity(
    first = [],
    second = []
) {
    if (
        !first.length ||
        !second.length ||
        first.length !==
            second.length
    ) {
        return 0
    }

    let dotProduct = 0
    let firstMagnitude = 0
    let secondMagnitude = 0

    for (
        let index = 0;
        index < first.length;
        index++
    ) {
        const firstValue =
            Number(
                first[index]
            )

        const secondValue =
            Number(
                second[index]
            )

        dotProduct +=
            firstValue *
            secondValue

        firstMagnitude +=
            firstValue *
            firstValue

        secondMagnitude +=
            secondValue *
            secondValue
    }

    if (
        !firstMagnitude ||
        !secondMagnitude
    ) {
        return 0
    }

    return (
        dotProduct /
        (
            Math.sqrt(
                firstMagnitude
            ) *
            Math.sqrt(
                secondMagnitude
            )
        )
    )
}


// -----------------------------------------------------------------------------
// Normalize semantic similarity
//
// <= 0.35  -> 0
// >= 0.85  -> 100
// -----------------------------------------------------------------------------

function normalizeSemanticSimilarity(
    similarity
) {
    const minimum = 0.35
    const maximum = 0.85

    if (
        similarity <= minimum
    ) {
        return 0
    }

    if (
        similarity >= maximum
    ) {
        return 100
    }

    const normalized =
        (
            similarity -
            minimum
        ) /
        (
            maximum -
            minimum
        )

    return Math.round(
        normalized *
        100
    )
}


// -----------------------------------------------------------------------------
// Skill coverage
// -----------------------------------------------------------------------------

function calculateSkillCoverage(
    resumeSkills,
    jobSkills
) {
    if (
        !jobSkills.length
    ) {
        return 0
    }

    const matchedSkills =
        jobSkills.filter(
            (skill) =>
                resumeSkills.includes(
                    skill
                )
        )

    return Math.round(
        (
            matchedSkills.length /
            jobSkills.length
        ) *
        100
    )
}


// -----------------------------------------------------------------------------
// Main deterministic matching algorithm
//
// Normal weighting:
//
// Skill coverage         50%
// Semantic similarity    25%
// Keyword coverage       15%
// Profile completeness   10%
// -----------------------------------------------------------------------------

function calculateMatch({
    resumeText = "",
    jobText = "",
    resumeEmbedding = [],
    jobEmbedding = [],
}) {
    const resumeSkills =
        extractSkills(
            resumeText
        )

    const jobSkills =
        extractSkills(
            jobText
        )

    const matchedSkills =
        jobSkills.filter(
            (skill) =>
                resumeSkills.includes(
                    skill
                )
        )

    const missingSkills =
        jobSkills.filter(
            (skill) =>
                !resumeSkills.includes(
                    skill
                )
        )

    const skillScore =
        calculateSkillCoverage(
            resumeSkills,
            jobSkills
        )

    const lexicalScore =
        keywordScore(
            resumeText,
            jobText
        )

    let semanticScore =
        lexicalScore

    let semanticMethod =
        "lexical-fallback"

    if (
        resumeEmbedding.length &&
        jobEmbedding.length &&
        resumeEmbedding.length ===
            jobEmbedding.length
    ) {
        const rawSimilarity =
            cosineSimilarity(
                resumeEmbedding,
                jobEmbedding
            )

        semanticScore =
            normalizeSemanticSimilarity(
                rawSimilarity
            )

        semanticMethod =
            "embedding-cosine"
    }

    const completenessScore =
        profileScore(
            resumeText
        )

    let finalScore
    let weights

    if (jobSkills.length) {
        weights = {
            skillCoverage: 0.5,
            semanticSimilarity: 0.25,
            keywordCoverage: 0.15,
            profileCompleteness: 0.1,
        }

        finalScore =
            skillScore *
                weights.skillCoverage +
            semanticScore *
                weights.semanticSimilarity +
            lexicalScore *
                weights.keywordCoverage +
            completenessScore *
                weights.profileCompleteness
    } else {
        /*
         * If the JD contains none of the skills
         * present in our dictionary, do not
         * automatically lose 50% of the score.
         */

        weights = {
            skillCoverage: 0,
            semanticSimilarity: 0.55,
            keywordCoverage: 0.3,
            profileCompleteness: 0.15,
        }

        finalScore =
            semanticScore *
                weights.semanticSimilarity +
            lexicalScore *
                weights.keywordCoverage +
            completenessScore *
                weights.profileCompleteness
    }

    const matchScore =
        Math.max(
            0,
            Math.min(
                100,
                Math.round(
                    finalScore
                )
            )
        )

    return {
        matchScore,

        skillScore,

        semanticScore,

        keywordScore:
            lexicalScore,

        profileScore:
            completenessScore,

        matchedSkills,

        missingSkills,

        resumeSkills,

        jobSkills,

        semanticMethod,

        breakdown: {
            skillCoverage:
                `${
                    Math.round(
                        weights.skillCoverage *
                        100
                    )
                }%`,

            semanticSimilarity:
                `${
                    Math.round(
                        weights.semanticSimilarity *
                        100
                    )
                }%`,

            keywordCoverage:
                `${
                    Math.round(
                        weights.keywordCoverage *
                        100
                    )
                }%`,

            profileCompleteness:
                `${
                    Math.round(
                        weights.profileCompleteness *
                        100
                    )
                }%`,
        },
    }
}


module.exports = {
    extractSkills,
    calculateMatch,
    cosineSimilarity,
    keywordScore,
    profileScore,
}