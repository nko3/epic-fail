'use strict';

var nodeStatic = require( 'node-static' ),
	socketIO = require( 'socket.io' ),
	epicFail = require( './src/epic-fail' );

var fileServer = new nodeStatic.Server( './static' );

var server = require( 'http' ).createServer( function( request, response ) {
	request.addListener( 'end', function() {
		fileServer.serve( request, response );
	});
})

server.listen( 8080 );
console.log( '[EPIC] Static server running at :8080.' );

var io = socketIO.listen( server );

// Switch off debug messages.
//io.set( 'log level', 1 );

io.sockets.on( 'connection', function( socket ) {
	epicFail.add( socket );
});
console.log( '[EPIC] Sockets server running at :8080.' );