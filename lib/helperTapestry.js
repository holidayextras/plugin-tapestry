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

		// Create a new Tapestry object based on the passed in sources
		var tapestry = new Tapestry( {
			sources: options.sources
		} );

		/*
		* Function to detect a code based on the name of the key and the length of the value
		* Supports codePatterns of just a single key and also composite keys across multiple key/values
		*/
		var extractCode = function( data, codePatterns ) {

			// If no code found will return null and be ignored by calling function
			var code = null;

			// So we have an array of code patterns that we want to check the data against so lets start looping over them
			_.each( codePatterns, function( codePattern ) {

				// If it is an array of patterns we want to match each and every one of these sub patterns, building up the code as we go
				if ( _.isArray( codePattern ) ) {

					// Start off with a blank string - we will test against an empty string below
					var builtCode = '';

					// A count to keep track of how many codes we have matched. We will use this to compare to the codes requested.
					var codesMatched = 0;

					// Loop over each sub code pattern and if the fieldName and the length match append the value of the key to the builtCode string
					// and increment the codes matched
					_.each( codePattern, function( subPattern ) {
						if ( data[subPattern.fieldName] && ( data[subPattern.fieldName].length === subPattern.length ) ) {
							builtCode += data[subPattern.fieldName];
							codesMatched++;
						}
					} );

					// If we have successfully matched against all the code patterns then we will be ready to request this from Tapestry.
					if ( codesMatched === codePattern.length ) {
						code = builtCode;
					}

				// If it isn't an array detect a single code based on the key and the length of the value
				} else if ( data[codePattern.fieldName] && ( data[codePattern.fieldName].length === codePattern.length ) ) {
					code = data[codePattern.fieldName];
				}
				
			} );
			
			return code;
		}

		/*
		* Function to recursivly go through the data structure.
		* If any keys contain arrays or objects it will call itself to examine that child
		*	If a code is detected it will call to tapestry, adding a deferred that will be resolved on success
		*/
		var extractCodesAndCallTapestry = function( data, codePatterns ) {

			// Detect the code
			var code = extractCode( data, codePatterns );

			// This function will recursivly call itself if any of the child elements are arrays or objects.
			// In which case the function will be called again with the child element becoming 'data'
			// If there are no child arrays or objects then this is the end of the recursion
			_.each( data, function( fragmentData ) {
				if ( _.isArray(fragmentData) || _.isObject(fragmentData) ) {
					extractCodesAndCallTapestry( fragmentData, codePatterns );
				}
			} );

			// If we detected a code before then we want to make a call down to tapestry
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
		extractCodesAndCallTapestry( revolverData, options.codePatterns );

		// When all the deferreds are resolved we can tell the calling code we are done here.
		Q.allSettled( tapestryLookupDeferreds ).then( function() {
			deferred.resolve( revolverData );
		} );

		return deferred.promise;
	}
};
