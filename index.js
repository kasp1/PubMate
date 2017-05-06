#!/usr/bin/env node

let cli = {
  android: {
    usage: "lazypub android\n- Builds publishable file(s) for the Android version.",
    handler () {
      return new Promise((resolve, reject) => {
        console.log('Building for Android...')
        resolve()
      })
    }
  },

  ios: {
    usage: "lazypub ios\n- Builds publishable file(s) for the iOS version.",
    handler () {
      return new Promise((resolve, reject) => {
        console.log('Building for iOS...')
        resolve()
      })
    }
  },

  all: {
    usage: "lazypub - Builds publishable files for all platforms.",
    async handler () {
      return new Promise((resolve, reject) => {
        console.log('Building for all platforms...')
        resolve()
      })
    }
  },

  help: {
    usage: "lazypub help <platform>\n- Displays help related to the specified platform command.",
    handler (command) {
      if (!command) {
        if (cli[process.argv[3]]) {
          console.log(cli[process.argv[3]].usage)
        } else {
          console.log("LazyPub - turns your Cordova project into publishable file(s).")
          console.log('')
          console.log("Run in a Cordova project directory:")
          console.log("lazypub [platform] # to build project for a specified platform.")
          console.log("lazypub all # to build project for all platforms listed in your platforms/platforms.json file.")
          console.log('')
          console.log('Available platforms/commands: ', Object.keys(cli).join(', '))
          console.log("apiko help <platform|command> # to read further.")
          console.log('')
          console.log('')
        }
      } else {
        console.log(cli[command].usage)
      }
    }
  }
}

if (process.argv[2]) {
  if (cli[process.argv[2]]) {
    cli[process.argv[2]].handler()
  } else {
    cli.help.handler()
  }
} else {
  cli.help.handler()
}