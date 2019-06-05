const readline = require('readline')

function configureSigInt() {
  if (process.platform === 'win32') {
    const interface = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    interface.on('SIGINT', function() {
      process.emit('SIGINT')
    })
  }
}

module.exports = {
  configureSigInt
}
