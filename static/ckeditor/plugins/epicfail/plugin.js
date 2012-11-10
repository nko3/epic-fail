(function() {
	'use strict';

	CKEDITOR.plugins.add( 'epicfail', {
		init: function( editor ) {
			editor.on( 'contentDom', function() {
				var editable = editor.editable(),
					docId = window.location.search.slice( 1 ),
					socket = io.connect();

				socket.on( 'connect', function() {
					socket.emit( 'init', { docId: docId, content: parseNode( editable ) } );
				});

				socket.on( 'init', function( data ) {
					editable.setHtml( writeNode( data.content ) );
				});
			});
		}
	});

	function parseNode( node ) {
		switch ( node.type ) {
			case CKEDITOR.NODE_ELEMENT:
				return parseElement( node );
			case CKEDITOR.NODE_TEXT:
				return {
					type: CKEDITOR.NODE_TEXT,
					text: node.getText()
				}
			// Unsupported node type.
			default:
				return null;
		}
	}

	function parseElement( element ) {
		var obj = {
			type: CKEDITOR.NODE_ELEMENT,
			name: element.getName()
		};

		var children = element.getChildren(),
			childrenArr = [];

		for ( var i = 0, l = children.count(); i < l; ++i ) {
			childrenArr.push( parseNode( children.getItem( i ) ) );
		}

		var attributes = element.$.attributes,
			attributesObj = {};

		for ( var i = 0, l = attributes.length; i < l; ++i ) {
			attributesObj[ attributes[ i ].nodeName ] = attributes[ i ].nodeValue;
		}

		obj.children = childrenArr;
		obj.attributes = attributesObj;

		return obj;
	}

	function writeNode( node ) {
		// Write unsupported node type.
		if ( !node ) {
			return '';
		}

		return ( node.type == CKEDITOR.NODE_ELEMENT ?
			writeElement( node ) :
			node.text
		);
	}

	function writeElement( element ) {
		var html = '<' + element.name;

		for ( var name in element.attributes )
			html += ' ' + name + '="' + element.attributes[ name ] + '"';

		if ( CKEDITOR.dtd.$empty[ element.name ] )
			return html + '/>';
		else
			html += '>';

		html += element.children.map( function( node ) {
			return writeNode( node );
		}).join( '' );

		return html + '</' + element.name + '>';
	}

})();