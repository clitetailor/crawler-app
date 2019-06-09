#!/usr/bin/env node
const program = require('commander')
const path = require('path')
const fs = require('fs-extra')

const { crawl } = require('./crawl')

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
    .version(version)
    .name('crawler')
    .arguments('[urls...]')
    .option('-o, --output <output>', 'output directory')
    .action(urls => {
      crawl(urls, program)
    })

  program.parse(process.argv)
}

main()
