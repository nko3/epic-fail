// DOM + GIT -> Domit

(function() {
	'use strict';

	function Domit() {

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