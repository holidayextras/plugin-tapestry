/* jslint node: true */
'use strict';

/*
* @name /lib/pluginTapestry.js
* @description
* @since Fri Jul 11 2014
* @author Kevin Hodges <kevin.hodges@holidayextras.com>
*/

var Tapestry = require( 'tapestry' );
var Q = require( 'q' );
var _ = require( 'lodash' );
// get our code patterns
var codePatterns = require( '../configuration/codePatterns' );

exports.register = function( plugin, options, next ) {

	var config = plugin.methods.getService( 'tapestry' );

	config.logger = plugin.methods.getDataLoggingWrapper( 'tapestry' );

	// if there's a cache configuration, append the cache wrapper
	if( config.cache ) {
		config.cache.client = plugin.methods.getCacheWrapper();
	}

	// Create a new Tapestry object based on the passed in configuration
	var tapestry = new Tapestry( config );

	/*
	* Function to detect a code based on the name of the key and the length of the value
	* Supports codePatterns of just a single key and also composite keys across multiple key/values
	*/
	function extractCode( data ) {

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
	* Function to recursively go through the data structure.
	* If any keys contain arrays or objects it will call itself to examine that child
	*	If a code is detected it will call to tapestry, adding a deferred that will be resolved on success
	*/
	function extractCodesAndCallTapestry( tapestryLookupDeferreds, data, identifier ) {

		// Detect the code
		var code = extractCode( data, codePatterns );

		// This function will recursively call itself if any of the child elements are arrays or objects.
		// In which case the function will be called again with the child element becoming 'data'
		// If there are no child arrays or objects then this is the end of the recursion
		_.each( data, function( fragmentData ) {
			if ( _.isArray(fragmentData) || _.isObject(fragmentData) ) {
				extractCodesAndCallTapestry( tapestryLookupDeferreds, fragmentData, identifier );
			}
		} );

		// If we detected a code before then we want to make a call down to tapestry
		if( code ) {
			// Create the deferred and add it to the array that will be checked below
			var tapestryLookupDeferred = Q.defer();
			tapestryLookupDeferreds.push( tapestryLookupDeferred.promise );
			// Make a singular tapestry request with the found code
			tapestry.get( { ids: [code], identifier: identifier }, function( error, result ) {
				// Add the returned result as a content object under the original detected node.
				if( result.length > 0 ) {
					data.content = _.first( result );
				}

				// even if we have an error, resolve the deferred, the content simply not exist from the callers perspective
				tapestryLookupDeferred.resolve();
			} );
		}

	}

	/*
	* Function to expose as our do'er.
	* Will resolve or reject the passed deferred once execution is complete.
	*/
	function makeItSo( options ) {

		var deferred = Q.defer();

		try {

			if( !options ) {
				throw new TypeError( 'invalid options' );
			}

			if( !options.inputData ) {
				throw new TypeError( 'invalid options.inputData' );
			}

			if( !options.identifier ) {
				throw new TypeError( 'invalid options.identifier' );
			}

			// An array of deferreds that have to be completed for this help to resolve the main deferred
			var tapestryLookupDeferreds = [];

			// Kick off the recursive extraction of the codes
			extractCodesAndCallTapestry( tapestryLookupDeferreds, options.inputData, options.identifier );

			// When all the deferreds are resolved we can tell the calling code we are done here.
			Q.allSettled( tapestryLookupDeferreds ).then( function() {
				deferred.resolve( options.inputData );
			} );

		} catch ( error ) {
			deferred.reject( error );
		}

		return deferred.promise;

	}

	// shut up Wesley, https://www.youtube.com/watch?v=RrG4JnrN5GA
	plugin.expose( 'makeItSo', makeItSo );

	next();

};

exports.register.attributes = {
	pkg: require('../package.json')
};
