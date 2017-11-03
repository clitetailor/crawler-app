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
  .option('-c --chunk', 'The chunk size');

program.parse(process.argv);

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
          console.log(chalk.white.bgRed('ERROR: '), err);
          this.stop = true;

          return;
        }

        if (!fs.existsSync(this.directory)) {
          this.stop = true;
        }
      });
      this.stop = true;
    }
    console.log(chalk.white.bgGreen('STARTUP'));
  }

  beforeSendingRequest(link) {
    console.log(chalk.white.bgYellow('SENDING REQUEST:'), link);
  }

  sendRequest(link) {
    if (!fs.existsSync(filenamify(link))) {
      return super.sendRequest(link);
    }
    return Promise.reject(chalk.bgYellow('WARNING: '), `Link ${link} has been crawled!`);
  }

  render($, document, link) {
    console.log(chalk.white.bgGreen('RENDERING:'), link);

    // Maximum 5000 link.
    if (this.counter >= this.maxCounter) {
      this.stop = true;
    }

    const encodedLink = filenamify(link);

    const filename = path.resolve(this.directory, encodedLink);
    fs.writeFile(filename, document);
  }

  crawlerOnFinish() {
    console.log(chalk.white.bgBlue('FINISH'));
  }

  handleError(err) {
    console.log(chalk.white.bgRed('FAILED:'), err);
  }
}

module.exports = Natio;