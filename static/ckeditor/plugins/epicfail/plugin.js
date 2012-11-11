(function() {
	'use strict';

	var UPDATE_INTERVAL = 1000;

	CKEDITOR.plugins.add( 'epicfail', {
		init: function( editor ) {
			editor.on( 'contentDom', function() {
				var editable = editor.editable(),
					docId = window.location.search.slice( 1 ),
					socket = io.connect(),
					pseudom = editor.plugins.pseudom,
					master,
					lastContent;

				socket.on( 'connect', function() {
					socket.emit( 'init', {
						docId: docId,
						content: pseudom.parseChildren( editable )
					});
				});

				socket.on( 'init', function( data ) {
					if ( data.content ) {
						editable.setHtml( pseudom.writeFragment( data.content ) );
					}
					master = data.master;
					insertClientForm( socket, data );
				});

				socket.on( 'update', function( data ) {
					if ( data.master ) {
						editable.setHtml( pseudom.writeFragment( data.content ) );
					}

					editor.plugins.caretlocator.updateClientCaret( data, editor );
				});

				setInterval( function() {
					socket.emit( 'update', {
						docId: docId,
						content: pseudom.parseChildren( editable ),
						selection: editor.getSelection().createBookmarks2( true )
					});
				}, UPDATE_INTERVAL );

				socket.on( 'name', function( data ) {
					editor.plugins.caretlocator.updateClientCaretName( data );
				});
			});
		}
	});

	function insertClientForm( socket, data ) {
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
				socket.emit( 'name', {
					clientName: event.sender.getValue()
				});
			}, 500 );
		}

		nameInput.on( 'change', emitNewName );
		nameInput.on( 'keyup', emitNewName );
	}

})();