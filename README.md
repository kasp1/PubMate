# PubMate
Build for release and publish Cordova apps easily. Repetitive deploy simplified. Noob-proof tool.

1. Install PubMate `npm i -g pubmate`
2. Go to any Apache Cordova project directory and run `pubmate` (command).

**Requires Node.js >= v7.6.0**

![PubMate](pubmate.gif)

## Usage

If you are inside a Cordova project directory, to build all supported platforms (that are listed at `platforms/platforms.json`):

`$ pubmate`

To build a specific platform:

`$ pubmate <platform>` e.g.: `$ pubmate android`

Help:

`$ pubmate help`

Create a new keystore (for signing Android APKs) and nothing else:

`$ pubmate create-keystore` (run in your project's directory)

Sign and zip-align any unsigned APK (even non-Cordova builds, React-Native, etc):

`$ pubmate sign-and-zipalign` (run in your project's directory)

## Support

Chat me on [Gitter](https://gitter.im/kasp1).
