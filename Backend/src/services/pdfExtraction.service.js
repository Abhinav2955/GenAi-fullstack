const pdfParse = require("pdf-parse")
const Tesseract = require("tesseract.js")

// If normal text extraction returns fewer characters than this, we assume
// the PDF has no real text layer (scanned/image/design-tool export) and
// fall back to OCR.
const MIN_TEXT_LENGTH_THRESHOLD = 100

// If even OCR can't produce meaningful text, we give up and tell the user
// clearly instead of silently generating a blank/broken resume.
const MIN_USABLE_TEXT_LENGTH = 30

/**
 * Extracts text from a resume PDF buffer.
 * 1. Tries standard text extraction (fast, works for normal text-based PDFs).
 * 2. If that yields too little text, falls back to OCR (works for scanned
 *    PDFs, image-based PDFs, or PDFs exported from design tools like Canva
 *    where text is embedded as vector shapes instead of real characters).
 *
 * @param {Buffer} fileBuffer - raw PDF file buffer
 * @returns {Promise<{ text: string, method: "text-layer" | "ocr" }>}
 * @throws {Error} if no usable text could be extracted by either method
 */
async function extractResumeText(fileBuffer) {
    const directResult = await pdfParse.PDFParse
        ? await (new pdfParse.PDFParse(Uint8Array.from(fileBuffer))).getText()
        : await pdfParse(fileBuffer)

    const directText = (directResult.text || "").trim()

    if (directText.length >= MIN_TEXT_LENGTH_THRESHOLD) {
        return { text: directText, method: "text-layer" }
    }

    console.log(`Direct PDF text extraction only yielded ${directText.length} characters — falling back to OCR.`)

    const ocrText = await extractTextViaOcr(fileBuffer)

    if (ocrText.length < MIN_USABLE_TEXT_LENGTH) {
        throw new Error(
            "We couldn't read any usable text from this PDF, even with OCR. " +
            "The file may be corrupted, blank, or too low-resolution to scan. " +
            "Please try re-uploading a clearer copy of your resume."
        )
    }

    return { text: ocrText, method: "ocr" }
}

/**
 * Converts each page of the PDF into an image and runs OCR on it,
 * then joins the recognized text from all pages.
 *
 * pdf-to-img is an ESM-only package, so it's loaded via dynamic import()
 * even though this file is CommonJS.
 */
async function extractTextViaOcr(fileBuffer) {
    const { pdf } = await import("pdf-to-img")

    const document = await pdf(fileBuffer, { scale: 3 })

    let combinedText = ""
    let pageNumber = 0

    for await (const pageImageBuffer of document) {
        pageNumber++
        console.log(`Running OCR on page ${pageNumber}...`)
        const { data } = await Tesseract.recognize(pageImageBuffer, "eng")
        combinedText += data.text + "\n"
    }

    return combinedText.trim()
}

module.exports = { extractResumeText }