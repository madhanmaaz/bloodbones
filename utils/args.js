const yargs = require("yargs/yargs")
const { hideBin } = require("yargs/helpers")

const terminalWidth = 110

module.exports = yargs(hideBin(process.argv))
    // Input Options
    .option("url", {
        alias: "u",
        type: "array",
        description: "Specify target URLs.",
    })
    .option("file", {
        alias: "f",
        type: "string",
        description: "Specify a file containing target URLs.",
    })

    // Settings Options
    .option("threads", {
        alias: "t",
        type: "number",
        description: "Number of concurrent tasks to run.",
        default: 1,
    })
    .option("proxy", {
        type: "string",
        description: "Specify a proxy server (e.g., http://127.0.0.1:8080).",
    })
    .option("log-file", {
        type: "string",
        description: "Path to save log files.",
    })
    .option("resolve", {
        type: "boolean",
        description: "Resolve IP/hostname for targets.",
        default: false,
    })
    .option("delay", {
        type: "number",
        description: "Delay (in seconds) before taking screenshots.",
        default: 0.2,
    })
    .option("timeout", {
        type: "number",
        description: "Navigation timeout (in seconds).",
        default: 20,
    })

    // Browser Options
    .option("browser", {
        type: "string",
        description: "Specify browser to use (e.g., chrome, chromium).",
        default: "chromium",
    })
    .option("headless", {
        type: "boolean",
        description: "Run the browser in headless mode.",
        default: true,
    })
    .option("img-format", {
        type: "string",
        description: "Format for screenshots (e.g., jpeg, png).",
        default: "jpeg",
    })
    .option("img-quality", {
        type: "number",
        description: "Quality of screenshots (1-100).",
        default: 90,
    })
    .option("mobile", {
        type: "boolean",
        description: "Simulate a mobile device viewport.",
        default: false,
    })
    .option("landscape", {
        type: "boolean",
        description: "Take screenshots in landscape orientation.",
        default: true,
    })
    .option("viewport", {
        type: "string",
        description: "Specify viewport dimensions (e.g., 1920x1080).",
        default: "1920x1080",
    })
    .option("useragent", {
        type: "string",
        description: "Set a custom user agent for the browser.",
    })
    .option("open", {
        type: "boolean",
        default: false,
        description: "Open the repoer in browser.",
    })

    // General Options
    .option("help", {
        alias: "h",
        description: "Show help menu.",
    })

    // Group options for clarity
    .group(["url", "file"], "Input Options:")
    .group(["threads", "proxy", "resolve", "log-file", "delay", "timeout", "open"], "Settings:")
    .group(["browser", "headless", "img-format", "img-quality", "mobile", "landscape", "viewport", "useragent"], "Browser Options:")
    .group(["help", "version"], "General Options:")

    // Adjust text wrapping to terminal width
    .wrap(terminalWidth)

    // Validation
    .check((argv) => {
        if (!argv.url && !argv.file) {
            throw new Error("You must specify either --url or --file [options].");
        }
        if (argv["img-quality"] < 1 || argv["img-quality"] > 100) {
            throw new Error("Image quality must be between 1 and 100.");
        }
        if (argv.threads < 1) {
            throw new Error("Threads must be at least 1.");
        }
        return true;
    })

    // Usage and Examples
    .usage("Usage: $0 [options]")
    .example("$0 --url https://example.com https://example2.com", "Take a screenshot of the specified URLs.")
    .example("$0 --file ./urls.txt", "Take a screenshot of URLs listed in the specified file.")
    .help()
    .alias("help", "h")
    .argv;