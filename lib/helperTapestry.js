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
var Q = require( 'q' );

module.exports = {
	do: function( deferred, options ) {

		// The data that has been passed in from revolver
		var revolverData = options.inputData;

		// An array of deferreds that have to be completed for this help to resolve the main deferred
		var tapestryLookupDeferreds = [];

		/*
		*	TODO - extract into proper config
		*
		*/
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


		/*
		* Function to detect a code in the passed in data object.
		* Will detect hotel codes (a 6 character string under the code attribute)
		*	And ticket codes (3 character string under the location and a 3 character sting under code)
		*/
		var extractCode = function( data ) {
			var code;
			if ( data.code && data.code.length == 6 ) {
				code = data.code;
			} else if( data.location && ( data.location.length == 3 ) && data.code && ( data.code.length == 3 ) ) {
				code = data.location + data.code;
			} 

			// If no code found will return null and be ignored by calling function
			return code;
		}

		/*
		* Function to recursivly go through the data structure.
		* If any keys contain arrays or objects it will call itself to examine that child
		*	If a code is detected it will call to tapestry, adding a deferred that will be resolved on success
		*/
		var extractCodesAndCallTapestry = function( data ) {
			// Detect the code
			var code = extractCode( data );

			// If a child is an array or an object then call this function again 
			_.each( data, function( fragmentData ) {
				if ( _.isArray(fragmentData) || _.isObject(fragmentData) ) {
					extractCodesAndCallTapestry( fragmentData );
				}
			} );

			// If a code was detected before
			if ( code ) {

				// Create the deferred and add it to the array that will be checked below
				var tapestryLookupDeferred = Q.defer();
				tapestryLookupDeferreds.push( tapestryLookupDeferred.promise );

				// Make a singular tapestry request with the found code
				tapestry.get( { ids: [code], identifier: options.identifier }, function( error, result ) { 

					// Add the returned result as a content object under the original detected node.
					if ( result ) {
						data.content = result;
					}
					// TODO - on error ? Think we still resolve but maybe add to an error log/reply node

					tapestryLookupDeferred.resolve();
				} );
			}

		}
		
		// Kick off the recursive extraction of the codes
		extractCodesAndCallTapestry( revolverData );

		// When all the deferreds are resolved we can tell the calling code we are done here.
		Q.allSettled( tapestryLookupDeferreds ).then( function() {
			deferred.resolve( revolverData );
		} );

		return deferred.promise;
	}
};
