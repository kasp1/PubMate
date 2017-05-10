const fs = require('fs')

module.exports = {
  buildConfig: null,

  checkBuildConfig () {
    return new Promise((resolve, reject) => {
      g.log("Let's check this buildConfig thing...")

      let pubMateJson = g.readPubmateJson()

      if (fs.existsSync(pubMateJson.ios.buildConfig)) {
        g.steps.ios.buildConfig = pubMateJson.ios.buildConfig
      } else {
        if (readlineSync.question('Do you have any buildConfig file for iOS? (Y/n): ') === 'Y') {
          let customBuildConfig = path.normalize(readlineSync.question('What is the path?: '))

          if (fs.existsSync(customBuildConfig)) {
            g.steps.ios.buildConfig = customBuildConfig
          } else {
            g.fatal("This file doesn't exist. Sort yourself and your build config and try again.")
          }
        } else {
          if (readlineSync.question('Do you want me to create one for you? (Y/n): ') === 'Y') {
            g.steps.ios.createBuildConfig().then(() => {
              resolve()
            })
          }
        }
      }

      let buildConfigJson = JSON.parse(fs.readFileSync(g.steps.ios.buildConfig))

      if (buildConfigJson) {
        if (buildConfigJson.ios) {
          if (buildConfigJson.ios.release) {
            if (buildConfigJson.ios.release.provisioningProfile && buildConfigJson.ios.release.developmentTeam && buildConfigJson.ios.packageType) {
              let pubMateJson = g.readPubmateJson()
              pubMateJson.ios.buildConfig = g.steps.ios.buildConfig
              g.savePubmateJson(pubMateJson)

              resolve()
            } else {
              g.fatal('This build config does not contain the ios.release.provisioningProfile, ios.release.developmentTeam or ios.release.packageType keys, fix it or create a new one nigga.')
            }
          } else {
            g.fatal('This build config does not contain the ios.release key, fix it or create a new one nigga.')
          }
        } else {
          g.fatal('This build config does not contain the ios key, fix it or create a new one nigga.')
        }
      } else {
        g.fatal('This build config is invalid, fix it or create a new one nigga.')
      }
    })
  },

  createBuildConfig () {
    return new Promise((resolve, reject) => {
      g.log("Okay everybody, a new buildConfig for sir... Prepare your pants for a shitstorm.")

      if (readlineSync.question('Have you generated and installed your distribution provisioning profile? (Y/n): ') === 'Y') {
        let uuid = readlineSync.question('Paste the provisioning profile UUID: ')
        if (uuid) {
          g.log("Great, now we need your team ID, if you don't know it, check this: https://github.com/kasp1/PubMate/blob/master/How%20to%20find%20Apple%20developer%20team%20ID.md")
          let team = readlineSync.question('Paste your team ID: ')
          if (team) {
            g.log("Good stuff. Give me a millisecond...")

            let buildConfig = {
              "ios": {
                "debug": {},
                "release": {
                  "codeSignIdentity": "iPhone Distribution",
                  "provisioningProfile": uuid,
                  "developmentTeam": team,
                  "packageType": "app-store"
                }
              }
            }

            fs.writeFileSync('iosbuild.json', JSON.stringify(buildConfig))

            let pubMateJson = g.readPubmateJson()
            pubMateJson.ios.buildConfig = 'iosbuild.json'
            g.savePubmateJson(pubMateJson)
          } else {
            g.fatal('No UUID, no fun. You can find your installed provisioning profiles at: ~/Library/MobileDevice/Provisioning Profiles/')
          }
        } else {
          g.fatal('No UUID, no fun. You can find your installed provisioning profiles at: ~/Library/MobileDevice/Provisioning Profiles/')
        }
      } else {
        g.fatal('OK, follow this guide and run pubmate again when done: https://github.com/kasp1/PubMate/blob/master/How%20to%20create%20a%20distrubution%20provisioning%20profile%20for%20an%20iOS%20app.md')
      }

      resolve()
    })
  },

  buildRelease () {
    return new Promise((resolve, reject) => {
      g.log('Gonna build this...')

      let cmd = exec('cordova build ios --device --release --buildConfig ' + path.normalize(g.steps.ios.buildConfig))
      cmd.stderr.pipe(process.stderr)

      cmd.on('close', (code) => {
        if (code > 0) {
          g.fatal('Cordova died. :\'(')
        }

        let build = path.normalize('./platforms/ios/build/device/' + g.steps.config.widget.name + '.ipa')
        let dist = path.normalize('pubmate/ios-release-signed-' + g.steps.config.version + '.ipa')

        console.log(build)

        if (fs.existsSync(build)) {
          fs.createReadStream(build).pipe(fs.createWriteStream(dist))

          g.steps.ios.build = dist
          g.log("OK, cool.")
          resolve()
        } else {
          g.fatal("The build failed.")
        }
      })
    })
  },

  finish () {
    return new Promise((resolve, reject) => {
      if (fs.existsSync(g.steps.ios.build)) {
        fs.unlinkSync(g.steps.ios.build)
      }

      g.log("Okay you've got your iOS IPA at: " + g.steps.ios.build)
      g.log('This is the file you want to upload to iTunes Connect.')
    })
  }
}