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
          g.steps.android.jdkPath = jdkPath
          g.steps.android.jarsigner = path.normalize(jdkPath + '/Commands/jarsigner')
        } else if (fs.existsSync(path.normalize(jdkPath + '/bin/jarsigner'))) {
          g.steps.android.jdkPath = jdkPath
          g.steps.android.jarsigner = path.normalize(jdkPath + '/bin/jarsigner')
        } else if (fs.existsSync(path.normalize(jdkPath + '/bin/jarsigner.exe'))) {
          g.steps.android.jdkPath = jdkPath
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

        if (fs.existsSync(path.normalize('./platforms/android/build/outputs/apk/android-armv7-release-unsigned.apk'))) {
          g.steps.android.unsigned = path.normalize('./platforms/android/build/outputs/apk/android-armv7-release-unsigned.apk')

          if (fs.existsSync(path.normalize('./platforms/android/build/outputs/apk/android-x86-release-unsigned.apk'))) {
            g.steps.android.unsignedX86 = path.normalize('./platforms/android/build/outputs/apk/android-x86-release-unsigned.apk')
          }

          g.log("OK, cool.")
          resolve()
        } else if (fs.existsSync(path.normalize('./platforms/android/build/outputs/apk/android-release-unsigned.apk'))) {
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
      if (fs.existsSync('android.keystore')) {
        g.fatal("You've already got an android.keystore file here. Move it away first.")
      }

      g.log('Looking for the keytool...')

      let keytool

      if (commandExists('keytool')) {
        keytool = 'keytool'
      } else {
        if (fs.existsSync(path.normalize(g.steps.android.jdkpath + '/Commands/keytool'))) {
          keytool = path.normalize(g.steps.android.jdkpath + '/Commands/keytool')
        } else if (fs.existsSync(path.normalize(g.steps.android.jdkpath + '/bin/keytool'))) {
          keytool = path.normalize(g.steps.android.jdkpath + '/bin/keytool')
        } else if (fs.existsSync(path.normalize(g.steps.android.jdkpath + '/bin/keytool.exe'))) {
          keytool = path.normalize(g.steps.android.jdkpath + '/bin/keytool.exe')
        } else {
          g.fatal('The keytool tool is not there (' + path.normalize(g.steps.android.jdkpath + '/<bin|Commands>/keytool[.exe]') + '). What sort of things have you done to your JDK? You better reinstall it.')
        }
      }

      g.log('Here it is.')

      g.log('Okay now I need a key alias and key password from you. You will never need to know these two things if you use just PubMate, but you can always find them in pubmate.json.')
      
      let alias = readlineSync.question('Key alias. Al-num chars, no spaces. Leave default if not sure. (default): ')
      if (!alias) {
        alias = 'default'
      }

      let pass = readlineSync.question('Store and key pass. Any strong password, it will save to pubmate.json: ')
      if (!pass) {
        g.fatal("Well I can't write a password for you. It's a password, your personal (app's) thing. Figure one and start this over.")
      }

      g.log('Okay, now the drill, input any values you like, these values are not shown anywhere...')

      let CN = readlineSync.question('CN: Your first and last name (unknown): ')
      if (!CN) {
        CN = 'unknown'
      }

      let O = readlineSync.question('O: Name of your organization (unknown): ')
      if (!O) {
        O = 'unknown'
      }

      let OU = readlineSync.question('OU: Name of your organizational unit (unknown): ')
      if (!OU) {
        OU = 'unknown'
      }

      let L = readlineSync.question('L: Name of your city or locality (unknown): ')
      if (!L) {
        L = 'unknown'
      }

      let ST = readlineSync.question('ST: Name of your state or province (unknown): ')
      if (!ST) {
        ST = 'unknown'
      }

      let C = readlineSync.question('C: Two-letter country code (unknown): ')
      if (!C) {
        C = 'unknown'
      }

      let dname = `CN=${CN}, OU=${OU}, O=${O}, L=${L}, ST=${ST}, C=${C}`

      g.log('Watch me create this android.keystore file for you...')

      let cmd = exec('"' + keytool + '" -genkey -v -keystore android.keystore -alias "' + alias + '" -keyalg RSA -keysize 2048 -validity 10000 -storepass "' + pass + '" -keypass "' + pass + '" -dname "' + dname + '"')
      cmd.stderr.pipe(process.stderr)

      cmd.on('close', (code) => {
        if (code > 0) {
          g.fatal('Keytool died. :\'(')
        }

        if (fs.existsSync('android.keystore')) {
          let pubMateJson = g.readPubmateJson()
          pubMateJson.android.keystore = 'android.keystore'
          pubMateJson.android.storepass = pass
          pubMateJson.android.keypass = pass
          pubMateJson.android.key = alias
          g.savePubmateJson(pubMateJson)

          g.log("Wonderful. From now on just make sure pubmate.json and android.keystore are on a safe place. You will need it.")
          resolve()
        } else {
          g.fatal("Not sure what the hell is going on here. The keytool didn't fail but the android.keystore file is missing.")
        }
      })
    })
  },

  sign () {
    return new Promise((resolve, reject) => {
      g.log('Signing the APK...')

      let signed = path.normalize('pubmate/android-release-signed.apk')

      if (g.steps.android.unsignedX86) {
        var signedX86 = path.normalize('pubmate/android-release-x86-signed.apk')
      }

      if (!fs.existsSync('pubmate')) {
        fs.mkdirSync('pubmate')
      } else if (fs.existsSync(signed)) {
        fs.unlinkSync(signed)
      }

      let pubMateJson = g.readPubmateJson()
      let keystore, key, storepass, keypass

      if (pubMateJson.android.keystore && pubMateJson.android.key && pubMateJson.android.keypass && pubMateJson.android.storepass) {
        keystore = pubMateJson.android.keystore
        storepass = pubMateJson.android.storepass
        keypass = pubMateJson.android.keypass
        key = pubMateJson.android.key

        let cmd = exec('"' + g.steps.android.jarsigner + '" -verbose -storepass "' + storepass + '" -keypass "' + keypass + '" -sigalg SHA1withRSA -digestalg SHA1 -keystore "' + keystore + '" "' + g.steps.android.unsigned + '" ' + key + ' -signedjar "' + signed + '"')
        cmd.stderr.pipe(process.stderr)

        cmd.on('close', (code) => {
          if (code > 0) {
            g.fatal('Jarsigner died. :\'(')
          }

          if (fs.existsSync(signed)) {
            g.steps.android.signed = signed

            if (g.steps.android.unsignedX86) {
              cmd2 = exec('"' + g.steps.android.jarsigner + '" -verbose -storepass "' + storepass + '" -keypass "' + keypass + '" -sigalg SHA1withRSA -digestalg SHA1 -keystore "' + keystore + '" "' + g.steps.android.unsignedX86 + '" ' + key + ' -signedjar "' + signedX86 + '"')
              cmd2.stderr.pipe(process.stderr)

              cmd2.on('close', (code) => {
                if (code > 0) {
                  g.fatal('Jarsigner died. :\'(')
                }

                if (fs.existsSync(signedX86)) {
                  g.steps.android.signedX86 = signedX86
                  g.log("Alright, good.")
                  resolve()
                } else {
                  g.fatal("The signing failed.")
                }
              })
            } else {
              g.log("Alright, good.")
              resolve()
            }
          } else {
            g.fatal("The signing failed.")
          }
        })
      } else {
        g.log('Okay Houston, problem - there is no signing keystore configured. All APKs need to be signed before being sent to Google Play.')

        if (readlineSync.question('Do you have any existing keystore to use? (Y/n): ') === 'Y') {
          keystore = readlineSync.question('Where is it (path)?: ')

          if (fs.existsSync(path.normalize(keystore))) {
            storepass = readlineSync.question('What is the store pass?: ')
            key = readlineSync.question('What is the key alias?: ')
            keypass = readlineSync.question('What is the key pass?: ')

            let cmd = exec('"' + g.steps.android.jarsigner + '" -verbose -storepass "' + storepass + '" -keypass "' + keypass + '" -sigalg SHA1withRSA -digestalg SHA1 -keystore "' + keystore + '" "' + g.steps.android.unsigned + '" ' + key + ' -signedjar "' + path.normalize('pubmate/android-release-signed.apk') + '"')
            cmd.stderr.pipe(process.stderr)

            cmd.on('close', (code) => {
              if (code > 0) {
                g.fatal('Jarsigner died. :\'(')
              }

              if (fs.existsSync(signed)) {
                g.steps.android.signed = signed

                let pubMateJson = g.readPubmateJson()
                pubMateJson.android.keystore = keystore
                pubMateJson.android.storepass = storepass
                pubMateJson.android.keypass = keypass
                pubMateJson.android.key = key
                g.savePubmateJson(pubMateJson)

                g.log("Alright, good.")
                resolve()
              } else {
                g.fatal("The signing failed. Wrong store or key pass or key alias?")
              }
            })
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

      let aligned = path.normalize('pubmate/android-release-signed-aligned-' + g.steps.config.widget.version + '.apk')

      if (g.steps.android.signedX86) {
        var alignedX86 = path.normalize('pubmate/android-release-x86-signed-aligned-' + g.steps.config.widget.version + '.apk')
      }

      if (fs.existsSync(aligned)) {
        fs.unlinkSync(aligned)
      }

      let cmd = exec('"' + g.steps.android.zipaligner + '" -f 4 "' + g.steps.android.signed + '" "' + aligned + '"')
      cmd.stderr.pipe(process.stderr)

      cmd.on('close', (code) => {
        if (code > 0) {
          g.fatal('Zipaligner died. :\'(')
        }

        if (fs.existsSync(aligned)) {
          g.steps.android.signedAligned = aligned

          if (g.steps.android.signedX86) {
            let cmd2 = exec('"' + g.steps.android.zipaligner + '" -f 4 "' + g.steps.android.signed + '" "' + alignedX86 + '"')
            cmd2.stderr.pipe(process.stderr)

            cmd2.on('close', (code) => {
              if (code > 0) {
                g.fatal('Zipaligner died. :\'(')
              }

              if (fs.existsSync(alignedX86)) {
                g.steps.android.signedAlignedX86 = alignedX86
                g.log("Awesome.")
                resolve()
              } else {
                g.fatal("The zip aligning failed.")
              }
            })
          } else {
            g.log("Awesome.")
            resolve()
          }
        } else {
          g.fatal("The zip aligning failed.")
        }
      })
    })
  },

  finish () {
    return new Promise((resolve, reject) => {
      if (fs.existsSync(g.steps.android.signed)) {
        fs.unlinkSync(g.steps.android.signed)
      }

      if (g.steps.android.signedX86) {
        if (fs.existsSync(g.steps.android.signedX86)) {
          fs.unlinkSync(g.steps.android.signedX86)
        }
      }

      if (g.steps.android.signedX86) {
        g.log("Okay you've got your Android APKs at: " + g.steps.android.signedAligned + ' and ' + g.steps.android.signedAlignedX86)
        g.log('This is the files you want to upload to Google Play Console.')
      } else {
        g.log("Okay you've got your Android APK at: " + g.steps.android.signedAligned)
        g.log('This is the file you want to upload to Google Play Console.')
      }

      resolve()
    })
  }
}