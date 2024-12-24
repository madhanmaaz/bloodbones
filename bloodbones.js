process.__dirname = __dirname
require("./utils/banner")
const path = require("path")
const fs = require("fs")

const logger = require("./utils/logger")
const args = require("./utils/args")
logger.setLogFile(args.logFile)

const helpers = require("./utils/helpers")
const browser = require("./utils/browser")

let currentUrlIndex = 0
let successCount = 0
let failCount = 0

async function processTask({ page, urls, taskId, reportProps }) {
    page.setDefaultNavigationTimeout(args.timeout * 1000)

    while (currentUrlIndex < urls.length) {
        const realIndex = currentUrlIndex + 1
        const url = urls[currentUrlIndex]
        currentUrlIndex++

        const screenshotPath = path.join(
            reportProps.folders.shots,
            `${realIndex}.${args.imgFormat}`
        )
        const pageHTMLPath = path.join(
            reportProps.folders.pages,
            `${realIndex}.html`
        )
        const sourceCodePath = path.join(
            reportProps.folders.sourceCode,
            `${realIndex}.txt`
        )

        try {
            if (args.useragent) {
                await page.setUserAgent(args.useragent)
            }

            page.on('response', async (response) => {
                if (!response.url().startsWith(url)) return

                const headers = await response.headers()
                let ip = ""
                if (args.resolve) {
                    ip = await helpers.resolveIP(url)
                }
                // writing html
                helpers.writeHTML(
                    pageHTMLPath,
                    {
                        index: realIndex,
                        url,
                        headers,
                        length: urls.length,
                        imgFormat: args.imgFormat,
                        ip
                    }
                )
            })

            await page.goto(url, { waitUntil: "networkidle0" })
            await new Promise(resolve => setTimeout(resolve, args.delay * 1000))
            await page.screenshot({
                type: args.imgFormat,
                quality: args.imgQuality,
                optimizeForSpeed: true,
                path: screenshotPath
            })

            // writing source code
            const html = await page.content()
            helpers.writeSRC(
                sourceCodePath,
                html
            )

            successCount++
            logger.log(`[${realIndex}/${urls.length}] - ${url}`)
        } catch (error) {
            failCount++
            logger.log(
                `(${realIndex}/${urls.length}) - ${url} - ${error.message}`,
                logger.LOG_LEVELS.ERROR
            )
            helpers.writeHTML(
                pageHTMLPath,
                {
                    index: realIndex,
                    url,
                    headers: {},
                    length: urls.length,
                    imgFormat: args.imgFormat,
                    ip: ""
                }
            )
        }
    }

    await page.close()
}

// main entry
async function main() {
    const performanceStart = performance.now()
    let urls = helpers.checkUrls(args.url || [])
    if (args.file) {
        urls = helpers.checkUrls(helpers.readUrls(args.file))
    }

    const browserWindow = await browser.openBrowser(args)
    // ;(await browserWindow.newPage())
    const pages = await browser.createPages(browserWindow, args.threads)
    const reportProps = helpers.createReportSlot()

    const tasks = Array.from({ length: args.threads }, function (_, index) {
        return processTask({
            urls,
            page: pages[index],
            taskId: index + 1,
            reportProps
        })
    })

    await Promise.all(tasks)

    const performanceEnd = performance.now()
    const durationMs = performanceEnd - performanceStart
    const durationSeconds = durationMs / 1000
    const htmlPath = path.join(reportProps.folders.pages, "1.html")
    const result = `
=== Report Summary ===
Duration        : ${durationSeconds.toFixed(2)}s | ${durationMs.toFixed(2)}ms
Total Urls      : ${urls.length}
Total Success   : ${successCount}
Total Failures  : ${failCount}
Report saved at : ${reportProps.root}
Entry file      : ${htmlPath}

=== Settings ===
Threads         : ${args.threads}
Proxy           : ${args.proxy || ""}
Resolve         : ${args.resolve}
Delay           : ${args.delay}
Timeout         : ${args.timeout}
Open            : ${args.open}

=== Browser Options ===
Browser         : ${args.browser}
Headless        : ${args.headless}
Image format    : ${args.imgFormat}
Image quality   : ${args.imgQuality}
Mobile          : ${args.mobile}
Landscape       : ${args.landscape}
Viewport        : ${args.viewport}
Useragent       : ${args.useragent || ""}
`
    console.log(result)
    fs.writeFileSync(path.join(reportProps.root, "done.txt"), result, "utf-8")
    await browserWindow.close()

    if (args.open) {
        if (fs.existsSync(htmlPath)) {
            helpers.opener(htmlPath)
        }
    }
    process.exit(0)
}

main()