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
					opacity: 1
				});
				clone.setAttributes({
					'id': editable.getId() + '_clone'
				});
				clone.$.scrollTop = editable.$.scrollTop;
				clone.insertBefore( editor.document.getBody().getLast() );
				editable._.clone = clone;
			}, this );
		},

		updateClientCaret: function( clientId, editor, bookmarks ) {
			var editable = editor.editable(),
				bookmark, range, caretPosition;

			// Synchronizes editable content with clone.
			editable._.clone.setHtml( editable.getHtml() );

			if( !( bookmark = bookmarks[ 0 ] ) )
				return clientCarets.detachCaret( clientId );

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
				'detachCaret' ]( clientId, caretPosition );
		}
	});

	var caretTemplate = new CKEDITOR.template( '<span \
		class="synthCaret" id="caret_{clientId}" \
		style="background:{color};">\
			<span class="synthCaretFlag" style="background:{color}">\
				{clientId}\
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
		var colors = [ 'red', 'green', 'blue', 'magenta', 'yellow', 'orange' ],
			carets = {};

		return {
			createCaret: function( clientId ) {
				console.log( 'Creating caret for:' + clientId );

				var clientColor = colors.shift();

				carets[ clientId ] = {
					color: clientColor
				}
				carets[ clientId ].element = CKEDITOR.dom.element.createFromHtml(
					caretTemplate.output( { clientId: clientId, color: clientColor } ) );

				return carets[ clientId ].element;
			},
			attachCaret: function( clientId ) {
				console.log( 'Attaching caret for:' + clientId );

				( carets[ clientId ] || this.createCaret( clientId ) ).appendTo( CKEDITOR.document.getBody() );
			},
			detachCaret: function( clientId ) {
				if ( carets[ clientId ] ) {
					console.log( 'Removing caret for: ' + clientId );
					carets[ clientId ].element.remove();
				}
			},
			moveCaret: function( clientId, position ) {
				var needsUpdate = false,
					i;

				// If no caret for such client or it has been detached, attach it.
				if ( !carets[ clientId ] || !carets[ clientId ].element.isVisible() )
					this.attachCaret( clientId );

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
					console.log( 'Moving caret for:' + clientId + ' to: ', position );

					carets[ clientId ].element.setStyles({
						left: position.x + 'px',
						top: position.y + 'px',
						height: position.height + 'px'
					});

					// Cache the position.
					carets[ clientId ].cachedPosition = position;
				}
			}
		}
	})()
})();