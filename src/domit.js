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

	function diffNodesArrs( diff, addr, arr, brr, ai, bi ) {
		var a = arr[ ai ],
			b = brr[ bi ];

		// End of array iteration.
		if ( !a && !b )
			return true;
		// New is longer - b was added.
		if ( !a ) {
			diff.push( {
				ins: 1,
				addr: addr.concat( bi ),
				next: brr[ bi + 1 ] || null,
				prev: brr[ bi - 1 ] || null,
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
				next: arr[ ai + 1 ] || null,
				prev: arr[ ai - 1 ] || null,
				node: a
			});
			// Iterate.
			return diffNodesArrs( diff, addr, arr, brr, ai + 1, bi );
		}

		if ( compareNodes( a, b ) ) {
			if ( a.type == NODE_EL ) {
				// Start iterating level deeper.
				diffNodesArrs( diff, addr.concat( ai ), a.children, b.children, 0, 0 );
			}
			// Iterate.
			return diffNodesArrs( diff, addr, arr, brr, ai + 1, bi + 1 );
		}
		else {

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