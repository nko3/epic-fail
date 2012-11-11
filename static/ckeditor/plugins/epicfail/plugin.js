var DEBUG = true;

(function() {
	'use strict';

	var COMMIT_INTERVAL = 1000,
		SELECTION_INTERVAL = 2000;

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
					pendingStamp: null
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
				});

				socket.on( 'init', function( data ) {
					if ( data.head ) {
						editable.setHtml( CKEDITOR.pseudom.writeFragment( data.head ) );
						that.head = data.head;
					}
					that.headHtml = editable.getHtml();
					insertClientPanel( that, data );
				});

				socket.on( 'selection', function( data ) {
					editor.plugins.caretlocator.updateClientCaret( data, editor );
				});

				socket.on( 'name', function( data ) {
					editor.plugins.caretlocator.updateClientCaretName( data );
				});

				socket.on( 'accepted', function( data ) {
					DEBUG && console.log( 'Commit ' + data.stamp + ' has been accepted by the server.' );
				});

				socket.on( 'rejected', function( data ) {
					resetHead( that, data );

					DEBUG && console.log( 'Commit ' + data.stamp + ' has been rejceted by the server.' );
				});

				socket.on( 'push', function() {
					DEBUG && console.log( 'New data has been pushed by the server.' );
				});

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
		}
	});

	function insertClientPanel( that, data ) {
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

		var diff = CKEDITOR.domit.diff( that.head, pending );

		that.socket.emit( 'commit', {
			docId: that.docId,
			diff: diff,
			stamp: stamp,
			// Send new selection, because usually it's changed with content.
			selection: that.editor.getSelection().createBookmarks2( true )
		});
	}

	function resetHead( that, data ) {
		// Only the latest patch counts.
		if ( data.stamp != that.pendingStamp ) {
			return;
		}

		that.pendingStamp = null;
		that.pending = null;

		var current = getCurrent( that ),
			diff = CKEDITOR.domit.diff( current, data.head );
		if ( CKEDITOR.domit.applyDiff( current, diff ) )
			CKEDITOR.domit.applyToDom( that.editable, diff );

		that.head = data.head;
		that.headHtml = that.editable.getHtml();
	}

	function getCurrent( that ) {
		return CKEDITOR.pseudom.parseChildren( that.editable );
	}

})();