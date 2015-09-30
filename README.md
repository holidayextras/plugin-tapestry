# plugin-tapestry

[![Circle CI](https://circleci.com/gh/holidayextras/plugin-tapestry/tree/master.svg?style=svg&circle-token=de4b055da0e752a4775057055d24efdb63705d9e)](https://circleci.com/gh/holidayextras/plugin-tapestry)

## About

A [hapi](http://hapijs.com/) style plugin to interface Tapestry.

## Getting Started

You can start with cloneing down the repo

```
git clone git@github.com:holidayextras/plugin-tapestry.git
```

or to install this plugin to your Hapi server you will need to add this line to your dependencies in your package.json
```
plugin-tapestry: 'git+ssh://git@github.com/holidayextras/plugin-tapestry.git'
```

After you will need to install this dependency and its dependencies
```
$ npm install
```

### Implementation

This plugin conforms to the [hapijs plugin interface](http://hapijs.com/api#plugin-interface).

While bootstrapping your Hapi server, include the plugin like so:

```
server.pack.register( [
	require( 'plugin-tapestry' )
], function() {
	server.start( function() {
		console.log( 'server started with plugin-tapestry plugin initialised' );
	} );
} );
```

Inside your controllers you should then be able to do something like this:

```
var tapestryRequestDeferred = Q.defer();
request.server.plugins['plugin-tapestry'].makeItSo( tapestryRequestDeferred, options );
```

## Contributing

Code is linted checked against the style guide with [make-up](https://github.com/holidayextras/make-up), running npm test will run all tests required.

## License
Copyright (c) 2015 Shortbreaks
Licensed under the MIT license.
