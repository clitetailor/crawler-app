const cheerio = require('cheerio')
const url = require('url')
const chalk = require('chalk')

const { timeout } = require('./timer')
const { configureSigInt } = require('./sigint')
const { preprocessUrl, addHttps } = require('./url')
const { downloadSite } = require('./download')
const { FileStore } = require('./db/fs')

class Crawler {
  constructor(options = {}) {
    this.store = options.store
    this.rateLimitCounter = options.rateLimitCounter || 0
  }

  static init(options = {}) {
    const crawler = new Crawler()
    const fileStore = FileStore.init(options)

    crawler.setStore(fileStore)

    return crawler
  }

  setStore(store) {
    this.store = store
  }

  async start(options) {
    try {
      configureSigInt()
      await this.store.load()

      process.on('SIGINT', async () => {
        try {
          console.log(chalk.magenta.inverse(' SIGINT '))
          await this.store.save()
        } catch (error) {
          console.log(chalk.red.inverse(' ERROR '), error.stack)
        } finally {
          process.exit()
        }
      })

      await this.fetchAll(options)
    } catch (error) {
      console.log(chalk.red.inverse(' ERROR '), error.stack)
    }
  }

  async fetchAll(options = {}) {
    while (true) {
      const siteUrl = await this.store.shiftUrl()

      if (!siteUrl) {
        return
      }

      if (options.guard && !options.guard()) {
        return
      }

      try {
        await this.fetch(siteUrl)
        await this.checkRateLimit()
      } catch (error) {
        console.log(chalk.red.inverse(' ERROR '), error.stack)
        await timeout(60 * 1000)
      }
    }
  }

  async fetch(siteUrl) {
    console.log(chalk.green.inverse(' GET '), siteUrl)

    const data = await downloadSite(siteUrl)

    await this.store.storeSiteContent(siteUrl, data)

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

    await this.addUrls(newUrls)
  }

  async addUrl(siteUrl) {
    const preprocessedUrl = preprocessUrl(addHttps(siteUrl), {
      search: false,
      query: false,
      hash: false
    })

    await this.store.addUrl(preprocessedUrl)
  }

  async addUrls(siteUrls) {
    const preprocessedUrls = siteUrls
      .map(addHttps)
      .map(preprocessUrl)

    await this.store.addUrls(preprocessedUrls)
  }

  async checkRateLimit() {
    this.rateLimitCounter = this.rateLimitCounter + 1

    if (this.rateLimitCounter % 50 === 0) {
      console.log(chalk.yellow.inverse(' INFO '))

      const info = await this.store.info()
      console.log(`  queue: ${info.queue}`)
      console.log(`  sites: ${info.sites}`)

      await timeout(60 * 1000)
      this.rateLimitCounter = this.rateLimitCounter + 1
    }
  }
}

module.exports = {
  Crawler
}
