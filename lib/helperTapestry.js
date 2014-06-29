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

module.exports = {
	do: function( deferred, options ) {

		var extractCode = function( data ) {
		  if ( data.code && data.code.length == 6 ) {
		    return data.code;
		  } else if( data.code && data.code.length == 3 && data.location && data.location.length == 3 ) {
		    return data.location + data.code;
		   } else {
		    return null;
		  } 
		}

		var prepareRequest = function( data ) {
			console.log("prepare");
		  var code = extractCode( data );

		  _.each( data, function( fragmentData ) {
		    if ( _.isArray(fragmentData) || _.isObject(fragmentData) ) {
		      prepareRequest( fragmentData );
		    }
		  } );

		  if ( code ) {
		    codes.push( code );
		    data.tapestryCode = code;
		  }

		}

		var inputData = options.inputData;
		var codes = [];

		prepareRequest( inputData );

		console.log(util.inspect(inputData, false, null));
		console.log('Codes', codes);


	// 	var tapestry = new Tapestry( {
	// 		sources: [
	// 			{
	// 				name: 'tapestry-exodus',
	// 				connection: {
	// 					host: options.host,
	// 					user: options.user,
	// 					password: options.password,
	// 					database: options.database
	// 				},
	// 				mapping: options.mapping,
	// 				debug: options.debug
	// 			}
	// 		]
	// 	} );

	// 	console.log(tapestry);
	// 	tapestry.get( { ids: options.productCodes, identifier: options.identifier }, function( error, result ) {
	// 		if( error ) {
	// 			console.log("There was an error", error);
	// 			deferred.resolve( error );
	// 		} else {
	// 			deferred.resolve( result );
	// 		}
	// 	} );
	// 	return deferred.promise;
	}
};
