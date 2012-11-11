var DEBUG = true;

(function() {
	'use strict';

	var COMMIT_INTERVAL = 200,
		SELECTION_INTERVAL = 500;

	CKEDITOR.plugins.add( 'epicfail', {
		init: function( editor ) {
			var that = {
					editor: editor,
					editable: null,
					head: null,
					headHtml: null,
					docId: window.location.search.slice( 1 ),
					socket: null,
					pending: null,
					pendingStamp: null,
					pendingHtml: null
				};

			editor.on( 'contentDom', function() {
				var editable = editor.editable(),
					socket = io.connect();

				that.socket = socket;
				that.editable = editable;

				socket.on( 'connect', function() {
					that.head = getCurrent( that );
					socket.emit( 'init', {
						docId: that.docId,
						head: that.head
					});
				});

				socket.on( 'disconnect', function( data ) {
					editor.plugins.caretlocator.updateClientCaret( data, editor );
					updateClientList( data.clients );
				});

				socket.on( 'init', function( data ) {
					if ( data.head ) {
						editable.setHtml( CKEDITOR.pseudom.writeFragment( data.head ) );
						that.head = data.head;
					}
					that.headHtml = editable.getHtml();
					initClientPanel( that, data );
					updateClientList( data.clients );

					// Start updating server after connection was initialized.
					setInterval( function() {
						commitChanges( that );
					}, COMMIT_INTERVAL );

					setInterval( function() {
						// Don't send selection when waiting for commit acceptance, becaue
						// it may be outdated.
						if ( !that.pending )
							socket.emit( 'selection', { selection: editor.getSelection().createBookmarks2( true ) } );
					}, SELECTION_INTERVAL );
				});

				socket.on( 'selection', function( data ) {
					editor.plugins.caretlocator.updateClientCaret( data, editor );
					updateClientList( data.clients );
				});

				socket.on( 'name', function( data ) {
					editor.plugins.caretlocator.updateClientCaretName( data );
					updateClientList( data.clients );
				});

				socket.on( 'accepted', function( data ) {
					accepted( that, data );
					DEBUG && console.log( 'Commit ' + data.stamp + ' has been accepted by the server.' );
				});

				socket.on( 'rejected', function( data ) {
					resetHead( that, data );

					DEBUG && console.log( 'Commit ' + data.stamp + ' has been rejected by the server.' );
				});

				socket.on( 'push', function( data ) {
					mergeWith( that, data );
					editor.plugins.caretlocator.updateClientCaret( data, editor );

					DEBUG && console.log( 'New data has been pushed by the server.' );
				});

				socket.on( 'reset', function( data ) {
					resetHard( that, data );

					DEBUG && console.log( 'Had to reset --hard to master.' );
				});

			});
		}
	});

	function updateClientList( clients ) {
		var list = CKEDITOR.document.getById( 'lobbyClients' ),
			client;

		if ( !clients )
			return;

		list.setHtml( '' );

		for ( var i = clients.length; i--; ) {
			client = clients[ i ];
			CKEDITOR.dom.element.createFromHtml(
			        '<li id="client_' + client.clientId + '">\
			                <span class="clientColor" style="background:'+ client.clientColor + ';">&nbsp;</span>' +
			                client.clientName +
			        '</li>' ).appendTo( list );
		}
	}

	function initClientPanel( that, data ) {
		var nameInput = CKEDITOR.document.getById( 'clientName' ),
			nameInputTimeout;

		nameInput.setValue( data.clientName );

		function emitNewName( event ) {
			clearTimeout( nameInputTimeout );
			nameInputTimeout = setTimeout( function() {
				that.socket.emit( 'name', {
					clientName: event.sender.getValue()
				});
			}, 500 );
		}

		nameInput.on( 'change', emitNewName );
		nameInput.on( 'keyup', emitNewName );
	}

	function commitChanges( that ) {
		var editable = that.editable,
			html = editable.getHtml();

		if ( html == that.headHtml || that.pending )
			return;

		var stamp = +new Date(),
			pending = getCurrent( that );

		that.pending = pending;
		that.pendingStamp = stamp;
		that.pendingHtml = html;

		var diff = CKEDITOR.domit.diff( that.head, pending );

		that.socket.emit( 'commit', {
			docId: that.docId,
			diff: diff,
			stamp: stamp,
			// Send new selection, because usually it's changed with content.
			selection: that.editor.getSelection().createBookmarks2( true )
		});
	}

	function accepted( that, data ) {
		// Only the latest patch counts
		if ( that.pendingStamp != data.stamp )
			return;

		that.head = that.pending; // TODO after server pushed that should be reset to what it has left.
		that.headHtml = that.pendingHtml;
		resetPending( that );
	}

	function resetHead( that, data ) {
		// Only the latest patch counts.
		if ( data.stamp != that.pendingStamp ) {
			return;
		}

		var current = getCurrent( that ),
			diff = CKEDITOR.domit.diff( current, data.head );
		if ( CKEDITOR.domit.applyDiff( current, diff ) )
			CKEDITOR.domit.applyToDom( that.editable, diff );

		that.head = data.head;
		that.headHtml = that.editable.getHtml();
		resetPending( that );
	}

	function resetHard( that, data ) {
		that.editable.setHtml( CKEDITOR.pseudom.writeFragment( data.head ) );

		that.head = data.head;
		that.headHtml = that.editable.getHtml();
		resetPending( that );
	}

	function mergeWith( that, data ) {
		var current = getCurrent( that ),
			merged = CKEDITOR.domit.applyDiff( current, data.diff );

		if ( merged ) {
			// Commit before pulling.
			commitChanges( that );

			if ( CKEDITOR.domit.applyToDom( that.editable, data.diff ) ) {
				that.head = merged;
				that.headHtml = that.editable.getHtml();
				// Update local pending changes after merging.
				if ( that.pending ) {
					that.pending = merged;
					that.pendingHtml = that.headHtml;
				}
				return;
			}
		}

		// Force reset to master.
		that.socket.emit( 'reset' );
	}

	function resetPending( that ) {
		that.pendingStamp = null;
		that.pending = null;
		that.pendingHtml = null;
	}

	function getCurrent( that ) {
		return CKEDITOR.pseudom.parseChildren( that.editable );
	}

})();