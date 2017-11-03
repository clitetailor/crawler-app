const Spider = require('./spider');
const filenamify = require('filenamify');
const program = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

program.version('0.1.0')
  .usage('[options] <domains>', 'Crawl a list of domains')  
  .option('-o --output', 'Specify the output directory')
  .option('-w --wait', 'The duration of waiting time between each chunks')
  .option('-n --number', 'The number of pages will be crawl')
  .option('-q --queue-size', 'The queue size')
  .option('-c --chunk', 'The chunk size')
  .option('--cache', 'The name of the cache file');

class Natio extends Spider {
  constructor() {
    super();
    this.waitingTime = program.wait || 100;
    this.maxCounter = program.number || 5000;
    this.maxQueueSize = program.queueSize || 1000;
    this.chunkSize = program.chunkSize || 10;
    this.bootstrapLinks = program.args;
    this.directory = program.output || './output';
  }

  crawlerOnInit() {
    if (!fs.existsSync(this.directory)) {
      fs.mkdir(this.directory, (err) => {
        if (err) {
          console.log(chalk.bgRed('ERROR: '), err);
          this.stop = true;

          return;
        }

        if (!fs.existsSync(this.directory)) {
          this.stop = true;
        }
      });
      this.stop = true;
    }
  }

  beforeSendingRequest(link) {
    console.log(chalk.bgYellow('SENDING REQUEST: ') + link);
  }

  render($, document, link) {
    console.log(chalk.bgGreen('RENDERING: '), link);

    // Maximum 5000 link.
    if (this.counter >= this.maxCounter) {
      this.stop = true;
    }

    const encodedLink = filenamify(link);

    const filename = path.resolve(this.directory, encodedLink);
    fs.writeFile(filename, document);
  }

  handleError(err) {
    console.log(chalk.bgRed('FAILED: '), err);
  }
}

module.exports = Natio;