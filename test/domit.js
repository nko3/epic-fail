'use strict';

var Domit = require( '../src/domit.js' ),
	assert = require( 'assert' );

var dom1 = [ { type: 3, text: 'A' } ],
	dom2 = [ { type: 3, text: 'B' } ],
	dom3 = [ { type: 3, text: 'A' }, { type: 3, text: 'B' } ],
	dom4 = [ { type: 3, text: 'C' }, { type: 3, text: 'D' } ],
	dom5 = [ { type: 1, name: 'a', attributes: {}, children: [] } ],
	dom6 = [ { type: 1, name: 'b', attributes: {}, children: [] } ],
	dom7 = [ { type: 1, name: 'a', attributes: { href: 'x' }, children: [] } ],
	dom8 = [ { type: 1, name: 'a', attributes: {}, children: [ dom1[ 0 ] ] } ];

describe( 'Domit', function() {
	describe( 'constructor', function() {
		it( 'is a function', function() {
			assert( typeof Domit == 'function' );
		});

		it( 'accepts initial content', function() {
			var obj = {};
			var domit = new Domit( obj );

			assert.strictEqual( domit.head, obj );
		});
	});

	describe( '#diff()', function() {
		it( 'returns empty for identical 1', function() {
			assert.deepEqual( Domit.diff( dom1, dom1 ), [] );
		});

		it( 'returns empty for identical 2', function() {
			assert.deepEqual( Domit.diff( dom5, dom5 ), [] );
		});

		it( 'returns delete,insert for entirely different 1', function() {
			assert.deepEqual( Domit.diff( dom1, dom2 ), [
				{
					del: 1,
					addr: [ 0 ], // was at
					prev: null,
					next: null,
					node: dom1[ 0 ]
				},
				{
					ins: 1,
					addr: [ 0 ], // is at
					prev: null,
					next: null,
					node: dom2[ 0 ]
				}
			] );
		});

		it( 'returns delete,insert for entirely different 2', function() {
			assert.deepEqual( Domit.diff( dom2, dom1 ), [
				{
					del: 1,
					addr: [ 0 ], // was at
					prev: null,
					next: null,
					node: dom2[ 0 ]
				},
				{
					ins: 1,
					addr: [ 0 ], // is at
					prev: null,
					next: null,
					node: dom1[ 0 ]
				}
			] );
		});

		it( 'returns delete,insert for entirely different 3', function() {
			assert.deepEqual( Domit.diff( dom3, dom4 ), [
				{
					del: 1,
					addr: [ 0 ], // was at
					prev: null,
					next: dom2[ 0 ],
					node: dom1[ 0 ]
				},
				{
					del: 1,
					addr: [ 1 ], // was at
					prev: dom1[ 0 ],
					next: null,
					node: dom2[ 0 ]
				},
				{
					ins: 1,
					addr: [ 0 ], // is at
					prev: null,
					next: null,
					node: dom1[ 0 ]
				},
				{
					ins: 1,
					addr: [ 0 ], // is at
					prev: dom1[ 0 ], // to be executed after previous
					next: null,
					node: dom1[ 0 ]
				}
			] );
		});

		it( 'returns delete,insert for entirely different 4', function() {
			assert.deepEqual( Domit.diff( dom5, dom6 ), [
				{
					del: 1,
					addr: [ 0 ], // was at
					prev: null,
					next: null,
					node: dom5[ 0 ]
				},
				{
					ins: 1,
					addr: [ 0 ], // is at
					prev: null,
					next: null,
					node: dom6[ 0 ]
				}
			] );
		});

		it( 'returns delete,insert for entirely different 5', function() {
			assert.deepEqual( Domit.diff( dom5, dom7 ), [
				{
					del: 1,
					addr: [ 0 ], // was at
					prev: null,
					next: null,
					node: dom5[ 0 ]
				},
				{
					ins: 1,
					addr: [ 0 ], // is at
					prev: null,
					next: null,
					node: dom7[ 0 ]
				}
			] );
		});

		it( 'returns delete,insert for entirely different 6', function() {
			assert.deepEqual( Domit.diff( dom6, dom7 ), [
				{
					del: 1,
					addr: [ 0 ], // was at
					prev: null,
					next: null,
					node: dom6[ 0 ]
				},
				{
					ins: 1,
					addr: [ 0 ], // is at
					prev: null,
					next: null,
					node: dom7[ 0 ]
				}
			] );
		});

		it( 'returns insert', function() {
			assert.deepEqual( Domit.diff( dom1, dom3 ), [
				{
					ins: 1,
					addr: [ 1 ], // is at
					prev: dom1[ 0 ],
					next: null,
					node: dom2[ 0 ]
				}
			] );
		});

		it( 'returns insert 2', function() {
			assert.deepEqual( Domit.diff( dom2, dom3 ), [
				{
					ins: 1,
					addr: [ 0 ], // is at
					prev: null,
					next: dom2[ 0 ],
					node: dom1[ 0 ]
				}
			] );
		});

		it( 'returns insert 3', function() {
			assert.deepEqual( Domit.diff( dom5, dom8 ), [
				{
					ins: 1,
					addr: [ 0, 0 ], // is at
					prev: null,
					next: null,
					node: dom1[ 0 ]
				}
			] );
		});

		it( 'returns delete 1', function() {
			assert.deepEqual( Domit.diff( dom3, dom1 ), [
				{
					del: 1,
					addr: [ 1 ], // was at
					prev: dom1[ 0 ],
					next: null,
					node: dom2[ 0 ]
				}
			] );
		});

		it( 'returns delete 2', function() {
			assert.deepEqual( Domit.diff( dom3, dom2 ), [
				{
					del: 1,
					addr: [ 0 ], // was at
					prev: null,
					next: dom2[ 0 ],
					node: dom1[ 0 ]
				}
			] );
		});

		it( 'returns delete 3', function() {
			assert.deepEqual( Domit.diff( dom8, dom5 ), [
				{
					del: 1,
					addr: [ 0, 0 ], // was at
					prev: null,
					next: null,
					node: dom1[ 0 ]
				}
			] );
		});
	});
});