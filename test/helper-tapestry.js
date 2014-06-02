/* jslint node: true */
'use strict';

/*
* @name /test/helper-tapestry.js
* @description Root test file, there's a Grunt task to do all this shizzle, powered by Mocha
* @since since Mon Jun 02 2014
* @author Rob Johnson <rob.johnson@holidayextras.com>
*/

// use assert, its built in
var assert = require( 'assert' );
// Maybe we should get the file we're testing
var serviceThing = require( '../index.js' );

// We're gonna need Q for the promisses checking
var Q = require( 'q' );

// Set the scope we're going to push to object into
var scope = {};

var options = {
	"host": "productiondb.cub7vva167az.eu-west-1.rds.amazonaws.com",
	"user": "hx_admin",
	"password": "hx_pass",
	"database": "hxml",
	"productCodes": [
		"WININN",
		"THMLLA"
	],
	"identifier": "testing"
};

// All of the below tests will not return useful information if they fail.
// I believe that the way the callbacks are working is causing assert to throw errors, which can be caught in a try catch
// but do not react the way expected as it's outside of the original scope
// My initial investigations suggest we may need to use spies (on the mocha github page, supplied by sinon)

// For now, this will still fail, so we can look at getting it to fail in the proper way when next in here.

// tests that the returned value matches what is expected
describe( 'Check we get some content back', function() {
	it( 'should return an object matching the fixture', function( done ) {
		// Set the promise we're expecting back
		var deferred = Q.defer();
		serviceThing.do( deferred, scope, options ).then( function( result ) {
			assert.equal( require( './fixtures/tapestryResponse.json' ), result );
			done();
		} );
	} );
} );



