'use strict';

var _clients = {},
	_docs = {};

exports.add = function add( socket ) {
	var clientId = socket.id,
		client = _clients[ clientId ] = {
			docId: null,
			doc: null
		};

	socket.on( 'init', function( data ) {
		var docId = data.docId;
		client.docId = docId;
		var doc = _docs[ docId ];

		if ( !doc ) {
			_docs[ docId ] = doc = { id: docId, clients: [], content: data.content };
			socket.emit( 'init', { master: true } );
			client.master = true;
		}
		else {
			socket.emit( 'init', { content: doc.content, master: false } );
			client.master = false;
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

		if ( !docClients.lenth ) {
			delete _docs[ client.docId ];
		}
		console.log( '[EPIC] Client (' + clientId + ') disconntected from doc:' + client.docId );
		console.log( '[EPIC] Number of clients editing doc:' + client.docId + ': ' + docClients.length );
	});

	socket.on( 'update', function( data ) {
		// For now forward only master's changes.
		if ( client.master )
			socket.broadcast.to( client.docId ).emit( 'update', data );
	});
};