# plugin-tapestry

[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)

## About

A HAPI style plugin to interface Tapestry

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

#### EditorConfig

EditorConfig helps us define and maintain consistent coding styles between different editors and IDEs.  If you are using Sublime Editor you can install the `EditorConfig` using [Package Control](https://sublime.wbond.net).

For non Sublime development a bunch of other IDE plugins are available [here](http://editorconfig.org/#download)

## Documentation

Visit our [bitbucket](https://bitbucket.org/hxshortbreaks/) website for all the things.

## Notes on coding style

Code is linted by ".jshintrc" and checked against the coding style guide "shortbreaks.jscs.json" when you run the default grunt task:
```
$ grunt
```

## Tests

Tests will run using the default grunt task but can also be called stand-alone using:
```
$ grunt test
```

## License
Copyright (c) 2014 Shortbreaks
Licensed under the MIT license.