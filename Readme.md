# cfx-js

[![Build Status](https://secure.travis-ci.org/Gozala/cfx-js.png)](http://travis-ci.org/Gozala/cfx-js)

CLI tool for Mozilla Add-on SDK.
This is prototype implementation of an Add-on SDK linker / compiler
described in [JEP Linker].

## Install

```sh
git clone --recursive https://github.com/Gozala/cfx-js.git
cd cfx-js
npm install
```

## Usage

Once you install package you can use [nodejs] to test functionality
that is already implemented by running appropriate commands from
a project folder:

1. Extraction of requirements

    ```sh
    npm run demo-extract
    ```

[JEP Linker]:https://github.com/mozilla/addon-sdk/wiki/JEP-Linker
[nodejs]:http://nodejs.org/
