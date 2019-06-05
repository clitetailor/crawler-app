const axios = require('axios')
const cheerio = require('cheerio')
const url = require('url')
const fs = require('fs-extra')
const filenamify = require('filenamify')
const path = require('path')
const chalk = require('chalk')
const yaml = require('js-yaml')

const { timeout } = require('./timer')
const { configureSigInt } = require('./sigint')

let siteSet = new Set()
let queue = []

let outputDir = 'output'
let dataFile = 'crawler.yaml'

let rateLimitCounter = 0

async function downloadSite(siteUrl) {
  const payload = await axios({
    method: 'GET',
    url: siteUrl,
    headers: {
      'Content-Type': 'application/html'
    }
  })

  return payload.data
}

async function storeSiteContent(siteUrl, content) {
  const matchGroup = siteUrl.match(/^https?:\/\/(.+)/)
  const relativePath = matchGroup && matchGroup[1]

  if (relativePath) {
    const currentWorkingDir = process.cwd()
    const filenamifiedRelativePath = filenamify(relativePath)

    const storePath = path.resolve(
      currentWorkingDir,
      outputDir,
      filenamifiedRelativePath
    )

    await fs.ensureFile(storePath)
    await fs.writeFile(storePath, content)
  }
}

function resolveSiteUrl(siteUrl) {
  const parsedUrl = url.parse(siteUrl)
  parsedUrl.search = ''
  parsedUrl.query = ''
  parsedUrl.hash = ''

  return url.format(parsedUrl)
}

function addUrl(siteUrl) {
  const resolvedSiteUrl = resolveSiteUrl(siteUrl)

  if (
    !siteSet.has(resolvedSiteUrl) &&
    matchUrl(resolvedSiteUrl)
  ) {
    queue.push(resolvedSiteUrl)
    siteSet.add(resolvedSiteUrl)

    return true
  }

  return false
}

function addUrls(siteUrls) {
  for (const siteUrl of siteUrls) {
    addUrl(siteUrl)
  }
}

function matchUrl(siteUrl) {
  return siteUrl.match(/^https?:\/\//)
}

function shiftUrl() {
  return queue.shift()
}

async function resolveUrl(siteUrl) {
  console.log(chalk`{green.inverse GET} ${siteUrl}`)

  const data = await downloadSite(siteUrl)

  await storeSiteContent(siteUrl, data)

  const $ = cheerio.load(data, {
    normalizeWhitespace: true,
    xmlMode: false
  })

  const newUrls = $('a[href]')
    .map((index, element) => {
      const relativeUrl = $(element).attr('href')
      const newUrl = url.resolve(siteUrl, relativeUrl)

      return newUrl
    })
    .get()

  addUrls(newUrls)
}

async function checkRateLimit() {
  rateLimitCounter = rateLimitCounter + 1

  if (rateLimitCounter % 50 === 0) {
    console.log(chalk`{yellow.inverse INFO}`)
    console.log(`  queue: ${queue.length}`)
    console.log(`  sites: ${siteSet.size}`)

    await timeout(60 * 1000)
    rateLimitCounter = rateLimitCounter + 1
  }
}

async function resolve() {
  while (true) {
    const siteUrl = shiftUrl()

    try {
      await resolveUrl(siteUrl)
      await checkRateLimit()
    } catch (error) {
      console.log(chalk`{red.inverse ERROR} ${error.message}`)
      await timeout(60 * 1000)
    }
  }
}

async function loadPreviousSession() {
  try {
    const crawlerFilePath = path.resolve(
      process.cwd(),
      dataFile
    )

    if (!fs.exists()) {
      return
    }

    const textData = await fs.readFile(crawlerFilePath)
    const data = yaml.safeLoad(textData)

    if (data) {
      siteSet = new Set(data.siteSet)
      queue = data.queue
    }
  } catch (error) {
    console.log(chalk`{yellow.inverse ERROR} ${error.message}`)
  }
}

function addHttps(siteUrl) {
  if (!siteUrl.match(/^https?:\/\//)) {
    return `https://${siteUrl}`
  }

  return siteUrl
}

async function crawl(siteUrls, options = {}) {
  try {
    configureSigInt()

    outputDir = options.output || outputDir
    dataFile = options.data || dataFile

    await loadPreviousSession()
    addUrls(siteUrls.map(addHttps))

    resolve()

    process.on('SIGINT', async () => {
      console.log(chalk`{magenta.inverse SIGINT}`)

      await fs.writeFile(
        path.resolve(process.cwd(), dataFile),
        yaml.safeDump({
          queue,
          siteSet: Array.from(siteSet)
        })
      )

      process.exit()
    })
  } catch (error) {
    console.log(chalk`{red.inverse ERROR} ${error.message}`)
  }
}

module.exports = {
  crawl
}
