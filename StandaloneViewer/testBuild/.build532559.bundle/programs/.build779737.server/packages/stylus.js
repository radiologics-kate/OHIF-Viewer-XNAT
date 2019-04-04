(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;

(function(){

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/stylus/deprecation_notice.js                             //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
console.warn([
  "The `stylus` package has been deprecated.",
  "",
  "To continue using the last supported version",
  "of this package, pin your package version to",
  "2.513.14 (`meteor add stylus@=2.513.14`).",
].join("\n"));

///////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("stylus");

})();
