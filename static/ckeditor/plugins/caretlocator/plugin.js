(function() {
	'use strict';

	CKEDITOR.plugins.add( 'caretlocator', {
		init: function( editor ) {
			editor.on( 'contentDom', function() {
				var editable = editor.editable(),
					clone = editable.clone( true );

				// We need to prevent margin collapsing effect on the editable element to make selection highlight shadow works.
				// http://reference.sitepoint.com/css/collapsingmargins
				if ( !( editable.getComputedStyle( 'position' ) == 'absolute' || ( /^inline/ ).exec( editable.getComputedStyle( 'display' ) ) ) ) {
					var sides = [ 'top', 'bottom' ];
					for ( var i = 0, side; side = sides[ i ], i < 2; i++ ) {
						var borderSize = parseInt( editable.getComputedStyle( 'border-' + side + '-width' ), 10 ),
							paddingSize = parseInt( editable.getComputedStyle( 'padding-' + side ), 10 ),
							style;

						if ( !( borderSize || paddingSize ) ) {
							style = 'border-' + side;
							// Force a transparent border on it.
							editable.setStyle( style, '1px solid transparent' );
						}
					}
				}

				clone.setStyles({
					'z-index': -1,
					position: 'absolute',
					left: editable.$.offsetLeft + 'px',
					top: editable.$.offsetTop + 'px',
					width: editable.getSize( 'width', 1 ) + 'px',
					height: editable.getSize( 'height', 1 ) + 'px',
					color: 'red',
					opacity: 0
				});
				clone.setAttributes({
					'id': editable.getId() + '_clone'
				});
				clone.$.scrollTop = editable.$.scrollTop;
				clone.appendTo( editor.document.getBody() );
				editable._.clone = clone;
			}, this );
		},

		updateClientCaret: function( data, editor ) {
			var editable = editor.editable(),
				clientId = data.clientId,
				bookmark = data.selection[ 0 ],
				range, caretPosition;

			// Synchronizes editable content with clone.
			editable._.clone.setHtml( editable.getHtml() );

			if( !bookmark )
				return clientCarets.detachCaret( data );

			// Move bookmark address from editable to the clone by replacing
			// some very first digits of the address.
			Array.prototype.splice.apply(
				bookmark.start,
				[].concat( 0, editable.getAddress().length, editable._.clone.getAddress() ) );

			range = new CKEDITOR.dom.range( editor.document );
			range.moveToBookmark( bookmark );

			// If the position exist (caret exist), move the synthetic caret.
			// Otherwise remove it.
			clientCarets[ ( caretPosition = locateCaretByRange( editor, range ) ) ?
				'moveCaret'
					:
				'detachCaret' ]( data, caretPosition );
		},

		updateClientCaretName: function( data ) {
			clientCarets.updateCaretName( data );
		}
	});

	var caretTemplate = new CKEDITOR.template( '<span \
		class="synthCaret" \
		id="caret_{clientId}" \
		style="background:{color};">\
			<span class="synthCaretFlag" style="background:{color}">\
				{clientName}\
			</span>\
		</span>' ),
		caretMakTemplate = '<span style="border-left:1px solid white;position:absolute;">&#8203;</span>';

	// Returns caret coordinates for a given range, which MUST belong
	// to the editable's clone.
	function locateCaretByRange( editor, range ) {
		// Dummy marker which is to determine the absolute position of the caret.
		var caretMark = CKEDITOR.dom.element.createFromHtml( caretMakTemplate );
		range.insertNode( caretMark );

		// Where's the dummy caretMark?
		return CKEDITOR.tools.extend(
			caretMark.getDocumentPosition(),
			{ height: parseInt( caretMark.getComputedStyle( 'height' ), 10 ) } );
	}

	var clientCarets = (function() {
		var carets = {};

		return {
			attachCaret: function( data ) {
				console.log( 'Attaching caret for:' + data.clientId );

				( carets[ data.clientId ] || this.createCaret( data ) ).appendTo( CKEDITOR.document.getBody() );
			},
			createCaret: function( data ) {
				var clientId = data.clientId,
					clientName = data.clientName,
					clientColor = data.clientColor;

				console.log( 'Creating caret for ' + clientId + '(' + clientName + ')'  );

				carets[ clientId ] = {
					color: clientColor
				}
				carets[ clientId ].element = CKEDITOR.dom.element.createFromHtml(
					caretTemplate.output( {
						clientId: clientId,
						clientName: clientName,
						color: clientColor
					} ) );

				return carets[ clientId ].element;
			},
			detachCaret: function( data ) {
				console.log( 'Wanna detach... ', data );
				if ( carets[ data.clientId ] ) {
					console.log( 'Removing caret for ' + data.clientId );
					carets[ data.clientId ].element.remove();
				}
			},
			moveCaret: function( data, position ) {
				var needsUpdate = false,
					clientId = data.clientId,
					clientName = data.clientName,
					i;

				// If clientName, no caret for such client or it has been detached, attach it.
				if ( !carets[ clientId ] || !carets[ clientId ].element.isVisible() )
					this.attachCaret( data );

				// If there's cached position for a caret...
				if ( carets[ clientId ].cachedPosition ) {
					// Find out whether position has changed.
					for ( i in position ) {
						if ( position[ i ] != carets[ clientId ].cachedPosition[ i ] ) {
							needsUpdate = true;
							break;
						}
					}
				}
				// If no caret, position is brand new.
				else
					needsUpdate = true;

				if ( needsUpdate ) {
					console.log( 'Moving caret for ' + clientId + ' to: ', position );

					carets[ clientId ].element.setStyles({
						left: position.x + 'px',
						top: position.y + 'px',
						height: position.height + 'px'
					});

					// Cache the position.
					carets[ clientId ].cachedPosition = position;
				}
			},
			updateCaretName: function( data ) {
				var clientId = data.clientId,
					clientName = data.clientName;

				if ( carets[ clientId ] ) {
					console.log( 'Updating caret name for ' + clientId + ': ' + clientName );

					carets[ clientId ].element.getFirst( function( node ) {
						return node.type == CKEDITOR.NODE_ELEMENT;
					}).setText( clientName );
				}
			}
		}
	})()
})();