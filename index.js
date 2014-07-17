'use strict'
var gutil 	= require('gulp-util');
var shelljs	= require('shelljs/global');
var through = require('through2');

module.exports = function (opts) {

	var stream = through.obj(function(file, enc, callback) {
		this.push(file);
		callback();
	});

	opts = opts || {};

	opts.cwd = opts.cwd || process.cwd();
	opts.bin = opts.bin || 'composer';

	gutil.log("Using cwd: ", opts.cwd);
	var commandToRun = opts.bin+" -d="+opts.cwd+" install";
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
