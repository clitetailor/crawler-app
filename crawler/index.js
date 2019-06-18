#!/usr/bin/env node
import program from 'commander'
import path from 'path'
import fs from 'fs-extra'
import chalk from 'chalk'

import { Crawler } from './crawler'

async function main() {
  let version

  try {
    const pkg = JSON.parse(
      await fs.readFile(
        path.resolve(__dirname, '../package.json')
      )
    )

    version = pkg.version
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

  program.command('help [command]').action(name => {
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
