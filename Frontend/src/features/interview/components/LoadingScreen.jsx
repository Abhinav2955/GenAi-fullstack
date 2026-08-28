import React, { useState, useEffect } from 'react'

const DEFAULT_STEPS = [
    "Working on it...",
    "Almost there...",
]

/**
 * Reusable animated loading screen.
 * Pass a custom `steps` array to change the rotating status messages
 * (e.g. report generation vs. resume PDF generation).
 */
const LoadingScreen = ({ steps = DEFAULT_STEPS, title = "Please wait...", footnote = "This may take a few seconds. Please don't close this tab." }) => {
    const [stepIndex, setStepIndex] = useState(0)

    useEffect(() => {
        setStepIndex(0)
        const interval = setInterval(() => {
            setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev))
        }, 2200)
        return () => clearInterval(interval)
    }, [steps])

    const progressPercent = ((stepIndex + 1) / steps.length) * 100

    return (
        <main className='loading-screen'>
            <div className='loading-card'>
                <div className='loading-spinner'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                    </svg>
                </div>

                <h1 className='loading-title'>{title}</h1>
                <p className='loading-step'>{steps[stepIndex]}</p>

                <div className='loading-progress'>
                    <div className='loading-progress__bar' style={{ width: `${progressPercent}%` }} />
                </div>

                <ul className='loading-checklist'>
                    {steps.map((step, i) => (
                        <li key={step} className={i < stepIndex ? 'done' : i === stepIndex ? 'active' : ''}>
                            <span className='loading-checklist__dot' />
                            {step}
                        </li>
                    ))}
                </ul>

                <p className='loading-footnote'>{footnote}</p>
            </div>
        </main>
    )
}

export default LoadingScreen