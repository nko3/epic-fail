﻿/*
 Copyright (c) 2003-2012, CKSource - Frederico Knabben. All rights reserved.
 For licensing, see LICENSE.html or http://ckeditor.com/license
*/
(function(){function h(a,b){var e=CKEDITOR.cleanWord;if(e)b();else{var f=CKEDITOR.getUrl(CKEDITOR.config.pasteFromWordCleanupFile||a+"filter/default.js");CKEDITOR.scriptLoader.load(f,b,null,!0)}return!e}function i(a){a.data.type="html"}CKEDITOR.plugins.add("pastefromword",{requires:"clipboard",lang:"af,ar,bg,bn,bs,ca,cs,cy,da,de,el,en-au,en-ca,en-gb,en,eo,es,et,eu,fa,fi,fo,fr-ca,fr,gl,gu,he,hi,hr,hu,is,it,ja,ka,km,ko,lt,lv,mk,mn,ms,nb,nl,no,pl,pt-br,pt,ro,ru,sk,sl,sr-latn,sr,sv,th,tr,ug,uk,vi,zh-cn,zh",
icons:"pastefromword,pastefromword-rtl",init:function(a){var b=0,e=this.path;a.addCommand("pastefromword",{canUndo:!1,async:!0,exec:function(a){var d=this;b=1;a.on("beforePaste",i);a.getClipboardData({title:a.lang.pastefromword.title},function(c){c&&a.fire("paste",{type:"html",dataValue:c.dataValue});a.fire("afterCommandExec",{name:"pastefromword",command:d,returnValue:!!c})})}});a.ui.addButton&&a.ui.addButton("PasteFromWord",{label:a.lang.pastefromword.toolbar,command:"pastefromword",toolbar:"clipboard,50"});
a.on("pasteState",function(b){a.getCommand("pastefromword").setState(b.data)});a.on("paste",function(f){var d=f.data,c=d.dataValue;if(c&&(b||/(class=\"?Mso|style=\"[^\"]*\bmso\-|w:WordDocument)/.test(c))){var g=h(e,function(){if(g)a.fire("paste",d);else if(!a.config.pasteFromWordPromptCleanup||b||confirm(a.lang.pastefromword.confirmCleanup))d.dataValue=CKEDITOR.cleanWord(c,a)});g&&f.cancel()}},null,null,3)}})})();