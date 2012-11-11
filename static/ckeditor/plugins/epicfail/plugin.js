(function() {
	'use strict';

	var COMMIT_INTERVAL = 1000,
		SELECTION_INTERVAL = 2000;

	CKEDITOR.plugins.add( 'epicfail', {
		init: function( editor ) {
			var pseudom = editor.plugins.pseudom,
				that = {
					editor: editor,
					editable: null,
					pseudom: pseudom,
					head: null,
					headHtml: null,
					docId: window.location.search.slice( 1 ),
					socket: null
				};

			editor.on( 'contentDom', function() {
				var editable = editor.editable(),
					socket = io.connect();

				that.socket = socket;
				that.editable = editable;

				socket.on( 'connect', function() {
					socket.emit( 'init', {
						docId: that.docId,
						content: pseudom.parseChildren( editable )
					});
				});

				socket.on( 'init', function( data ) {
					if ( data.content ) {
						editable.setHtml( pseudom.writeFragment( data.content ) );
					}
					that.head = data.head;
					that.headHtml = editable.getHtml();
					insertClientForm( that, data );
				});

				socket.on( 'selection', function( data ) {
					editor.plugins.caretlocator.updateClientCaret( data, editor );
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

				socket.on( 'name', function( data ) {
					editor.plugins.caretlocator.updateClientCaretName( data );
				});
			});
		}
	});

	function insertClientForm( that, data ) {
		var form = CKEDITOR.dom.element.createFromHtml( '<div class="clientForm">\
				<label for="clientName">What\'s your name?</label>\
				<input id="clientName" type="text" value="' + data.name + '">\
			</div>' );

		form.appendTo( CKEDITOR.document.getBody() );

		var nameInput = CKEDITOR.document.getById( 'clientName' ),
			nameInputTimeout;

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

		if ( html == that.headHtml )
			return;

		var stamp = +new Date(),
			pending = that.pseudom.parseChildren( editable );

		that.pending = pending;
		that.pendingStamp = stamp;

		that.socket.emit( 'commit', {
			docId: that.docId,
			diff: CKEDITOR.domit.diff( that.head, pending ),
			stamp: stamp,
			// Send new selection, because usually it's changed with content.
			selection: that.editor.getSelection().createBookmarks2( true )
		});
	}

})();