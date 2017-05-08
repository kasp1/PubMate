#!/usr/bin/env node
const exec = require('child_process').exec
const commandExists = require('command-exists').sync
const fs = require('fs')
const readlineSync = require('readline-sync')
const path = require('path')

global.g = global

g.log = function (msg)
{
  console.log('[PUBMATE] ' + msg)
}

g.err = function (msg)
{
  console.error('[PUBMATE] ' + msg)
}

g.fatal = function (msg)
{
  g.err(msg)
  g.log('Terminating this shit.')
  process.exit(1)
}

g.readPlatformsJson = function() {
  if (fs.existsSync(path.normalize('platforms'))) {
    if (fs.existsSync(path.normalize('platforms/platforms.json'))) {
      return JSON.parse(fs.readFileSync('platforms/platforms.json'))
    } else {
      g.fatal("No platforms/platforms.json, add some platforms first noob, e.g.: cordova platform add android 2")
    }
  } else {
    g.fatal("No platforms/platforms.json, add some platforms first noob, e.g.: cordova platform add android 1")
  }
}

g.readPubmateJson = function() {
  if (fs.existsSync(path.normalize('platforms'))) {
    if (fs.existsSync(path.normalize('platforms/platforms.json'))) {
      return JSON.parse(fs.readFileSync('platforms/platforms.json'))
    }
  }

  return false
}

g.cli = {
  android: {
    usage: "pubmate android\n- Creates publishable file(s) for the Android version.",
    async handler () {
      let platforms = Object.keys(g.readPlatformsJson())

      if (platforms.indexOf('android') > -1) {
        g.log('==========')
        g.log('Android...')
        await g.steps.android.findJarSigner()
        await g.steps.android.findZipAligner()
        await g.steps.android.buildRelease()
        await g.steps.android.sign()
        await g.steps.android.align()
        await g.steps.android.finish()
      } else {
        g.log('No Android platform in this Cordova project. You can add it using: cordova plaform add android')
        let doIt = readlineSync.question('Do you want me to do the job for you? (Y/n): ')

        if (doIt) {
          g.log('Okay then...')

          let cmd = exec('cordova plaform add android')
          cmd.stderr.pipe(process.stderr)

          cmd.on('close', async (code) => {
            if (code > 0) {
              g.fatal('Cordova died. :\'(')
            }

            g.log('Done.')
            await g.steps.android.findJarSigner()
            await g.steps.android.findZipAligner()
            await g.steps.android.buildRelease()
            await g.steps.android.sign()
            await g.steps.android.align()
            await g.steps.android.finish()
          })
        } else {
          g.log('Up to you.')
        }
      }
    }
  },

  ios: {
    usage: "pubmate ios\n- Creates publishable file(s) for the iOS version.",
    async handler () {
      g.log('==========')
      g.log('iOS...')
    }
  },

  all: {
    usage: "pubmate - Creates publishable files for all platforms.",
    async handler () {
      g.log('All platforms, bring it...')

      let platforms = Object.keys(g.readPlatformsJson())

      g.log('Okay, what do we have here...')

      if (platforms.length === 1) {
        g.log('Just ' + platforms[0] + '.')
      } else {
        g.log(Object.keys(platforms).join(', '))
      }

      g.log("Alright, let's do this.")

      for (let i in platforms) {
        await g.cli[platforms[i]].handler()
      }

      g.log("PRO TIP: Before you publish your app, make sure your app ID (com.something.something) in your config.xml is what you finally want it to be, you can't change it later.")
    }
  },

  help: {
    usage: "pubmate help <platform>\n- Displays help related to the specified platform command.",
    handler (command) {
      if (!command) {
        if (g.cli[process.argv[3]]) {
          console.log(g.cli[process.argv[3]].usage)
        } else {
          console.log("PubMate - turns your Cordova project into publishable file(s).")
          console.log('')
          console.log("Run in a Cordova project directory:")
          console.log("pubmate [platform] # to build project for a specified platform.")
          console.log("pubmate all # to build project for all platforms listed in your platforms/platforms.json file.")
          console.log('')
          console.log('Available platforms/commands: ', Object.keys(g.cli).join(', '))
          console.log("apiko help <platform|command> # to read further.")
          console.log('')
        }
      } else {
        console.log(g.cli[command].usage)
      }
    }
  }
}

g.steps = {
  checkForCordova () {
    return new Promise((resolve, reject) => {
      g.log('Checking if Apache Cordova is installed...')
      if (!commandExists('cordova')) {
        g.fatal('Obviously you need to have Apache Cordova installed, get it at cordova.apache.org')
      } else {
        g.log('Fine.')
        resolve()
      }
    })
  },

  checkForCordovaProject () {
    return new Promise((resolve, reject) => {
      g.log('Checking if this is a Cordova project directory...')

      if (fs.existsSync('config.xml') && fs.existsSync('www')) {
        g.log('Good.')
        resolve()
      } else {
        g.fatal('Where else would you like to run this than in a Cordova project directory? Go there first.')
      }
    })
  },

  prepareProject () {
    return new Promise((resolve, reject) => {
      g.log('Running the \'prepare\' command here (installing missing plugins and platforms)...')

      let cmd = exec('cordova prepare')
      cmd.stderr.pipe(process.stderr)

      cmd.on('close', (code) => {
        if (code > 0) {
          g.fatal('Cordova died. :\'(')
        }

        g.log("OK, let's do this.")
        resolve()
      })
    })
  },

  android: require('./android')
}

async function startup() {
  if (process.argv[2]) {
    if (g.cli[process.argv[2]]) {
      if (g.cli[process.argv[2]] == 'help') {
        g.cli.help.handler()
      } else {
        await g.steps.checkForCordova()
        await g.steps.checkForCordovaProject()
        await g.steps.prepareProject()
        await g.cli[process.argv[2]].handler()
        g.log('Terminating, adios.')
      }
    } else {
      g.cli.help.handler()
    }
  } else {
    await g.steps.checkForCordova()
    await g.steps.checkForCordovaProject()
    await g.steps.prepareProject()
    await g.cli.all.handler()
    g.log('Terminating, adios.')
  }
}

startup()