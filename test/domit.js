'use strict';

var Domit = require( '../src/domit.js' ),
	assert = require( 'assert' );

describe( 'Domit', function() {
	describe( 'constructor', function() {
		it( 'is a function', function() {
			assert( typeof Domit == 'function' );
		});
	});
});