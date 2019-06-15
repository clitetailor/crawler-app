#!/usr/bin/env node
const program = require('commander')
const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')

const { Crawler } = require('./crawler')

async function main() {
  let version

  try {
    const package = JSON.parse(
      await fs.readFile(
        path.resolve(__dirname, '../package.json')
      )
    )

    version = package.version
  } catch (error) {
    version = '1.0.0'
  }

  program
    .version(version, '-v, --version')
    .name('crawler')
    .command('crawl [urls...]')
    .option('-o, --output <output>', 'output directory')
    .action(async urls => {
      try {
        const crawler = Crawler.init(program)
        crawler.addUrls(urls)

        await crawler.crawl()
      } catch (error) {
        console.log(chalk.red.inverse(' ERROR '), error)
      }
    })

  program.parse(process.argv)
}

main()
