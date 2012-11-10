/*
 Copyright (c) 2003-2012, CKSource - Frederico Knabben. All rights reserved.
 For licensing, see LICENSE.html or http://ckeditor.com/license
*/
(function(){CKEDITOR.plugins.add("a11yhelp",{requires:"dialog",availableLangs:{en:1,cs:1,cy:1,da:1,de:1,el:1,eo:1,fa:1,fi:1,fr:1,gu:1,he:1,it:1,mk:1,nb:1,nl:1,no:1,"pt-br":1,ro:1,tr:1,ug:1,vi:1,"zh-cn":1},init:function(a){var c=this;a.addCommand("a11yHelp",{exec:function(){var b=a.langCode,b=c.availableLangs[b]?b:"en";CKEDITOR.scriptLoader.load(CKEDITOR.getUrl(c.path+"dialogs/lang/"+b+".js"),function(){a.lang.a11yhelp=c.langEntries[b];a.openDialog("a11yHelp")})},modes:{wysiwyg:1,source:1},readOnly:1,
canUndo:!1});a.setKeystroke(CKEDITOR.ALT+48,"a11yHelp");CKEDITOR.dialog.add("a11yHelp",this.path+"dialogs/a11yhelp.js")}})})();