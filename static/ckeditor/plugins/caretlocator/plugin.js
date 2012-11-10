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
				clone.insertBefore( editable );
				editable._.clone = clone;
			}, this );
		},

		locateCaret: function( editor ) {
			var editable = editor.editable();
			syncClone( editable );

			var range = editor.getSelection().getRanges()[ 0 ];

			// No selection in editor. Create a range at the beginning of editable.
			if ( !range ) {
				range = new CKEDITOR.dom.range( editor.document );
				range.setStartBefore( editable.getFirst() );
			}

				// An address of the element which is the start container for a caret.
			var caretAddress = range.startContainer.getAddress().slice(
					editable.getAddress().length ),
				// An offset of the caret in start container.
				caretOffset = range.startOffset,
				// Dummy marker which is to determine the absolute position of the caret.
				caretMark = CKEDITOR.dom.element.createFromHtml( '<span style="border-left:1px solid white;position:absolute;">&#8203;</span>' ),
				// A node which is to hold caretMark in clone.
				targetNode = editor.document.getByAddress(
					editable._.clone.getAddress().concat( caretAddress ) );

			// Insert caretMark into a clone.
			if ( targetNode.type == CKEDITOR.NODE_ELEMENT )
				caretMark.insertBefore( targetNode.getChildren().getItem( caretOffset ) );
			else if ( targetNode.type == CKEDITOR.NODE_TEXT )
				caretMark.insertBefore( targetNode.split( caretOffset ) );

			// Where's the dummy caretMark?
			return caretMark.getDocumentPosition();
		}
	});

	function syncClone( editable ) {
		editable._.clone.setHtml( editable.getHtml() );
	}
})();