/* jslint node: true */
'use strict';

/*
* @name /lib/helper-tapestry.js
* @description This helper is small, so all the code is in here
* @since Mon Jun 02 2014
* @author Rob Johnson <rob.johnson@holidayextras.com>
*/

var Tapestry = require( 'tapestry' );

module.exports = {
	do: function( deferred, scope, options ) {
		var tapestry = new Tapestry( {
			sources: [
				{
					name: 'tapestry-exodus',
					connection: {
						host: options.host,
						user: options.user,
						password: options.password,
						database: options.database
					},
					mapping: options.mapping
				}
			]
		} );
		tapestry.get( { ids: options.productCodes, identifier: options.identifier }, function( error, result ) {
			if( error ) {
				deferred.reject( error );
			} else {
				deferred.resolve( result );
			}
		} );
		return deferred.promise;
	}
};
