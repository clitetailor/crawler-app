import readline from 'readline'

export function configureSigInt() {
  if (process.platform === 'win32') {
    const rlInterface = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    rlInterface.on('SIGINT', function() {
      process.emit('SIGINT')
    })
  }
}
