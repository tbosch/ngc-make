var http = require('http');

var options = {
  host: 'localhost',
  path: '/',
  port: '8080',
  method: 'POST'
};

callback = function(response) {
  var str = ''
  response.on('data', function (chunk) {
    str += chunk;
  });

  response.on('end', function () {
    console.log(response.statusCode, str);
  });
}

var req = http.request(options, callback);
var args_1 = require('minimist')(process.argv.slice(2));
var project = args_1.p || args_1.project || '.';
var strictInputs = args_1.strictInputs ? [args_1.strictInputs].concat(args_1._) : null;

var request = {
	"p": project,
	"strictInputs": strictInputs
};

req.write(JSON.stringify(request));
req.end();