const puppeteerBrowsers = require('@puppeteer/browsers')
const puppeteer = require("puppeteer-core")
const dns = require("dns/promises")
const logger = require("./logger")
const path = require("path")
const os = require("os")
const fs = require("fs")

const BROWSER_FOLDER = path.join(process.__dirname, "browsers")
const BROWSER_BUILDS = {
    [puppeteerBrowsers.Browser.CHROME]: "133.0.6912.0",
    [puppeteerBrowsers.Browser.CHROMIUM]: "1399715",
}

async function getExecutablePath(browser) {
    const buildId = BROWSER_BUILDS[browser]
    const executablePath = puppeteerBrowsers.computeExecutablePath({
        browser,
        buildId,
        cacheDir: BROWSER_FOLDER,
    })

    if (!fs.existsSync(executablePath)) {
        try {
            logger.log(`Browser not installed. Wait installing ${browser}-${buildId}.`)
            await puppeteerBrowsers.install({
                browser,
                cacheDir: BROWSER_FOLDER,
                buildId,
            })
            logger.log("Browser installed.")
        } catch (error) {
            logger.log(`Failed to install browser. ${error.message}`, logger.LOG_LEVELS.ERROR)
            console.log(error)
            process.exit(1)
        }
    }

    return executablePath
}

async function openBrowser(options) {
    try {
        const userDataDir = path.join(os.homedir(), "bloodbones-chrome")
        const executablePath = await getExecutablePath(options.browser)
        const [width, height] = options.viewport.split("x")

        // creating args
        const args = [
            // '--disable-web-security',
            // '--ignore-certificate-errors',
        ]

        if (options.headless) {
            args.push(`--headless`)
        }

        if (options.proxy) {
            args.push(`--proxy-server=${options.proxy}`)
        }

        const browserWindow = await puppeteer.launch({
            executablePath,
            headless: options.headless,
            defaultViewport: {
                width: Number(width) || 1920,
                height: Number(height) || 1080,
                isLandscape: options.landscape,
                isMobile: options.mobile
            },
            userDataDir,
            args,
            ignoreDefaultArgs: true
        })

        return browserWindow
    } catch (error) {
        logger.log(`Failed to open browser. ${error.message}`, logger.LOG_LEVELS.ERROR)
        console.log(error)
        process.exit(1)
    }
}

// creating pages
async function createPages(browser, pageLength) {
    try {
        for (let index = 0; index < (pageLength - 1); index++) {
            await browser.newPage()
        }

        return await browser.pages()
    } catch (error) {
        logger.log(`Failed to create pages. ${error.message}`, logger.LOG_LEVELS.ERROR)
        console.log(error)
        process.exit(1)
    }
}


module.exports = {
    openBrowser,
    createPages
}