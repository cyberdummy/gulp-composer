'use strict'
var gutil 	= require('gulp-util');
var shelljs	= require('shelljs/global');
var through = require('through2');

module.exports = function (cmd, opts) {
	if ( arguments.length < 2 ) { // both arguments weren't supplied
		opts = cmd; // shift in case opts were supplied
		cmd = 'install'; // default command is install
	}

	opts = opts || {}; // options needs to be an object

	//cwd legacy support, but switch to using 'd' parameter key
	opts.d = opts.d || opts.cwd || process.cwd();
	delete opts.cwd; // avoid sending cwd parameter

	var bin = opts.bin || 'composer';
	delete opts.bin; // avoid sending bin parameter

	var stream = through.obj(function(file, enc, callback) {
		this.push(file);
		callback();
	});

	var command = [bin, cmd]; // initialize command array

	var keys = Object.keys( opts );
	for( var i = 0, length = keys.length; i < length; i++ ) {
		if(opts[ keys[ i ] ]) { //handle false case if passed in explicitly
			var parameter = ((keys[ i ].length == 1)?'-':'--'); // use - for d, w, n, etc.
			parameter += keys[ i ]; // add parameter name
			if ( typeof opts[ keys[ i ] ] != 'boolean') {
				parameter += ' ' + opts[ keys[ i ] ];
			}
			command.push( parameter ); // add parameter to command array
		}
	}

	var commandToRun = command.join(' '); // combine composer command and parameters

	gutil.log("Using cwd: ", opts.d);
	gutil.log("Running Composer Command: ", commandToRun);
	
	exec(commandToRun, {silent:true}, function(code, output) {
		if (code != 0)
			stream.emit('error', new gutil.PluginError('gulp-composer', output));
		else
			gutil.log("Composer Completed");

		stream.end();
		stream.emit("end");
	});

	return stream;
};
