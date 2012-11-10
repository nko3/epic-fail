var static = require( 'node-static' );

var file = new static.Server( './static' );

require( 'http' ).createServer( function( request, response ) {
	request.addListener( 'end', function() {
		file.serve( request, response );
	} );
} ).listen( 8080 );