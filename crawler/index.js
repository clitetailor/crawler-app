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

  program.version(version, '-v, --version').name('crawler')

  const commands = {}

  commands.crawl = program
    .command('crawl [urls...]')
    .option('-o, --output <output>', 'output directory')
    .action(async (urls, options) => {
      try {
        const crawler = Crawler.init(options)
        
        await crawler.load()
        await crawler.addUrls(urls)
        await crawler.start()
      } catch (error) {
        console.log(chalk.red.inverse(' ERROR '), error)
      }
    })

  program
    .command('help [command]')
    .action(name => {
      const command = commands[name]

      if (command) {
        command.help()
      } else {
        program.help()
      }
    })

  program.parse(process.argv)
}

main()
