var fs = require('fs');
var http = require('http');
var LineByLineReader = require('line-by-line');
// var merge = require('merge');

if (process.argv.length <= 2) {
  console.log("Usage: " + __filename + " path/to/directory");
  process.exit(-1);
}

var path = process.argv[2];

fs.readdir(path, function(err, items) {
  // console.log(items);
  for (var i=0; i<items.length; i++) {
    // console.log(items[i]);
    // var file = path + items[i];
    if ( filenameEndsWith(items[i],'.rules'))
    	// console.log(file);
      readFile(path,items[i])
  }
});

function filenameEndsWith(str,suffix) {
  var reguex= new RegExp(suffix+'$');

  if (str.match(reguex)!=null)
    return true;

  return false;
}

function parseSignatureOpts(opts) {
  // remove leading whitespace before semicolon, pretty common in ruleset
  var normalized = opts.replace(/; /g, ";")
  // split 
  var elements = normalized.split(';');
  var json = {};

  // split array elements into key-value pairs
  // return boolean if key has no value
  for (i=0; i < elements.length; ++i) {
    var pair = elements[i].split(':');
    key = pair[0];
    value = pair[1];
    // last element is still delimited with semicolon
    // results in empty key
    if (key.length) {
      // build array if same key exists multiple times (e.g. pattern fields)
      if (!value) {
        json[key] = true;
      }
      if (key in json) {
        //// if array exists then push new value into it
        //if(typeof array != "undefined" && array != null && array.length > 0){
        //  array.push(value);
        //} else {
        //  // else construct it and add initial values
        //  var array = [];
        //  array.push(json[key]);
        //  json[key] = array;
        //}
        //console.log(key);
        //console.log(value);
      } else {
        json[key] = value;
      }
    }
    //console.log(elements[i].split(':'));
  }
  return json;
}
function getValue(string){

  var separator = string.indexOf(':');
  var next;
  // it is difficult to parse pcre field with regex, thus only use them to remove leading and trailing quotes
  if (separator != -1) {
    next = separator + 1;
    var value = string.substring(next,string.length).trim();
    return value.replace(/^"(.+(?="$))"$/, '$1');
  } else {
    // JSON value field should be boolean if no string exists
    return true
  }
}

function parseSequence(opts,stream) {

  json = {};

  breakpoint = 0;
  //stream.pause();
  for (var i = 0; i < opts.length; i++) {
    // var c = opts.charAt(i);
    if (/;/.test(opts[i])){
      // debug
      var pair = opts.substring(breakpoint, i);
//      console.log('-------------------------');
//      console.log(pair.length);
//      console.log(pair.trim());
//
//      key = pair.split(':')[0];
//      console.log(key);
      key = pair.split(':')[0].trim();
      value = getValue(pair);
      // console.log(key + ':' + value);
      json[key] = value;
      
      //for (var s = 0; s < pair.length; s++){
      //  var c = pair.charAt(s);
      //  if (/:/.test(c)){
      //    key = opts.substring(breakpoint,s);
      //    value = opts.substring(s+1, pair.length);
      //    console.log(key);
      //    //console.log(value);
      //    break;
      //  }
      //}
      

      // proceeding semicolon/colon can be preceded by whitespace
      // does not play well with key-value pairs
      breakpoint = i + 1;
      //next = i + 1;
      //if (opts[next]) {
      //  breakpoint = i + 2;
      //} else {
      //  breakpoint = next;
      //}
    }
    // console.log(c);
  }
  //stream.resume();
  //console.log(JSON.stringify(json));
  return json;

}

//function isBlank(value) {
//  return $.trim(value);
//}

/**
 * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
 * @param obj1
 * @param obj2
 * @returns obj3 a new object based on obj1 and obj2
 */
function merge_options(obj1,obj2){
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}

function readFile(path,fileName) {
  var file = path + fileName;
  var stream = new LineByLineReader(file);
  var regex = new RegExp('^(alert|drop) (\\S+) (\\S+) (\\S+) -> (\\S+) (\\S+) \\((.+)\\)');

  stream.on('line', function(line) {
    if (line.match(regex)!=null) {

      //var opts = line.match(regex)[7];
      var opts = parseSequence(line.match(regex)[7], stream);
      // console.log(opts);

      var signature = {
        "file": fileName,
        "action": line.match(regex)[1],
        "proto": line.match(regex)[2],
        "src_addr": line.match(regex)[3],
        "src_port": line.match(regex)[4],
        "dst_addr": line.match(regex)[5],
        "dst_port": line.match(regex)[6]
        //"opts": opts
      }
      // I assume that keys in both hashes are distinct
      var merged = merge_options(signature, opts)
      console.log(JSON.stringify(merged));
    }
  });
}