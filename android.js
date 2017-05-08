const path = require('path')
const readlineSync = require('readline-sync')
const fs = require('fs')
const os = require('os')
const commandExists = require('command-exists').sync
const exec = require('child_process').exec

module.exports = {
  zipaligner: null,
  jarsigner: null,

  findJarSigner () {
    return new Promise((resolve, reject) => {
      g.log('Looking for the jar signer tool...')

      let jdkPath = ''

      if (commandExists('jarsigner')) {
        g.steps.android.jarsigner = 'jarsigner'
      } else {
        if (process.env.JAVA_HOME) {
          jdkPath = path.normalize(process.env.JAVA_HOME)
        } else {
          g.log('Can\'t get the JAVA_HOME environment variable, you better create one and re-run this, because you should really have this variable available for other purposes.')
          g.log('Wait, let me try the default path...')
    
          let defaultJdkPath
          switch (os.platform())
          {
            case 'win32':
              defaultJdkPath = path.normalize('C:/Program Files/Java/')
              if (fs.existsSync(defaultJdkPath)) {
                let jdks = fs.readdirSync(defaultJdkPath)
                defaultJdkPath = path.normalize(defaultJdkPath + '/' + jdks[0])
              } else {
                defaultJdkPath = '...' // non-existent path, so it doesn't pass the next check
              }
            break
            case 'darwin': defaultJdkPath = path.normalize('/System/Library/Frameworks/JavaVM.framework/Version/Current'); break
            default:
              defaultJdkPath = path.normalize('/usr/jdk')
              if (fs.existsSync(defaultJdkPath)) {
                let jdks = fs.readdirSync(defaultJdkPath)
                defaultJdkPath = path.normalize(defaultJdkPath + '/' + jdks[0])
              } else { // alternatively OpenJDK
                defaultJdkPath = path.normalize('/usr/lib/jvm/open-jdk')
                if (fs.existsSync(defaultJdkPath)) {
                  let jdks = fs.readdirSync(defaultJdkPath)
                  defaultJdkPath = path.normalize(defaultJdkPath + '/' + jdks[0])
                } else {
                  defaultJdkPath = '...' // non-existent path, so it doesn't pass the next check
                }
              }
          }

          if (fs.existsSync(defaultJdkPath)) {
            jdkPath = defaultJdkPath
            g.log('Found something at ' + defaultJdkPath)
          } else {
            g.log('Nada at ' + defaultJdkPath + '.Have you installed JDK?')
            g.log('Alternatively, you can paste your JDK root path here.')
            
            jdkPath = path.normalize(readlineSync.question('JDK path: '))

            if (!fs.existsSync(jdkPath)) {
              g.fatal('Nope, you better sort yourself and your JDK first.') 
            }
          }
        }

        if (fs.existsSync(path.normalize(jdkPath + '/Commands/jarsigner'))) {
          g.steps.android.jdkpath = jdkPath
          g.steps.android.jarsigner = path.normalize(jdkPath + '/Commands/jarsigner')
        } else if (fs.existsSync(path.normalize(jdkPath + '/bin/jarsigner'))) {
          g.steps.android.jdkpath = jdkPath
          g.steps.android.jarsigner = path.normalize(jdkPath + '/bin/jarsigner')
        } else if (fs.existsSync(path.normalize(jdkPath + '/bin/jarsigner.exe'))) {
          g.steps.android.jdkpath = jdkPath
          g.steps.android.jarsigner = path.normalize(jdkPath + '/bin/jarsigner.exe')
        } else {
          g.fatal('The jar signer tool is not there (' + path.normalize(jdkPath + '/<bin|Commands>/jarsigner[.exe]') + '). What sort of things have you done to your JDK? You better reinstall it.')
        }
      }

      g.log('Found it.')
      resolve()
    })
  },

  findZipAligner () {
    return new Promise((resolve, reject) => {
      g.log('Looking for the zip align tool...')

      let sdkPath = ''

      if (commandExists('zipalign')) {
        g.steps.android.zipaligner = 'zipalign'
      } else {
        if (process.env.ANDROID_HOME) {
          sdkPath = path.normalize(process.env.ANDROID_HOME)
        } else {
          g.log('Can\'t get the ANDROID_HOME environment variable, you better create one and re-run this, because you should really have this variable available for other purposes.')
          g.log('Wait, let me try the default path...')
    
          let defaultSdkPath
          switch (os.platform())
          {
            case 'win32': defaultSdkPath = path.normalize(os.homedir() + '/AppData/Local/Android/sdk'); break
            case 'darwin': defaultSdkPath = path.normalize('/Library/Android/sdk/'); break
            default: defaultSdkPath = path.normalize(os.homedir() + '/Android/Sdk')
          }

          if (fs.existsSync(defaultSdkPath)) {
            sdkPath = defaultSdkPath
            g.log('Found something at ' + defaultSdkPath)
          } else {
            g.log('Nada at ' + defaultSdkPath + '.Have you installed Android SDK?')
            g.log('Alternatively, you can paste your Android SDK root path here.')
            
            sdkPath = path.normalize(readlineSync.question('Android SDK path: '))

            if (!fs.existsSync(sdkPath)) {
              g.fatal('Nope, you better sort yourself and your Android SDK first.') 
            }
          }
        }

        if (!fs.existsSync(path.normalize(sdkPath + '/build-tools'))) {
          g.fatal('The build tools directory is non-existent in your Android SDK. How ancient SDK is this? Update it and re-run this.')
        }

        let apis = fs.readdirSync(sdkPath + '/build-tools')
        let targetApi = ''

        if (apis.length < 1) {
          g.fatal('You have no build tools installed. Open your Android SDK manager and install build tools for at least one API level.')
        } else if (apis.length === 1) {
          targetApi = apis[0]
        } else {
          g.log("Okay, we've got a couple of APIs installed here, I'll go with the newest one.")

          let version
          var highest
          for (let i in apis) {
            version = apis[i].split('.')

            if (highest) {
              if (version[0] < highest[0]) {
                if (version[1] < highest[1]) {
                  if (version[2] > highest[2]) {
                    highest = version
                  }
                } else {
                  highest = version
                }
              } else {
                highest = version
              }
            } else {
              highest = version
            }
          }

          highest = highest.join('.')

          g.log('Which is ' + highest + " - don't worry, the zip align tool normally works same for all API levels.")
        }

        if (fs.existsSync(path.normalize(sdkPath + '/build-tools/' + highest + '/zipalign'))) {
          g.steps.android.zipaligner = path.normalize(sdkPath + '/build-tools/' + highest + '/zipalign')
        } else if (fs.existsSync(path.normalize(sdkPath + '/build-tools/' + highest + '/zipalign.exe'))) {
          g.steps.android.zipaligner = path.normalize(sdkPath + '/build-tools/' + highest + '/zipalign.exe')
        } else {
          g.fatal('The zip align tool is not there (' + path.normalize(sdkPath + '/build-tools/' + highest + '/zipalign[.exe]') + '). What sort of things have you done to your Android SDK? You better reinstall build tools for this API level (' + highest + ').')
        }
      }

      g.log('Got it.')
      resolve()
    })
  },

  buildRelease () {
    return new Promise((resolve, reject) => {
      g.log('Gonna build this...')
      let cmd = exec('cordova build android --release')
      cmd.stderr.pipe(process.stderr)

      cmd.on('close', (code) => {
        if (code > 0) {
          g.fatal('Cordova died. :\'(')
        }

        if (fs.existsSync(path.normalize('./platforms/android/build/outputs/apk/android-release-unsigned.apk'))) {
          g.steps.android.unsigned = path.normalize('./platforms/android/build/outputs/apk/android-release-unsigned.apk')
          g.log("OK, cool.")
          resolve()
        } else {
          g.fatal("The build failed.")
        }
      })
    })
  },

  createKeystore () {
    return new Promise((resolve, reject) => {
      g.log('Looking for the keytool...')

      

      resolve()
    })
  },

  sign () {
    return new Promise((resolve, reject) => {
      g.log('Signing the APK...')

      if (!fs.existsSync('pubmate')) {
        fs.mkdirSync('pubmate')
      }

      let pubMateJson = g.readPubmateJson()
      let keystore, key, pass

      if (pubMateJson.android.keystore && pubMateJson.android.key && pubMateJson.android.pass) {
        keystore = pubMateJson.android.keystore
        pass = pubMateJson.android.pass
        key = pubMateJson.android.pass

        let cmd = exec('"' + g.steps.android.jarsigner + '" -verbose -storepass "' + pass + '" -sigalg SHA1withRSA -digestalg SHA1 -keystore "' + keystore + '" "' + g.steps.android.unsigned + '" ' + key + ' -signedjar "' + path.normalize('pubmate/android-release-signed.apk') + '"')
        cmd.stderr.pipe(process.stderr)

        cmd.on('close', (code) => {
          if (code > 0) {
            g.fatal('Jarsigner died. :\'(')
          }

          if (fs.existsSync(path.normalize('pubmate/android-release-signed.apk'))) {
            g.steps.android.signed = path.normalize('pubmate/android-release-signed.apk')
            g.log("Alright, good.")
            resolve()
          } else {
            g.fatal("The signing failed.")
          }
        })
      } else {
        g.log('Okay Houston, problem - there is no signing keystore configured. All APKs need to be signed before being sent to Google Play.')

        if (readlineSync.question('Do you have any existing keystore to use? (Y/n): ') === 'Y') {
          keystore = readlineSync.question('Where is it (path)?: ')

          if (fs.existsSync(path.normalize(keystore))) {
            key = readlineSync.question('Where is it (path)?: ')
            pass = readlineSync.question('Where is it (path)?: ')
          } else {
            g.log('This file does not exist. Sort it and try again.')
          }
        } else {
          if (readlineSync.question('Okay, shall we create one for you? (Y/n): ') === 'Y') {
            g.steps.android.createKeystore().then(() => {
              g.steps.android.sign()
            })
          } else {
            g.log('Up to you. Sort it and start over.')
          }
        }
      }
    })
  },

  align () {
    return new Promise((resolve, reject) => {
      g.log('Zip-aligning the APK...')

      let aligned = path.normalize('pubmate/android-release-signed-aligned.apk')

      let cmd = exec('"'+global.formatPath(global.zipAlignerPath)+'" -f 4 "' + g.steps.android.signed + '" "' + aligned + '"')
      cmd.stderr.pipe(process.stderr)

      cmd.on('close', (code) => {
        if (code > 0) {
          g.fatal('Zipaligner died. :\'(')
        }

        if (fs.existsSync(aligned)) {
          g.steps.android.signedAligned = aligned
          g.log("Awesome.")
          resolve()
        } else {
          g.fatal("The zip aligning failed.")
        }
      })
    })
  },

  finish () {
    return new Promise((resolve, reject) => {
      if (fs.existsSync(g.steps.android.signed)) {
        fs.unlink(g.steps.android.signed)
      }

      g.log("Okay you've got your Android APK at: " + g.steps.android.signedAligned)
      g.log('This is the file you want to upload to Google Play.')
    })
  }
}