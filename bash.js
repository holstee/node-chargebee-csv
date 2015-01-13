var dotty = require("dotty");
var path = require("path");
var argv = require('minimist')(process.argv.slice(2));
var moduleFileName = argv._.shift()
var module = require(moduleFileName);

if(argv.object){
  var fn = dotty.get(module, argv.object);
}else{
  var fn = module;
}

if(argv.return){
  var output = fn.apply(null, argv._);
  console.log(output);
}

if(argv.callback){
  var arguments = argv._;
  arguments.push(function(){
    var args = Array.prototype.slice.call(arguments);
    console.log(args);
  });
  fn.apply(null, arguments);
}

if(argv.promise){
  fn.apply(null, argv._).then(function(data){
    console.log(data);
  })
}
