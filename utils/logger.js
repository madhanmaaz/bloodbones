const path = require("path")
const fs = require('fs')

const LOG_LEVELS = {
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    DEBUG: 'DEBUG'
}

let logFilePath = null
function setLogFile(filePath) {
    if (filePath == null) return
    logFilePath = path.join(process.cwd(), filePath)
}

function log(message, level = LOG_LEVELS.INFO) {
    const timestamp = new Date().toISOString()
    const formattedMessage = `[${timestamp}] [${level}]: ${message}`

    // Log to console based on the level
    switch (level) {
        case LOG_LEVELS.DEBUG:
            console.debug(formattedMessage)
            break;
        case LOG_LEVELS.INFO:
            console.info(formattedMessage)
            break;
        case LOG_LEVELS.WARN:
            console.warn(formattedMessage)
            break;
        case LOG_LEVELS.ERROR:
            console.error(formattedMessage)
            break;
        default:
            console.log(formattedMessage)
    }

    if (logFilePath) {
        fs.appendFile(logFilePath, `${formattedMessage}\n`, (err) => {

        })
    }
}

module.exports = {
    LOG_LEVELS,
    log,
    setLogFile
}