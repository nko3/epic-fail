// DOM + GIT -> Domit

(function() {
	'use strict';

	var NODE_EL = 1,
		NODE_TXT = 3;

	function Domit( content ) {
		this.head = content;
	}

	Domit.prototype.apply = function( diff ) {
		var modified = Domit.applyDiff( this.head, diff );

		if ( modified ) {
			this.head = modified;
			return true;
		}
		return false;
	};

	Domit.diff = function( old, neew ) {
		var diff = [];

		old = JSON.parse( JSON.stringify( old ) );
		neew = JSON.parse( JSON.stringify( neew ) );

		diffNodesArrs( diff, [], old, neew, 0, 0 );

		return diff;
	};

	Domit.applyToDom = function( root, diff ) {
		if ( typeof CKEDITOR == 'undefined' )
			throw new Error( 'Domit#applyToDom may be used only together with CKEDITOR.' );

		var change, res,
			toDel = [];

		// Clone.
		diff = diff.concat();

		while ( ( change = diff.shift() ) ) {
			if ( change.ins ) {
				deleteDeferredDom( toDel );
				res = insertAtDom( root, change );
			}
			else {
				res = deleteAtDom( root, change, toDel );
			}
			if ( !res ) {
				return false;
			}
		}

		deleteDeferredDom( toDel );

		return true;
	};;

	Domit.applyDiff = function( current, diff ) {
		var change, res,
			toDel = [];

		// Clone objects.
		current = JSON.parse( JSON.stringify( current ) );
		diff = diff.concat();

		while ( ( change = diff.shift() ) ) {
			if ( change.ins ) {
				deleteDeferred( toDel );
				res = insertAt( current, change );
			}
			else {
				res = deleteAt( current, change, toDel );
			}
			if ( !res ) {
				return false;
			}
		}

		deleteDeferred( toDel );

		return current;
	};

	function insertAt( current, change ) {
		var container = getByAddr( current, change.addr.slice( 0, -1 ) );

		if ( !container || container.type == NODE_TXT )
			return false;

		if ( container.type == NODE_EL )
			container = container.children;

		// Get new node's index.
		var i = change.addr.slice( -1 );

		// Incorrect index.
		if ( i > container.length )
			return false;

		container.splice( i, 0, change.node );

		return true;
	}

	function insertAtDom( root, change ) {
		var container = getByAddrDom( root, change.addr.slice( 0, -1 ) );

		if ( !container || container.type == NODE_TXT )
			return false;

		// Get new node's index.
		var i = change.addr.slice( -1 );

		// Incorrect index.
		if ( i > container.length )
			return false;

		var node = elementFromPseudom( change.node );

		if ( !i ) {
			container.getChild( i ).append( node, true );
		}
		else {
			node.insertAfter( container.getChild( i - 1 ) );
		}

		return true;
	}

	function deleteAt( current, change, toDel ) {
		var container = getByAddr( current, change.addr.slice( 0, -1 ) );

		if ( !container || container.type == NODE_TXT )
			return false;

		if ( container.type == NODE_EL )
			container = container.children;

		// Get index of node that will be removed.
		var i = change.addr.slice( -1 ),
			node = container[ i ];

		if ( !node || !compareNodes( node, change.node ) )
			return false;

		// Defer to delete in reverse order (indexes).
		toDel.push( { container: container, index: i } );

		return true;
	}

	function deleteAtDom( current, change, toDel ) {
		var container = getByAddrDom( current, change.addr.slice( 0, -1 ) );

		if ( !container || container.type == NODE_TXT )
			return false;

		// Get index of node that will be removed.
		var i = change.addr.slice( -1 );

		// Defer to delete in reverse order (indexes).
		toDel.push( { container: container, index: i } );

		return true;
	}

	function deleteDeferred( toDel ) {
		var del;

		while ( ( del = toDel.pop() ) ) {
			del.container.splice( del.index, 1 );
		}
	}

	function deleteDeferredDom( toDel ) {
		var del, child;

		while ( ( del = toDel.pop() ) ) {
			child = del.container.getChild( del.index );
			child && child.remove();
		}
	}

	// ! Modifies addr !
	function getByAddr( root, addr ) {
		// This is the end.
		if ( !addr.length ) {
			return root;
		}
		// Wrong addr.
		if ( !root ) {
			return null;
		}

		var i = addr.shift();

		if ( root.type == NODE_EL ) {
			return getByAddr( root.children[ i ], addr );
		}
		else if ( root.type == NODE_TXT ) {
			return null; // Wrong addr.
		}
		// Doc fragment (array).
		else {
			return getByAddr( root[ i ], addr );
		}
	}

	// ! Modifies addr !
	function getByAddrDom( root, addr ) {
		// This is the end.
		if ( !addr.length ) {
			return root;
		}
		// Wrong addr.
		if ( !root ) {
			return null;
		}

		var i = addr.shift();

		if ( root.type == NODE_EL ) {
			return getByAddr( root.getChild( i ), addr );
		}
		else if ( root.type == NODE_TXT ) {
			return null; // Wrong addr.
		}
		return null; // WAT?
	}

	function elementFromPseudom( pseudom ) {
		if ( pseudom.type == NODE_TXT ) {
			return new CKEDITOR.dom.text( pseudom.text );
		}
		else {
			return new CKEDITOR.dom.element.createFromHtml( CKEDITOR.pseudom.writeElement( pseudom ) );
		}
	}

	function diffNodesArrs( diff, addr, arr, brr, ai, bi, aLookup ) {
		var a = arr[ ai ],
			b = brr[ bi ];

		// End of array iteration.
		if ( !a && !b )
			return;
		// New is longer - b was added.
		if ( !a ) {
			// If not matched before, mark as inserted.
			!b.matched && diff.push( {
				ins: 1,
				addr: addr.concat( bi ),
				prev: shallowClone( brr[ bi - 1 ] ),
				next: shallowClone( brr[ bi + 1 ] ),
				node: b
			});
			// Iterate.
			return diffNodesArrs( diff, addr, arr, brr, ai, bi + 1 );
		}
		// Old is longer - a was removed.
		if ( !b ) {
			diff.push( {
				del: 1,
				addr: addr.concat( ai ),
				prev: shallowClone( arr[ ai - 1 ] ),
				next: shallowClone( arr[ ai + 1 ] ),
				node: a
			});
			// Get back after a lookup in brr.
			if ( aLookup ) {
				return diffNodesArrs( diff, addr, arr, brr, ai + 1, bi - aLookup );
			}
			// Iterate.
			return diffNodesArrs( diff, addr, arr, brr, ai + 1, bi );
		}

		if ( compareNodes( a, b ) ) {
			// Get back after a lookup in brr and then continue iteration and going deeper. Because we need to go deeper.
			if ( aLookup ) {
				// Mark as matched, what will help us skip them after getting back after lookup.
				a.matched = b.matched = true;
				diffNodesArrs( diff, addr, arr, brr, ai + 1, bi - aLookup );
			}
			if ( a.type == NODE_EL ) {
				// Start iterating level deeper.
				diffNodesArrs( diff, addr.concat( ai ), a.children, b.children, 0, 0 );
			}
			// Iterate.
			diffNodesArrs( diff, addr, arr, brr, ai + 1, bi + 1 );
		}
		else {
			// Start lookup in brr for node equals to a.
			diffNodesArrs( diff, addr, arr, brr, ai, bi + 1, ( aLookup || 0 ) + 1, 0 );
		}
	}

	function compareNodes( a, b ) {
		if ( a.type != b.type )
			return false;

		if ( a.type == NODE_EL ) {
			return a.name == b.name &&
				compareAttributes( a.attributes, b.attributes );
		}
		else {
			return a.text == b.text;
		}
	}

	function compareAttributes( a, b ) {
		var aKeys = Object.keys( a ),
			bKeys = Object.keys( b );

		if ( aKeys.length != bKeys.length ) {
			return false;
		}

		var name;
		while ( ( name = aKeys.pop() ) ) {
			if ( b[ name ] !== a[ name ] ) {
				return false;
			}
		}
		return true;
	}

	function shallowClone( node ) {
		if ( !node )
			return null;

		if ( node.type == NODE_TXT ) {
			return {
				type: NODE_TXT,
				text: node.text
			};
		}
		else {
			return {
				type: NODE_EL,
				name: node.name,
				attributes: JSON.parse( JSON.stringify( node.attributes ) )
			};
		}
	}

	// Exports Domit depending on environment.
	if ( typeof module != 'undefined' && module && module.exports ) {
		module.exports = Domit;
	}
	else if ( typeof CKEDITOR != 'undefined' ) {
		CKEDITOR.domit = Domit;
	}
	else {
		window.Domit = Domit;
	}

})();