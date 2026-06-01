const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Set upload directory
const uploadDir = path.join(__dirname, "../uploads");

// Create folder if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // Append timestamp to avoid overwriting
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// File filter (optional, restrict to images)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
