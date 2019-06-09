const program = require('commander')

const { crawl } = require('./crawl')

async function main() {
  try {
    const package = await fs.readFile(
      path.resolve(__dirname, '../package.json')
    )

    program.version(package.version)
  } catch (error) {
    program.version('1.0.0')
  }

  program
    .arguments('[urls...]')
    .option('-o, --output <output>', 'output directory')
    .action(urls => {
      crawl(urls, program)
    })

  program.parse(process.argv)
}

main()
