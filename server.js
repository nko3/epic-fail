var nodeStatic = require( 'node-static' ),
	socketIO = require( 'socket.io' );

var fileServer = new nodeStatic.Server( './static' );

var server = require( 'http' ).createServer( function( request, response ) {
	request.addListener( 'end', function() {
		fileServer.serve( request, response );
	} );
} )

server.listen( 8080 );
console.log( 'Static server running at :8080.' );

var io = socketIO.listen( server );

io.sockets.on( 'connection', function( socket ) {
	socket.on( 'start', function() {
		console.log(arguments);
	});
} );
