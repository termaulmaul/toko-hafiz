const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const csv = require("csv-parser");

const uploadDir = path.join(__dirname, "../uploads");

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate secure random filename instead of using user input
    const uniqueName = crypto.randomBytes(16).toString("hex");
    cb(null, `${uniqueName}.csv`);
  },
});

const fileFilter = (req, file, cb) => {
  // Sanitize original filename for logging only
  const sanitized = path
    .basename(file.originalname)
    .replace(/[^a-zA-Z0-9._-]/g, "_");

  // Check MIME type - allow more flexible CSV MIME types
  const allowedMimes = [
    "text/csv",
    "application/csv",
    "text/plain",
    "application/vnd.ms-excel", // Sometimes CSV is detected as this
    "text/x-csv",
    "application/x-csv",
  ];

  const hasValidMime = allowedMimes.includes(file.mimetype);
  const hasValidExtension = sanitized.toLowerCase().endsWith(".csv");

  // Accept if either MIME type is valid OR extension is .csv
  if (!hasValidMime && !hasValidExtension) {
    return cb(new Error("Invalid file type. Only CSV allowed."));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
});

/**
 * Validate CSV content for malicious patterns and XSS
 */
const validateCSVContent = (filePath) => {
  return new Promise((resolve, reject) => {
    const dangerousPatterns = [
      /^=/, // Formula injection
      /^@/, // External data reference
      /^[+-]/, // Formula operators
      /<script/i, // XSS
      /javascript:/i, // XSS
      /on\w+\s*=/i, // Event handlers
      /\x00/, // Null bytes
    ];

    const results = [];
    let rowCount = 0;
    const maxRows = 100000; // Prevent DoS via large files

    fs.createReadStream(filePath)
      .pipe(csv({ skipEmptyLines: true, headers: false }))
      .on("data", (data) => {
        rowCount++;

        // Check row limit
        if (rowCount > maxRows) {
          reject(new Error(`CSV exceeds maximum rows (${maxRows})`));
          return;
        }

        // Check each cell for dangerous patterns
        Object.values(data).forEach((value, index) => {
          if (typeof value === "string") {
            for (const pattern of dangerousPatterns) {
              if (pattern.test(value)) {
                reject(
                  new Error(
                    `Malicious content detected in row ${rowCount}, column ${index}`
                  )
                );
              }
            }

            // Check for extremely long values
            if (value.length > 65535) {
              reject(
                new Error(`Value too long in row ${rowCount}, column ${index}`)
              );
            }
          }
        });

        results.push(data);
      })
      .on("end", () => {
        if (rowCount === 0) {
          reject(new Error("CSV file is empty"));
        } else {
          resolve(results);
        }
      })
      .on("error", (err) => {
        reject(new Error(`CSV parsing failed: ${err.message}`));
      });
  });
};

/**
 * Safe file cleanup
 */
const deleteUploadedFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      // Ensure file is within uploads directory to prevent directory traversal
      const realPath = fs.realpathSync(filePath);
      const uploadsPath = fs.realpathSync(uploadDir);

      if (realPath.startsWith(uploadsPath)) {
        fs.unlinkSync(filePath);
        return true;
      }
    }
  } catch (error) {
    console.error("Failed to delete file:", error.message);
  }
  return false;
};

module.exports = {
  upload,
  validateCSVContent,
  deleteUploadedFile,
  uploadDir,
};
