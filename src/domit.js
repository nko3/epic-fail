// DOM + GIT -> Domit

(function() {
	'use strict';

	var NODE_EL = 1,
		NODE_TXT = 3;

	function Domit( content ) {
		this.head = content;
	}

	Domit.diff = function( old, neew ) {
		var diff = [];

		diffNodesArrs( diff, [], old, neew, 0, 0 );

		return diff;
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
				prev: brr[ bi - 1 ] || null,
				next: brr[ bi + 1 ] || null,
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
				prev: arr[ ai - 1 ] || null,
				next: arr[ ai + 1 ] || null,
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