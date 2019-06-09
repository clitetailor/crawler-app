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

let outputDir = path.resolve(process.cwd(), 'output')
let siteDir
let cacheFile
setOutputDir(outputDir)

let rateLimitCounter = 0

function setOutputDir(dir) {
  siteDir = path.resolve(dir, 'sites')
  cacheFile = path.resolve(dir, 'cache.yaml')
}

async function downloadSite(siteUrl) {
  const payload = await axios({
    method: 'GET',
    url: encodeURI(siteUrl),
    headers: {
      'Content-Type': 'application/html'
    }
  })

  return payload.data
}

async function saveSiteContent(siteUrl, content) {
  const matchGroup = siteUrl.match(/^https?:\/\/(.+)/)
  const relativePath = matchGroup && matchGroup[1]

  if (relativePath) {
    const filenamified = filenamify(relativePath)

    const storePath = path.resolve(siteDir, filenamified)

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

async function resolveSite(siteUrl) {
  console.log(chalk`{green.inverse  GET } ${siteUrl}`)

  const data = await downloadSite(siteUrl)

  await saveSiteContent(siteUrl, data)

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
    console.log(chalk`{yellow.inverse  INFO }`)
    console.log(`  queue: ${queue.length}`)
    console.log(`  sites: ${siteSet.size}`)

    await timeout(60 * 1000)
    rateLimitCounter = rateLimitCounter + 1
  }
}

async function resolveAll() {
  while (true) {
    const siteUrl = shiftUrl()

    try {
      await resolveSite(siteUrl)
      await checkRateLimit()
    } catch (error) {
      console.log(chalk`{red.inverse  ERROR } ${error.message}`)
      await timeout(60 * 1000)
    }
  }
}

async function loadCache() {
  try {
    if (!(await fs.exists(cacheFile))) {
      return
    }

    const textData = await fs.readFile(cacheFile)
    const data = yaml.safeLoad(textData)

    if (data) {
      siteSet = new Set(data.siteSet)
      queue = data.queue
    }
  } catch (error) {
    console.log(
      chalk`{yellow.inverse  ERROR } ${error.message}`
    )
  }
}

async function saveCache() {
  await fs.ensureFile(cacheFile)

  return fs.writeFile(
    cacheFile,
    yaml.safeDump({
      queue,
      siteSet: Array.from(siteSet)
    })
  )
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

    if (options.output) {
      setOutputDir(options.output)
    }

    await loadCache()
    addUrls(siteUrls.map(addHttps))

    resolveAll()

    process.on('SIGINT', async () => {
      try {
        console.log(chalk`{magenta.inverse  SIGINT }`)

        await saveCache()
      } catch (error) {
        console.log(
          chalk`{red.inverse  ERROR } ${error.message}`
        )
      } finally {
        process.exit()
      }
    })
  } catch (error) {
    console.log(chalk`{red.inverse  ERROR } ${error.message}`)
  }
}

module.exports = {
  crawl
}
