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
			assert.equal( typeof server.plugins['plugin-tapestry'].makeItSo, 'function' );
			done();
		} );

		// it( 'should fail when the options parameter is not passed', function() {
		// 	var deferred = Q.defer();
		// 	return server.plugins['plugin-http'].makeItSo( deferred ).then( function( result ) {
		// 		assert.fail( result, null, successFiredIncorrectlyMessage );
		// 	}, function( error ) {
		// 		assert.equal( error, 'invalid options' );
		// 	} );
		// } );

	} );

} );