'use strict';

var Domit = require( './domit' );

var _clients = {},
	_docs = {};

var getNextId = (function() {
	var id = 0;
	return function() {
		return ++id;
	};
})();

exports.add = function add( socket ) {
	var clientId = socket.id,
		client = _clients[ clientId ] = {
			docId: null,
			doc: null,
			name: 'User' + getNextId()
		};

	socket.on( 'init', function( data ) {
		var docId = data.docId;
		client.docId = docId;
		var doc = _docs[ docId ];

		if ( !doc ) {
			_docs[ docId ] = doc = {
				id: docId,
				clients: [],
				domit: new Domit( data.content )
			};

			socket.emit( 'init', { name: client.name, head: true } );
		}
		else {
			socket.emit( 'init', { name: client.name, head: doc.domit.head } );
		}
		doc.clients.push( client );
		client.doc = doc;

		// Join doc room.
		socket.join( docId );

		console.log( '[EPIC] Client (' + clientId + ') conntected to edit doc:' + docId );
		console.log( '[EPIC] Number of clients editing doc:' + docId + ': ' + doc.clients.length );
	});

	socket.on( 'disconnect', function() {
		delete _clients[ clientId ];

		var docClients = client.doc.clients;
		docClients.splice( docClients.indexOf( clientId ), 1 );

		if ( !docClients.length ) {
			delete _docs[ client.docId ];
		}
		console.log( '[EPIC] Client (' + clientId + ') disconntected from doc:' + client.docId );
		console.log( '[EPIC] Number of clients editing doc:' + client.docId + ': ' + docClients.length );
	});

	socket.on( 'commit', function( data ) {
		data.clientId = clientId;
		data.clientName = client.name;
	});

	socket.on( 'selection', function( data ) {
		data.clientId = clientId;
		data.clientName = client.name;

		socket.broadcast.to( client.docId ).emit( 'selection', data );
	});

	socket.on( 'name', function( data ) {
		if ( data.clientName == client.name )
			return;

		client.name = data.clientName;

		socket.broadcast.to( client.docId ).emit( 'name', {
			clientId: clientId,
			clientName: client.name
		});

		console.log( '[EPIC] Client (' + clientId + ') changed name to: ' + client.name );
	});
};