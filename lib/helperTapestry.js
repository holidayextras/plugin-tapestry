/* jslint node: true */
'use strict';

/*
* @name /lib/helperTapestry.js
* @description This helper is small, so all the code is in here
* @since Mon Jun 02 2014
* @author Rob Johnson <rob.johnson@holidayextras.com>
*/

var Tapestry = require( 'tapestry' );
var _ = require( 'lodash' );
var util = require('util');
var Q = require( 'q' );

module.exports = {
	do: function( deferred, options ) {

		var tapestry = new Tapestry( {
			sources: [
				{
					name: 'tapestry-exodus',
					connection: {
						host: 'localhost',
						user: 'root',
						password: '',
						database: 'productLibrary'
					},
					mapping: options.mapping,
					debug: options.debug
				}
			]
		} );


		var extractCode = function( data ) {
			if ( data.code && data.code.length == 6 ) {
				return data.code;
			} else if( data.code && data.code.length == 3 && data.location && data.location.length == 3 ) {
				return data.location + data.code;
			 } else {
				return null;
			} 
		}

		var tapestryLookupDeferreds = [];

		var prepareRequest = function( data ) {
			var code = extractCode( data );

			_.each( data, function( fragmentData ) {
				if ( _.isArray(fragmentData) || _.isObject(fragmentData) ) {
					prepareRequest( fragmentData );
				}
			} );

			if ( code ) {

				var tapestryLookupDeferred = Q.defer();
				tapestryLookupDeferreds.push( tapestryLookupDeferred.promise );


				tapestry.get( { ids: [code], identifier: options.identifier }, function( error, result ) { 
					console.log( "Got code" + code );
					if ( result ) {
						data.content = result;
					}
					tapestryLookupDeferred.resolve();
				} );

				// codes.push( code );
				// data.tapestryReplyPosition = tapestryReplyPosition;
				// tapestryReplyPosition++;
			}

		}

		var mergeTapestryCopy = function ( data, tapestryReply ) {
			_.each( data, function( fragmentData ) {
				if ( _.isArray(fragmentData) || _.isObject(fragmentData) ) {
					mergeTapestryCopy( fragmentData, tapestryReply );
				}
			} );

			if ( data.tapestryReplyPosition ) {
				data.content = tapestryReply[data.tapestryReplyPosition];
				delete data.tapestryReplyPosition;
			}
		}

		var inputData = options.inputData;
		var tapestryReplyPosition = 0;
		var codes = [];

		prepareRequest( inputData );

		Q.allSettled( tapestryLookupDeferreds ).then( function() {
			deferred.resolve( inputData );
		} );
	

		// console.log( util.inspect( inputData, false, null ) );
		// console.log('Codes', codes);




		// tapestry.get( { ids: codes, identifier: options.identifier }, function( error, result ) {
		// 	if( error ) {
		// 		deferred.reject( error );
		// 	} else {
		// 		mergeTapestryCopy( inputData, result );
		// 		// console.log( util.inspect( inputData, false, null ) );
		// 		deferred.resolve( inputData );
		// 	}
		// } );
		return deferred.promise;
	}
};
