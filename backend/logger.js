const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = {
  error: path.join(logsDir, 'error.log'),
  security: path.join(logsDir, 'security.log'),
  access: path.join(logsDir, 'access.log'),
  combined: path.join(logsDir, 'combined.log')
};

/**
 * Format log entry with timestamp and metadata
 */
function formatLog(level, message, metadata = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...metadata
  });
}

/**
 * Write log to file
 */
function writeLog(filename, content) {
  try {
    fs.appendFileSync(filename, content + '\n');
  } catch (error) {
    console.error('Failed to write log:', error.message);
  }
}

/**
 * Log error events
 */
function logError(message, error, metadata = {}) {
  const logEntry = formatLog('ERROR', message, {
    error: error.message,
    stack: error.stack,
    ...metadata
  });

  console.error(`[ERROR] ${message}`, error.message);
  writeLog(logFile.error, logEntry);
  writeLog(logFile.combined, logEntry);
}

/**
 * Log security events
 */
function logSecurity(event, details = {}) {
  const logEntry = formatLog('SECURITY', event, details);

  console.log(`[SECURITY] ${event}`);
  writeLog(logFile.security, logEntry);
  writeLog(logFile.combined, logEntry);
}

/**
 * Log access events
 */
function logAccess(method, path, statusCode, duration, user = null) {
  const logEntry = formatLog('ACCESS', `${method} ${path}`, {
    statusCode,
    duration,
    user: user ? `user_${user.id}` : 'anonymous',
    role: user ? user.role : 'guest'
  });

  writeLog(logFile.access, logEntry);
  writeLog(logFile.combined, logEntry);
}

/**
 * Log info messages
 */
function logInfo(message, metadata = {}) {
  const logEntry = formatLog('INFO', message, metadata);

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[INFO] ${message}`);
  }
  writeLog(logFile.combined, logEntry);
}

/**
 * Log authentication events
 */
function logAuth(event, username, success, metadata = {}) {
  const logEntry = formatLog('AUTH', event, {
    username,
    success,
    ip: metadata.ip,
    userAgent: metadata.userAgent,
    ...metadata
  });

  console.log(`[AUTH] ${event} for ${username}: ${success ? 'SUCCESS' : 'FAILED'}`);
  writeLog(logFile.security, logEntry);
  writeLog(logFile.combined, logEntry);
}

/**
 * Log data operations
 */
function logDataOp(operation, table, recordId, user, metadata = {}) {
  const logEntry = formatLog('DATA_OP', operation, {
    table,
    recordId,
    user: user ? `user_${user.id}` : 'system',
    ...metadata
  });

  writeLog(logFile.combined, logEntry);
  if (operation === 'DELETE' || operation === 'DROP') {
    writeLog(logFile.security, logEntry);
  }
}

module.exports = {
  logError,
  logSecurity,
  logAccess,
  logInfo,
  logAuth,
  logDataOp,
  formatLog,
  writeLog,
  logsDir
};
