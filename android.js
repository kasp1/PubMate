const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function consoleQuestion(message) {
  return new Promise((resolve, reject) => {
      rl.question(message, (reply) => {
      resolve(reply)
      rl.close()
    })
  })
}

module.exports = {
  findZipAligner () {
    return new Promise((resolve, reject) => {
      g.log('Looking for the zip align tool...')

      let sdkPath = ''

      if (process.env.ANDROID_HOME) {
        sdkPath = process.env.ANDROID_HOME
      } else {
        log('Can\'t get the ANDROID_HOME environment variable, you better sort it out and re-run this.')
        log('Or paste your Android SDK root path here:')
        consoleQuestion()
      }

      sdkPath = path.normalize(sdkPath)

      if ((sdkPath.slice(-1) == '/') || (sdkPath.slice(-1) == '/')) {
        sdkPath = sdkPath.slice(0, sdkPath.length)
      }

      if (!fs.existsSync(path.normalize(sdkPath + '/build-tools'))) {
        g.fatal('The build tools directory is non-existend in your Android SDK. How ancient SDK is this? Update it and re-run this.')
      }

      if (fs.existsSync('config.xml') && fs.existsSync('www')) {
        g.log('Good.')
        resolve()
      } else {
        g.fatal('Where else would you like to run this than in a Cordova project directory? Go there first.')
      }
    })
  }
}