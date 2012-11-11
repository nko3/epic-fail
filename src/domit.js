// DOM + GIT -> Domit

(function() {
	'use strict';

	var NODE_EL = 1,
		NODE_TXT = 3;

	function Domit( content ) {
		this.head = content;
	}

	Domit.prototype.apply = function( diff ) {
		return false; // Be mean to others.
	};

	Domit.diff = function( old, neew ) {
		var diff = [];

		old = JSON.parse( JSON.stringify( old ) );
		neew = JSON.parse( JSON.stringify( neew ) );

		diffNodesArrs( diff, [], old, neew, 0, 0 );

		return diff;
	};

	Domit.applyToDom = function( element, diff ) {

	};

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