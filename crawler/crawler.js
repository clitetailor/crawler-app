import cheerio from 'cheerio'
import url from 'url'
import chalk from 'chalk'

import { timeout } from './timer'
import { configureSigInt } from './sigint'
import { preprocessUrl, addHttps } from './url'
import { downloadSite } from './download'
import { SequelizeStore } from './db/sequelize'

export class Crawler {
  constructor(options = {}) {
    this.store = options.store
    this.rateLimitCounter = options.rateLimitCounter || 0
  }

  static init(options = {}) {
    const crawler = new Crawler()

    const sequelizeStore = SequelizeStore.init({
      dialect: 'postgres',
      database: 'postgres',
      username: 'postgres',
      password: 'postgres',
      host: '192.168.99.100',
      port: 5432
    })

    crawler.setStore(sequelizeStore)

    return crawler
  }

  setStore(store) {
    this.store = store
  }

  async start(options) {
    try {
      configureSigInt()
      process.on('SIGINT', async () => {
        try {
          console.log(chalk.magenta.inverse(' SIGINT '))
          await this.save()
        } catch (error) {
          console.log(chalk.red.inverse(' ERROR '), error.stack)
        } finally {
          process.exit()
        }
      })

      await this.fetchAll(options)

      process.exit()
    } catch (error) {
      console.log(chalk.red.inverse(' ERROR '), error.stack)
    }
  }

  async load() {
    return this.store.load()
  }

  async save() {
    return this.store.save()
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

    await this.store.saveSiteContent(siteUrl, data)

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
      this.save()

      console.log(chalk.yellow.inverse(' INFO '))

      const pending = await this.store.pendingSiteCount()
      const resolved = await this.store.resolvedSiteCount()
      console.log(`    Pending:  ${pending}`)
      console.log(`    Resolved: ${resolved}`)
      console.log(`    Total:    ${pending + resolved}`)

      await timeout(60 * 1000)
      this.rateLimitCounter = this.rateLimitCounter + 1
    }
  }
}
