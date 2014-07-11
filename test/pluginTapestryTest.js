/* jslint node: true */
'use strict';

/*
* @name /test/pluginTapestryTest.js
* @description Mocha powered testing of the core library
* @since Fri Jul 11 2014
* @author Kevin Hodges <kevin.hodges@holidayextras.com>
*/


// use assert, its built in
var assert = require( 'assert' );
var Hapi = require( 'hapi' );
// We're gonna need Q for the promises checking
var Q = require( 'q' );
var sinon = require( 'sinon' );
var Tapestry = require( 'tapestry' );

// when the wrong case is fired by a deferred
var successFiredIncorrectlyMessage = 'Deferred resolved incorrectly';

// where is out plugin?
var pluginLocation = '../lib/pluginTapestry';
var pluginName = 'configuration';
var server;

describe( 'pluginTapestry', function() {

	before( function( done ) {

		// stub out some of the calls the plugin makes
		server = new Hapi.Server();
		// the plugin expects a few functions to return stuff to register properly
		// simulate that here
		server.methods.getService = sinon.stub().returns( {
			"sources": [{}]
		} ); // not actually gonna talk to this
		server.methods.getCacheWrapper = sinon.stub().returns( null ); // not testing the cache either
		server.pack.register( { plugin: require( pluginLocation ) }, function() {
			done();
		} );
	} );

	describe( '.register()', function() {
		it( 'should allow us to access the plugin off the hapi server', function( done ) {
			assert.strictEqual( 'object', typeof server.plugins['plugin-tapestry'] );
			done();
		} );
	} );

	describe( '.makeItSo()', function() {

		it( 'should expose makeItSo as a function', function( done ) {
			var deferred = Q.defer();
			assert.equal( typeof server.plugins['plugin-tapestry'].makeItSo, 'function' );
			done();
		} );

		it( 'should assing the fixture to the requested input `code`', function() {
			var deferred = Q.defer();

			var tapestry = server.plugins['plugin-tapestry'].get();

			var tapestryGetStub = sinon.stub( tapestry, 'get' ).callsArgWith( 1, null, { "name": "Test Hotel" } );

			return server.plugins['plugin-tapestry'].makeItSo( deferred, {
			 "inputData": {
			 		"code": "ABC123"
			 	}
			} ).then( function( result ) {
				assert.deepEqual( result, { "code": "ABC123", content: { "name": "Test Hotel" } } );
			}, function( error ) {

			} );
		} );

	} );

} );