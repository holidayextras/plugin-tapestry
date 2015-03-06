# plugin-tapestry

[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)

## About

A hapi style plugin to interface Tapestry

## Getting Started

You can start with cloneing down the repo

```
git clone git@bitbucket.org:hxshortbreaks/plugin-tapestry.git
```

or to install this plugin to your Hapi server you will need to add this line to your dependencies in your package.json
```
"plugin-tapestry": "git+ssh://git@bitbucket.org/hxshortbreaks/plugin-tapestry.git"
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

Code is linted by ".jshintrc" and checked against the coding style guide "shortbreaks.jscs.json". We also use Mocha to test our code, to run all of this use ` $ grunt test `.

## License
Copyright (c) 2015 Shortbreaks
Licensed under the MIT license.