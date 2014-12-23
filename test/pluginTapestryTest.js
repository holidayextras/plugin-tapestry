/* jslint node: true */
/* jshint -W098 */ // Ignore 'is defined but never used' errors
/* jshint -W030 */ /* Stop linter complaining about expression */
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
var sinon = require( 'sinon' );
var chai = require( 'chai' );
var chaiAsPromised = require( 'chai-as-promised' );
chai.use( chaiAsPromised );
var should = chai.should();
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
		// simulate that here so we don't try and talk to them
		server.methods.getService = sinon.stub().returns( {
			"sources": [{}]
		} );
		server.methods.getDataLoggingWrapper = sinon.stub().returns( null );
		server.methods.getConfig = sinon.stub().returns( {
			cache: false
		} ); // not testing the cache either
		server.pack.register( { plugin: require( pluginLocation ) }, function() {
			done();
		} );
	} );

	describe( '#register', function() {
		it( 'should allow us to access the plugin off the hapi server', function( done ) {
			server.plugins[pluginName].should.not.be.undefined;
			done();
		} );
	} );

	describe( '#makeItSo', function() {

		describe( 'check the function is created', function() {
			it( 'should expose makeItSo as a function on the plugin', function( done ) {
				server.plugins[pluginName].makeItSo.should.be.a( 'function' );
				done();
			} );
		} );

		describe( 'end to end to check we fail with a thrown error when options arent valid', function() {
			it( 'should reject the promise because of invalid options', function() {
				return server.plugins[pluginName].makeItSo().should.eventually.be.rejected.and.eventually.have.property( 'error' ).that.is.an.instanceof( Error );
			} );

			it( 'should reject the promise because of invalid options.ids', function() {
				return server.plugins[pluginName].makeItSo( loadTestResource( './fixtures/invalidOptionsInputData' ) ).should.eventually.be.rejected.and.eventually.have.property( 'error' ).that.is.an.instanceof( Error );
			} );

			it( 'should reject the promise because of invalid options.identifier', function() {
				return server.plugins[pluginName].makeItSo( loadTestResource( './fixtures/invalidOptionsIdentifier' )  ).should.eventually.be.rejected.and.eventually.have.property( 'error' ).that.is.an.instanceof( Error );
			} );
		} );

		describe( 'end to end to check no code matches is handled correctly', function() {
			it( 'should reject the promise because no results came back', function() {
				return server.plugins[pluginName].makeItSo( loadTestResource( './fixtures/noCode' ) ).should.eventually.be.rejected.and.eventually.have.property( 'error' ).that.is.an.instanceof( Error );
			} );
		} );

		describe( 'end to end to check the result gets handled correctly from the call to tapestry.get', function() {
			before( function() {
				// make tapestry.get return the values we can test against
				tapestryMethodStub = sinon.stub( Tapestry.prototype, 'get' ).callsArgWith( 1, null, loadTestResource( './fixtures/ABC123Content' ) );
			} );

			it( 'should return an array of objects from the ids passed in', function() {
				var expected = loadTestResource( './expected/ABC234Result' );
				return server.plugins[pluginName].makeItSo( loadTestResource( './fixtures/ABC123Key' ) ).should.eventually.be.fulfilled.and.eventually.deep.equal( expected );
			} );

			after( function() {
				tapestryMethodStub.restore();
			} );
		} );

	} );

	describe( '#makeItSoComplex', function() {

		describe( 'check the function is created', function() {

			it( 'should expose makeItSoComplex as a function on the plugin', function( done ) {
				server.plugins[pluginName].makeItSoComplex.should.be.a( 'function' );
				done();
			} );

		} );

		describe( 'end to end to check we fail with a thrown error when options arent valid', function() {

			it( 'should reject the promise because of invalid options', function() {
				return server.plugins[pluginName].makeItSoComplex().should.eventually.be.rejected.and.eventually.have.property( 'error' ).that.is.an.instanceof( Error );
			} );

			it( 'should reject the promise because of invalid options.inputData', function() {
				return server.plugins[pluginName].makeItSoComplex( loadTestResource( './fixtures/invalidOptionsInputData' ) ).should.eventually.be.rejected.and.eventually.have.property( 'error' ).that.is.an.instanceof( Error );
			} );

			it( 'should reject the promise because of invalid options.identifier', function() {
				return server.plugins[pluginName].makeItSoComplex(  loadTestResource( './fixtures/invalidOptionsIdentifier' ) ).should.eventually.be.rejected.and.eventually.have.property( 'error' ).that.is.an.instanceof( Error );
			} );

		} );

		describe( 'end to end to check no code matches is handled correctly', function() {

			it( 'should resolve with an empty object', function() {
				var expected = loadTestResource( './expected/noResult' );
				return server.plugins[pluginName].makeItSoComplex( loadTestResource( './fixtures/noCode' )  ).should.eventually.be.fulfilled.and.eventually.deep.equal( expected );
			} );

		} );

		describe( 'end to end to check the correct arguments reach the call to tapestry.get', function() {

			before( function() {
				// spy on the arguments that get to the tapestry.get call
				tapestryMethodStub = sinon.spy( Tapestry.prototype, 'get' );
			} );

			it( 'should assign the fixture to the requested input `code`', function() {
				var expected = loadTestResource( './expected/ABC123Arguments' );
				return server.plugins[pluginName].makeItSoComplex( loadTestResource( './fixtures/ABC123Key' ) ).then( function( result ) {
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

			before( function() {
				// make tapestry.get return the values we can test against
				tapestryMethodStub = sinon.stub( Tapestry.prototype, 'get' ).callsArgWith( 1, null, loadTestResource( './fixtures/ABC123Content' ) );
			} );

			it( 'should bind the expected content to the requested fixture input `code`', function() {
				var expected = loadTestResource( './expected/ABC123Result' );
				return server.plugins[pluginName].makeItSoComplex( loadTestResource( './fixtures/ABC123Key' ) ).should.eventually.be.fulfilled.and.eventually.deep.equal( expected );
			} );

			after( function() {
				tapestryMethodStub.restore();
			} );

		} );

		describe( 'end to end to check the result gets handled correctly from the call to tapestry.get when no content is found', function() {

			before( function() {
				// make tapestry.get return the values we can test against
				tapestryMethodStub = sinon.stub( Tapestry.prototype, 'get' ).callsArgWith( 1, null, loadTestResource( './fixtures/noResult' ) );
			} );

			it( 'should not add a `code` property', function() {
				var expected = loadTestResource( './expected/ABC123NoResult' );
				return server.plugins[pluginName].makeItSoComplex( loadTestResource( './fixtures/ABC123Key' ) ).should.eventually.be.fulfilled.and.eventually.deep.equal( expected );
			} );

			after( function() {
				tapestryMethodStub.restore();
			} );

		} );

	} );

} );