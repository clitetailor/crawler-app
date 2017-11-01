const program = require('commander');

program
  .version('0.1.0')
  .usage('[options] <domains ...>')
  .parse(process.argv);

const bootstrapLinks = program.args.slice();

const Spider = require('./spider');

const spider = new Spider();
spider.run();