const child_process = require("child_process")
const dns = require("dns/promises")
const path = require("path")
const ejs = require("ejs")
const fs = require("fs")
const nodeURL = require("url")
const logger = require("./logger")

const PAGE_HTML_PATH = path.join(process.__dirname || process.cwd(), "views", "page.ejs")

async function resolveIP(hostname) {
    try {
        const lookup = await dns.lookup(new nodeURL.URL(hostname).hostname)
        return lookup.address
    } catch (error) {
        return `Failed to relove ip for ${hostname} - ${error.message}`
    }
}

function createReportSlot() {
    try {
        const date = new Date()
        const id = `${date.toLocaleDateString()}-${date.toLocaleTimeString()}`.trim().replace(/['/\\,": ]/g, "_")
        const root = path.join(process.cwd(), id)
        const folders = {
            shots: path.join(root, "shots"),
            pages: path.join(root, "pages"),
            sourceCode: path.join(root, "src"),
        }

        Object.values(folders).forEach((folder) => {
            fs.mkdirSync(folder, { recursive: true })
        })

        return { id, folders, root }
    } catch (error) {
        logger.log(`Failed to mkdir. ${error.message}`, logger.LOG_LEVELS.ERROR)
        console.log(error)
    }
}

async function writeHTML(filePath, data) {
    try {
        const html = await ejs.renderFile(PAGE_HTML_PATH, data)
        fs.writeFileSync(filePath, html, "utf-8")
    } catch (error) {
        logger.log(`Failed to write. ${filePath} - ${error.message}`, logger.LOG_LEVELS.ERROR)
    }
}

async function writeSRC(filePath, data) {
    try {
        fs.writeFileSync(filePath, data, "utf-8")
    } catch (error) {
        logger.log(`Failed to write. ${filePath} - ${error.message}`, logger.LOG_LEVELS.ERROR)
    }
}

function checkUrls(urls) {
    return urls.map(url => {
        if (url.includes(".")) {
            if (url.startsWith("http")) {
                return url
            } else {
                return `https://${url}`
            }
        }
    }).filter(url => url != null)
}

function readUrls(filePath) {
    filePath = path.resolve(filePath)
    if (!fs.existsSync(filePath)) {
        logger.log(`File not found. ${filePath}`, logger.LOG_LEVELS.ERROR)
        process.exit(1)
    }

    try {
        const data = fs.readFileSync(filePath, "utf-8")
        try {
            return JSON.parse(data)
        } catch (error) {
            console.log(error)
            return data.split("\n")
        }
    } catch (error) {
        logger.log(`Unable to read. ${filePath}`, logger.LOG_LEVELS.ERROR)
        process.exit(1)
    }
}

function opener(htmlPath) {
    const command = process.platform === "win32"
        ? `start "" "${htmlPath}"`
        : process.platform === "darwin"
            ? `open "${htmlPath}"`
            : `xdg-open "${htmlPath}"`

    try {
        child_process.execSync(command)
        logger.log(`Successfully opened file: ${htmlPath}`)
    } catch (error) {
        logger.log(`Failed to open file: ${htmlPath} - ${error.message}`, logger.LOG_LEVELS.ERROR);
    }
}

module.exports = {
    writeHTML,
    writeSRC,
    checkUrls,
    readUrls,
    createReportSlot,
    opener,
    resolveIP
}