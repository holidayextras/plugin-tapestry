/* eslint no-use-before-define:0 */
'use strict';

var Tapestry = require( 'tapestry' );
var Q = require( 'q' );
var _ = require( 'lodash' );
// get our code patterns
var codePatterns = require( '../configuration/codePatterns' );
var pluginName = 'pluginTapestry';

exports.register = function( server, pluginOptions, next ) {

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
  * If a code is detected it will call to tapestry, adding a deferred that will be resolved on success
  */
  function extractCodesAndCallTapestry( tapestryLookupDeferreds, data, identifier ) {

    // Detect the code
    var code = extractCode( data, codePatterns );

    // This function will recursively call itself if any of the child elements are arrays or objects.
    // In which case the function will be called again with the child element becoming 'data'
    // If there are no child arrays or objects then this is the end of the recursion
    _.each( data, function( fragmentData ) {
      if ( _.isArray( fragmentData ) || _.isObject( fragmentData ) ) {
        extractCodesAndCallTapestry( tapestryLookupDeferreds, fragmentData, identifier );
      }
    } );

    // If we detected a code before then we want to make a call down to tapestry
    if ( code ) {
      // Create the deferred and add it to the array that will be checked below
      var tapestryLookupDeferred = Q.defer();
      tapestryLookupDeferreds.push( tapestryLookupDeferred.promise );
      // Make a singular tapestry request with the found code
      tapestry.get( { ids: [code], identifier: identifier }, function( tapestryError, result ) {
        // Add the returned result as a content object under the original detected node.
        if ( !_.isUndefined( result ) && result.length > 0 ) {
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
      if ( !options ) {
        throw new Error( 'invalid options' );
      }

      if ( !options.ids ) {
        throw new Error( 'invalid options.ids' );
      }

      if ( !options.identifier ) {
        throw new Error( 'invalid options.identifier' );
      }

      // Make a singular tapestry request with the ids
      var cleanOptions = _.pick(options, ['identifier', 'ids', 'lang', 'version']);
      tapestry.get(cleanOptions, function(tapestryError, result) {
        if (tapestryError || !result || !result.length) {
          deferred.reject( {
            error: new Error('no results from Tapestry'),
            origin: pluginName,
            data: options
          } );
        } else {
          deferred.resolve(result);
        }
      } );

    } catch ( error ) {
      deferred.reject( {
        error: error,
        origin: pluginName,
        data: options
      } );
    }

    return deferred.promise;

  }


  /*
  * Function to expose as our do'er.
  * Will resolve or reject the passed deferred once execution is complete.
  */
  function makeItSoComplex( options ) {

    var deferred = Q.defer();

    try {

      if ( !options ) {
        throw new Error( 'invalid options' );
      }

      if ( !options.inputData ) {
        throw new Error( 'invalid options.inputData' );
      }

      if ( !options.identifier ) {
        throw new Error( 'invalid options.identifier' );
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
      deferred.reject( {
        error: error,
        origin: pluginName,
        data: options
      } );
    }

    return deferred.promise;

  }

  // Create a variable with enough scope for the functions to see it
  var tapestry;
  // Pull together the necessary service configuration, where the cache is and
  // where to log messages
  var config = server.methods.getService( 'tapestry' );
  config.cache = server.methods.getConfig().cache;
  config.logger = server.methods.getDataLoggingWrapper( 'tapestry' );

  // Create a new Tapestry object based on the resulting configuration
  var promise = new Tapestry( config );
  // Notice we're not handling any errors here, if Tapestry doesn't resolve
  // it's promise for some reason, we want things to blow up
  promise.done( function( tapestryInstance ) {
    // Put Tapestry back onto a scoped variable for future use
    tapestry = tapestryInstance;
    // shut up Wesley, https://www.youtube.com/watch?v=RrG4JnrN5GA
    server.expose( 'makeItSo', makeItSo );
    // KH: This function can be deleted once we restructure the orders::get Works controller
    server.expose( 'makeItSoComplex', makeItSoComplex );

    next();
  } );

};

exports.register.attributes = {
  pkg: require( '../package.json' )
};
