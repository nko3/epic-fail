'use strict';

var _clients = {},
	_docs = {};

exports.add = function add( socket ) {
	var client = _clients[ socket.id ] = {
		docId: null,
		doc: null
	};

	socket.on( 'init', function( data ) {
		var docId = data.docId;
		client.docId = docId;
		var doc = _docs[ docId ];

		if ( !doc ) {
			_docs[ docId ] = doc = { id: docId, clients: [], content: data.content };
		}
		else {
			socket.emit( 'init', { content: doc.content } );
		}
		doc.clients.push( client );
	});
};