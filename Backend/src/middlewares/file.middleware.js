const multer = require('multer')
const AppError = require('../utils/AppError')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') return cb(new AppError('Only PDF resumes are supported.', 400))
    cb(null, true)
  },
})
module.exports = upload
