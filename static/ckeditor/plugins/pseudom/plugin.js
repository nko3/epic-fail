(function() {
	'use strict';

	CKEDITOR.plugins.add( 'pseudom', {
		parseChildren: parseChildren,

		writeFragment: writeFragment
	});

	function parseChildren( element ) {
		var children = element.getChildren(),
			childrenArr = [];

		for ( var i = 0, l = children.count(); i < l; ++i ) {
			childrenArr.push( parseNode( children.getItem( i ) ) );
		}

		return childrenArr;
	}

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

		var attributes = element.$.attributes,
			attributesObj = {};

		for ( var i = 0, l = attributes.length; i < l; ++i ) {
			attributesObj[ attributes[ i ].nodeName ] = attributes[ i ].nodeValue;
		}

		if ( !attributesObj[ '_sid' ] ) {
			var val = randomHash( 4 );
			attributesObj[ '_sid' ] = val;
			element.setAttribute( '_sid', val );
		}

		obj.children = parseChildren( element );
		obj.attributes = attributesObj;

		return obj;
	}

	function writeFragment( fragment ) {
		return fragment.map( function( node ) {
			return writeNode( node );
		}).join( '' );
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

		html += writeFragment( element.children );

		return html + '</' + element.name + '>';
	}

	function randomHash( len ) {
		return parseInt( ( Math.random() + '' ).slice( 2 ), 10 ).toString( 30 ).slice( 0, len );
	}
})();