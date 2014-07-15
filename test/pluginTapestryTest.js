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
var _ = require( 'lodash' );

// when the wrong case is fired by a deferred
var successFiredIncorrectlyMessage = 'Deferred resolved incorrectly';

// where is out plugin?
var pluginLocation = '../lib/pluginTapestry';
var pluginName = 'plugin-tapestry';
var server, tapestryMethodStub;

// allow resources to be required safely
function loadTestResource( resource ) {
	return _.cloneDeep( require( resource ) );
}

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

	describe( '#register', function() {
		it( 'should allow us to access the plugin off the hapi server', function( done ) {
			assert.notStrictEqual( undefined, server.plugins[pluginName] );
			done();
		} );
	} );

	describe( '#makeItSo', function() {

		describe( 'check the function is created', function() {

			it( 'should expose makeItSo as a function on the plugin', function( done ) {
				var deferred = Q.defer();
				assert.equal( typeof server.plugins[pluginName].makeItSo, 'function' );
				done();
			} );

		} );

		describe( 'end to end to check the correct arguments reach the call to tapestry.get', function() {

			before( function () {
				// spy on the arguments that get to the tapestry.get call
		 		tapestryMethodStub = sinon.spy( Tapestry.prototype, 'get' );
			} );

			it( 'should assign the fixture to the requested input `code`', function() {
				var deferred = Q.defer();
				var expected = loadTestResource( './expected/ABC123Arguments' );
		 		return server.plugins[pluginName].makeItSo( deferred, loadTestResource( './fixtures/ABC123Key' ) ).then( function( result ) {
					assert.deepEqual( Tapestry.prototype.get.getCall( 0 ).args[0], expected );
				}, function( error ) {
					assert.fail( error, expected );
				} );
			} );

			after( function() {
				tapestryMethodStub.restore();
			} );

		} );

		describe( 'end to end to check the result gets handled correctly from the call to tapestry.get', function() {

			before( function () {
				// make tapestry.get return the values we can test against
				tapestryMethodStub = sinon.stub( Tapestry.prototype, 'get' ).callsArgWith( 1, null, loadTestResource( './fixtures/ABC123Content' ) );
			} );

			it( 'should bind the expected content to the requested fixture input `code`', function() {
				var deferred = Q.defer();
				var expected = loadTestResource( './expected/ABC123Result' );
				return server.plugins[pluginName].makeItSo( deferred, loadTestResource( './fixtures/ABC123Key' ) ).then( function( result ) {
					assert.deepEqual( result, expected );
				}, function( error ) {
					assert.fail( error, expected );
				} );
			} );

			after( function() {
				tapestryMethodStub.restore();
			} );

		} );

		describe( 'end to end to check the result gets handled correctly from the call to tapestry.get when no content is found', function() {

			before( function () {
				// make tapestry.get return the values we can test against
				tapestryMethodStub = sinon.stub( Tapestry.prototype, 'get' ).callsArgWith( 1, null, loadTestResource( './fixtures/noResult' ) );
			} );

			it( 'should not add a `code` property', function() {
				var deferred = Q.defer();
				var expected = loadTestResource( './expected/ABC123NoResult' );
				return server.plugins[pluginName].makeItSo( deferred, loadTestResource( './fixtures/ABC123Key' ) ).then( function( result ) {
					assert.deepEqual( result, expected );
				}, function( error ) {
					assert.fail( error, expected );
				} );
			} );

			after( function() {
				tapestryMethodStub.restore();
			} );

		} );

	} );

} );