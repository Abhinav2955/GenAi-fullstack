import { useEffect, useState } from "react"
import "../style/interview.scss"
import { useInterview } from "../hooks/useInterview.js"
import { useParams } from "react-router"
import LoadingScreen from "../components/LoadingScreen.jsx"

const NAV = [
    ["technical", "Technical Questions"],
    ["behavioral", "Behavioral Questions"],
    ["roadmap", "Road Map"],
    ["analysis", "Score Analysis"],
    ["assistant", "RAG Assistant"],
]

const QuestionCard = ({ item, index }) => {
    const [open, setOpen] = useState(false)

    return (
        <div className="q-card">
            <div
                className="q-card__header"
                onClick={() => setOpen(!open)}
            >
                <span className="q-card__index">
                    Q{index + 1}
                </span>

                <p className="q-card__question">
                    {item.question}
                </p>

                <span>⌄</span>
            </div>

            {open && (
                <div className="q-card__body">
                    <div className="q-card__section">
                        <span className="q-card__tag q-card__tag--intention">
                            Intention
                        </span>

                        <p>{item.intention}</p>
                    </div>

                    <div className="q-card__section">
                        <span className="q-card__tag q-card__tag--answer">
                            Model Answer
                        </span>

                        <p>{item.answer}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

const RoadMapDay = ({ day }) => (
    <div className="roadmap-day">
        <div className="roadmap-day__header">
            <span className="roadmap-day__badge">
                Day {day.day}
            </span>

            <h3 className="roadmap-day__focus">
                {day.focus}
            </h3>
        </div>

        <ul className="roadmap-day__tasks">
            {day.tasks.map((task, index) => (
                <li key={index}>
                    {task}
                </li>
            ))}
        </ul>
    </div>
)

export default function Interview() {
    const [active, setActive] =
        useState("technical")

    const [downloading, setDownloading] =
        useState(false)

    const [question, setQuestion] =
        useState("")

    const [chat, setChat] =
        useState([])

    const [asking, setAsking] =
        useState(false)

    const [assistantError, setAssistantError] =
        useState("")

    const {
        report,
        getReportById,
        getResumePdf,
        askAssistant,
    } = useInterview()

    const { interviewId } =
        useParams()

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        }
    }, [interviewId])

    if (!report) {
        return (
            <LoadingScreen
                steps={[
                    "Fetching your interview plan...",
                ]}
                title="Loading"
            />
        )
    }

    const ask = async () => {
        const trimmedQuestion =
            question.trim()

        if (
            !trimmedQuestion ||
            asking
        ) {
            return
        }

        setAssistantError("")
        setAsking(true)

        try {
            const response =
                await askAssistant(
                    interviewId,
                    trimmedQuestion
                )

            /*
             * Only add the question to the
             * conversation if the request
             * successfully returns an answer.
             *
             * This prevents failed questions
             * from appearing repeatedly.
             */
            setChat((previous) => [
                ...previous,
                {
                    q: trimmedQuestion,
                    a: response.answer,
                    sources:
                        response.sources || [],
                },
            ])

            setQuestion("")
        } catch (error) {
            const status =
                error?.response?.status

            let message =
                error?.response?.data
                    ?.message ||
                "Assistant is unavailable right now."

            if (status === 503) {
                message =
                    "The AI service is temporarily busy. Please try again in a few seconds."
            }

            if (status === 429) {
                message =
                    "Too many AI requests were made. Please wait a moment and try again."
            }

            setAssistantError(
                message
            )
        } finally {
            setAsking(false)
        }
    }

    const handleQuestionKeyDown =
        (event) => {
            /*
             * Enter = send
             * Shift + Enter = new line
             */
            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {
                event.preventDefault()

                if (!asking) {
                    ask()
                }
            }
        }

    const handleDownload =
        async () => {
            setDownloading(true)

            try {
                await getResumePdf(
                    interviewId
                )
            } finally {
                setDownloading(false)
            }
        }

    const score =
        report.scoreBreakdown || {}

    return (
        <div className="interview-page">
            <div className="interview-layout">

                <nav className="interview-nav">
                    <div className="nav-content">
                        <p className="interview-nav__label">
                            Sections
                        </p>

                        {NAV.map(
                            ([id, label]) => (
                                <button
                                    key={id}
                                    className={
                                        `interview-nav__item ${
                                            active === id
                                                ? "interview-nav__item--active"
                                                : ""
                                        }`
                                    }
                                    onClick={() =>
                                        setActive(id)
                                    }
                                >
                                    {label}
                                </button>
                            )
                        )}
                    </div>

                    <button
                        className="button primary-button"
                        disabled={
                            downloading
                        }
                        onClick={
                            handleDownload
                        }
                    >
                        {downloading
                            ? "Generating..."
                            : "Download Resume"}
                    </button>
                </nav>

                <div className="interview-divider" />

                <main className="interview-content">

                    {active ===
                        "technical" && (
                        <section>
                            <div className="content-header">
                                <h2>
                                    Technical Questions
                                </h2>

                                <span className="content-header__count">
                                    {
                                        report
                                            .technicalQuestions
                                            .length
                                    }{" "}
                                    questions
                                </span>
                            </div>

                            <div className="q-list">
                                {report.technicalQuestions.map(
                                    (
                                        questionItem,
                                        index
                                    ) => (
                                        <QuestionCard
                                            key={
                                                index
                                            }
                                            item={
                                                questionItem
                                            }
                                            index={
                                                index
                                            }
                                        />
                                    )
                                )}
                            </div>
                        </section>
                    )}

                    {active ===
                        "behavioral" && (
                        <section>
                            <div className="content-header">
                                <h2>
                                    Behavioral Questions
                                </h2>
                            </div>

                            <div className="q-list">
                                {report.behavioralQuestions.map(
                                    (
                                        questionItem,
                                        index
                                    ) => (
                                        <QuestionCard
                                            key={
                                                index
                                            }
                                            item={
                                                questionItem
                                            }
                                            index={
                                                index
                                            }
                                        />
                                    )
                                )}
                            </div>
                        </section>
                    )}

                    {active ===
                        "roadmap" && (
                        <section>
                            <div className="content-header">
                                <h2>
                                    7-Day Preparation
                                    Road Map
                                </h2>
                            </div>

                            <div className="roadmap-list">
                                {report.preparationPlan.map(
                                    (day) => (
                                        <RoadMapDay
                                            key={
                                                day.day
                                            }
                                            day={
                                                day
                                            }
                                        />
                                    )
                                )}
                            </div>
                        </section>
                    )}

                    {active ===
                        "analysis" && (
                        <section>
                            <div className="content-header">
                                <h2>
                                    Explainable Match
                                    Score
                                </h2>
                            </div>

                            <p className="analysis-copy">
                                This score is
                                calculated by
                                application logic,
                                not generated by
                                the LLM.
                            </p>

                            <div className="metric-grid">
                                {[
                                    [
                                        "Skill coverage",
                                        score.skillScore,
                                        50,
                                    ],
                                    [
                                        "Semantic similarity",
                                        score.semanticScore,
                                        25,
                                    ],
                                    [
                                        "Keyword coverage",
                                        score.keywordScore,
                                        15,
                                    ],
                                    [
                                        "Profile completeness",
                                        score.profileScore,
                                        10,
                                    ],
                                ].map(
                                    ([
                                        name,
                                        value,
                                        weight,
                                    ]) => (
                                        <div
                                            className="metric-card"
                                            key={
                                                name
                                            }
                                        >
                                            <b>
                                                {
                                                    name
                                                }
                                            </b>

                                            <strong>
                                                {value ??
                                                    0}
                                                %
                                            </strong>

                                            <small>
                                                {
                                                    weight
                                                }
                                                % weight
                                            </small>
                                        </div>
                                    )
                                )}
                            </div>

                            <h3 className="analysis-heading">
                                Matched skills
                            </h3>

                            <div className="skill-gaps__list">
                                {(
                                    report.matchedSkills ||
                                    []
                                ).map(
                                    (
                                        skill
                                    ) => (
                                        <span
                                            className="skill-tag skill-tag--low"
                                            key={
                                                skill
                                            }
                                        >
                                            {
                                                skill
                                            }
                                        </span>
                                    )
                                )}
                            </div>

                            <h3 className="analysis-heading">
                                Missing skills
                            </h3>

                            <div className="skill-gaps__list">
                                {(
                                    report.missingSkills ||
                                    []
                                ).map(
                                    (
                                        skill
                                    ) => (
                                        <span
                                            className="skill-tag skill-tag--high"
                                            key={
                                                skill
                                            }
                                        >
                                            {
                                                skill
                                            }
                                        </span>
                                    )
                                )}
                            </div>
                        </section>
                    )}

                    {active ===
                        "assistant" && (
                        <section>
                            <div className="content-header">
                                <h2>
                                    Grounded RAG
                                    Assistant
                                </h2>
                            </div>

                            <p className="analysis-copy">
                                Ask questions about
                                this resume and job
                                description. Answers
                                are grounded in
                                retrieved resume/JD
                                chunks stored in
                                pgvector.
                            </p>

                            <div className="rag-chat">
                                {chat.length ===
                                    0 && (
                                    <div className="rag-turn">
                                        <div className="rag-a">
                                            Try asking:
                                            {" "}
                                            “Which
                                            missing
                                            skills
                                            should I
                                            prioritize
                                            for this
                                            job?”
                                        </div>
                                    </div>
                                )}

                                {chat.map(
                                    (
                                        message,
                                        index
                                    ) => (
                                        <div
                                            className="rag-turn"
                                            key={
                                                index
                                            }
                                        >
                                            <div className="rag-q">
                                                {
                                                    message.q
                                                }
                                            </div>

                                            <div className="rag-a">
                                                {
                                                    message.a
                                                }
                                            </div>

                                            {message
                                                .sources
                                                ?.length >
                                                0 && (
                                                <small>
                                                    Retrieved
                                                    from:{" "}
                                                    {[
                                                        ...new Set(
                                                            message.sources.map(
                                                                (
                                                                    source
                                                                ) =>
                                                                    source.sourceType
                                                            )
                                                        ),
                                                    ].join(
                                                        ", "
                                                    )}
                                                </small>
                                            )}
                                        </div>
                                    )
                                )}
                            </div>

                            {assistantError && (
                                <div className="rag-turn">
                                    <div className="rag-a">
                                        {
                                            assistantError
                                        }
                                    </div>
                                </div>
                            )}

                            <div className="rag-input">
                                <textarea
                                    value={
                                        question
                                    }
                                    onChange={(
                                        event
                                    ) => {
                                        setQuestion(
                                            event
                                                .target
                                                .value
                                        )

                                        if (
                                            assistantError
                                        ) {
                                            setAssistantError(
                                                ""
                                            )
                                        }
                                    }}
                                    onKeyDown={
                                        handleQuestionKeyDown
                                    }
                                    disabled={
                                        asking
                                    }
                                    placeholder="e.g. Which missing skills should I prioritize for this job?"
                                />

                                <button
                                    className="button primary-button"
                                    disabled={
                                        asking ||
                                        !question.trim()
                                    }
                                    onClick={
                                        ask
                                    }
                                >
                                    {asking
                                        ? "Thinking..."
                                        : "Ask"}
                                </button>
                            </div>
                        </section>
                    )}

                </main>

                <div className="interview-divider" />

                <aside className="interview-sidebar">
                    <div className="match-score">
                        <p className="match-score__label">
                            {report.title}
                        </p>

                        <div className="match-score__ring score--high">
                            <span className="match-score__value">
                                {
                                    report.matchScore
                                }
                            </span>

                            <span className="match-score__pct">
                                %
                            </span>
                        </div>

                        <p className="match-score__sub">
                            Deterministic +
                            semantic score
                        </p>
                    </div>

                    <div className="sidebar-divider" />

                    <div className="skill-gaps">
                        <p className="skill-gaps__label">
                            Skill Gaps
                        </p>

                        <div className="skill-gaps__list">
                            {(
                                report.skillGaps ||
                                []
                            ).map(
                                (
                                    gap,
                                    index
                                ) => (
                                    <span
                                        key={
                                            index
                                        }
                                        className={`skill-tag skill-tag--${gap.severity}`}
                                    >
                                        {
                                            gap.skill
                                        }
                                    </span>
                                )
                            )}
                        </div>
                    </div>
                </aside>

            </div>
        </div>
    )
}