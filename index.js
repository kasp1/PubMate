#!/usr/bin/env node
const exec = require('child_process').exec
const commandExists = require('command-exists').sync
const fs = require('fs')

let g = global

g.log = function (msg)
{
  console.log('[LAZYPUB] ' + msg)
}

g.err = function (msg)
{
  console.error('[LAZYPUB] ' + msg)
}

g.fatal = function (msg)
{
  g.err(msg)
  g.log('Terminating this shit.')
  process.exit(1)
}

g.cli = {
  android: {
    usage: "lazypub android\n- Creates publishable file(s) for the Android version.",
    async handler () {
      g.log('==========')
      g.log('Android...')
    }
  },

  ios: {
    usage: "lazypub ios\n- Creates publishable file(s) for the iOS version.",
    async handler () {
      g.log('==========')
      g.log('iOS...')
    }
  },

  all: {
    usage: "lazypub - Creates publishable files for all platforms.",
    async handler () {
      g.log('Gonna do the job for all platforms...')
      await g.cli.android.handler()
      await g.cli.ios.handler()
    }
  },

  help: {
    usage: "lazypub help <platform>\n- Displays help related to the specified platform command.",
    handler (command) {
      if (!command) {
        if (g.cli[process.argv[3]]) {
          console.log(g.cli[process.argv[3]].usage)
        } else {
          console.log("LazyPub - turns your Cordova project into publishable file(s).")
          console.log('')
          console.log("Run in a Cordova project directory:")
          console.log("lazypub [platform] # to build project for a specified platform.")
          console.log("lazypub all # to build project for all platforms listed in your platforms/platforms.json file.")
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

        g.log('OK.')
        resolve()
      })
    })
  }
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
        g.log('Terminating. Hasta la vista.')
      }
    } else {
      g.cli.help.handler()
    }
  } else {
    g.cli.help.handler()
  }
}

startup()