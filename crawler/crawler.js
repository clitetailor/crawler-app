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

class Crawler {
  constructor(options = {}) {
    this.sites = options.sites || new Set()
    this.queue = options.queue || []

    this.outputDir = options.outputDir
    this.siteDir = options.siteDir
    this.cacheDir = options.cacheDir

    this.rateLimitCounter = options.rateLimitCounter || 0
  }

  static init(options) {
    const crawler = new Crawler({})

    crawler.setOutputDir(options.output || 'output')

    return crawler
  }

  setOutputDir(dir) {
    const cwd = process.cwd()

    this.siteDir = path.resolve(cwd, dir, 'sites')
    this.cacheFile = path.resolve(cwd, dir, 'cache.yaml')
  }

  addUrl(siteUrl) {
    const resolvedSiteUrl = this.resolveSiteUrl(siteUrl, {
      search: false,
      query: false,
      hash: false
    })

    if (
      !this.sites.has(resolvedSiteUrl) &&
      this.matchUrl(resolvedSiteUrl)
    ) {
      this.queue.push(resolvedSiteUrl)
      this.sites.add(resolvedSiteUrl)

      return true
    }

    return false
  }

  addUrls(siteUrls) {
    siteUrls.map(this.addHttps.bind(this))

    for (const siteUrl of siteUrls) {
      this.addUrl(siteUrl)
    }
  }

  async crawl() {
    try {
      configureSigInt()
      await this.loadCache()

      const resolvable = this.resolveAll()

      process.on('SIGINT', async () => {
        try {
          console.log(chalk.magenta.inverse(' SIGINT '))
          await this.saveCache()
        } catch (error) {
          console.log(chalk.red.inverse(' ERROR '), error.stack)
        } finally {
          process.exit()
        }
      })

      await resolvable
    } catch (error) {
      console.log(chalk.red.inverse(' ERROR '), error.stack)
    }
  }

  async downloadSite(siteUrl) {
    const payload = await axios({
      method: 'GET',
      url: encodeURI(siteUrl),
      headers: {
        'Content-Type': 'application/html'
      }
    })

    return payload.data
  }

  async saveSiteContent(siteUrl, content) {
    const matchGroup = siteUrl.match(/^https?:\/\/(.+)/)
    const relativePath = matchGroup && matchGroup[1]

    if (relativePath) {
      const filenamified = filenamify(relativePath)

      const storePath = path.resolve(this.siteDir, filenamified)

      await fs.ensureFile(storePath)
      await fs.writeFile(storePath, content)
    }
  }

  resolveSiteUrl(siteUrl, options = {}) {
    const parsedUrl = url.parse(siteUrl)

    if (!options.search) {
      parsedUrl.search = ''
    }

    if (!options.query) {
      parsedUrl.query = ''
    }

    if (!options.hash) {
      parsedUrl.hash = ''
    }

    return url.format(parsedUrl)
  }

  matchUrl(siteUrl) {
    return siteUrl.match(/^https?:\/\//)
  }

  shiftUrl() {
    return this.queue.shift()
  }

  async resolveSite(siteUrl) {
    console.log(chalk.green.inverse(' GET '), siteUrl)

    const data = await this.downloadSite(siteUrl)

    await this.saveSiteContent(siteUrl, data)

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

    this.addUrls(newUrls)
  }

  async checkRateLimit() {
    this.rateLimitCounter = this.rateLimitCounter + 1

    if (this.rateLimitCounter % 50 === 0) {
      console.log(chalk.yellow.inverse(' INFO '))
      console.log(`  queue: ${this.queue.length}`)
      console.log(`  sites: ${this.sites.size}`)

      await timeout(60 * 1000)
      this.rateLimitCounter = this.rateLimitCounter + 1
    }
  }

  async resolveAll() {
    while (true) {
      const siteUrl = this.shiftUrl()

      try {
        await this.resolveSite(siteUrl)
        await this.checkRateLimit()
      } catch (error) {
        console.log(chalk.red.inverse(' ERROR '), error.stack)
        await timeout(60 * 1000)
      }
    }
  }

  async loadCache() {
    try {
      if (!(await fs.exists(this.cacheFile))) {
        return
      }

      const textData = await fs.readFile(this.cacheFile)
      const data = yaml.safeLoad(textData)

      if (data) {
        const sites = new Set(data.sites)
        const queue = data.queue

        this.sites = sites
        this.queue = queue
      }
    } catch (error) {
      console.log(chalk.yellow.inverse(' ERROR '), error.stack)
    }
  }

  async saveCache() {
    const cacheFile = this.cacheFile
    const queue = this.queue
    const sites = Array.from(this.sites)

    await fs.ensureFile(cacheFile)

    return fs.writeFile(
      cacheFile,
      yaml.safeDump({
        queue,
        sites
      })
    )
  }

  addHttps(siteUrl) {
    if (!siteUrl.match(/^https?:\/\//)) {
      return `https://${siteUrl}`
    }

    return siteUrl
  }
}

module.exports = {
  Crawler
}
