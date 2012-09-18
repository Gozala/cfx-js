# cfx-js

[![Build Status](https://secure.travis-ci.org/Gozala/cfx-js.png)](http://travis-ci.org/Gozala/cfx-js)

CLI tool for Mozilla Add-on SDK.
This is prototype implementation of an Add-on SDK linker / compiler
described in [JEP Linker].

## Install

```sh
git clone https://github.com/Gozala/cfx-js.git
cd cfx-js
npm link
```

## Usage

Once you install package you can use [nodejs] to test functionality
that is already implemented by running appropriate commands from
an addon folder:


```sh
cd tests/fixtures/a
# backwards compatible mode
node ../../../bin/cfx.js ./main.js ../JETPACK_PATH/1.8/ --compatible

# backwards incompatible mode
node ../../../bin/cfx.js ./main.js ../JETPACK_PATH/2.0
```

[JEP Linker]:https://github.com/mozilla/addon-sdk/wiki/JEP-Linker
[nodejs]:http://nodejs.org/
