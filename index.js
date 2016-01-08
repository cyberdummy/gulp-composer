'use strict';
var gutil 	= require('gulp-util'),
	shelljs	= require('shelljs/global'),
	through = require('through2'),

	stream = through.obj(function(file, enc, callback) {
		this.push(file);
		callback();
	}),

	build_arguments = function(opts) {
		var args = []; // initialize command array

		var keys = Object.keys( opts );
		for( var i = 0, length = keys.length; i < length; i++ ) {
			if(opts[ keys[ i ] ]) { //handle false case if passed in explicitly
				var parameter = ((keys[ i ].length == 1)?'-':'--'); // use - for d, w, n, etc.
				parameter += keys[ i ]; // add parameter name
				if ( typeof opts[ keys[ i ] ] != 'boolean') {
					parameter += ' ' + opts[ keys[ i ] ];
				}
				args.push( parameter ); // add parameter to command array
			}
		}
		return args.join(' ');
	},
	log_indent = '|   ',
	log_exec = function(output) {
		var output_lines = output.replace(/^\s+|\s+$/,'').split(/[\n\r]+/),// Trims the output and returns it split into an array of lines
			log_line;
		if (output) {
			for (log_line = 0; log_line < output_lines.length; ++log_line) {
				gutil.log(log_indent,output_lines[log_line]);
			}
		}
	};

if (!which('php')) {
	stream.emit('error', new gutil.PluginError('gulp-composer', "PHP is a composer requirement and therefore it is required to use gulp-composer."));
}
module.exports = function (cmd, opts) {
	var bin, commandToRun, cwd;

	if (typeof cmd === 'undefined' || typeof cmd === 'object') {
		// Looks like this was called with either no parameters
		// or the options were passed through the first parameter
		// In this case, we'll ignore all subsequent params
		opts = cmd || {};
		cmd = 'install';
	} else {
		// Make sure opts is set
		opts = opts || {};
	}

	// cwd legacy support
	cwd = opts['working-dir'] || opts.d || opts.cwd || process.cwd();

	// using --working-dir=xxxx instead of -d makes logging clearer
	// and allows us to remove an unneeded `gutil.log` line
	opts['working-dir'] = cwd;

	delete opts.cwd; // avoid sending cwd parameter
	delete opts.d;   // avoid sending duplicate -d parameter

	// To default to `true` for historical purposes, uncomment the following block
	//if (typeof opts.quiet == 'undefined') {
	//	 opts.quiet = true;
	//}

	// Ensure opts.quiet is a bool
	opts.quiet = !!opts.quiet;

	if (!opts.quiet) {
		// Turn colors on by default
		if (!opts['no-ansi'] && typeof opts.ansi === 'undefined') {
			opts.ansi = true;
		}
	}

	bin = opts.bin || (function(){
			var self_install,
				self_install_dir  = tempdir(),
				self_install_file = 'composer.phar',
				self_install_path = self_install_dir + '/' + self_install_file,
				self_install_options = build_arguments({
					'install-dir': self_install_dir,
					'filename':    self_install_file,
					'quiet':       opts.quiet,
					'ansi':        opts.ansi,
					'no-ansi':    !opts.ansi
				}),
				self_install_alert = function () {
					gutil.log();
					gutil.log(gutil.colors.yellow.inverse(" Significantly improve performance by installing composer on this machine. "));
					gutil.log(gutil.colors.yellow.inverse(" Installation: ") + gutil.colors.yellow.underline.inverse("https://getcomposer.org/doc/00-intro.md") + gutil.colors.yellow.inverse("                     "));
					gutil.log();
				};

			// Use composer.phar if it exists locally...
			if (test('-e',cwd + '/composer.phar')) {
				gutil.log(gutil.colors.green("Defaulting to locally installed " + cwd + "/composer.phar..."));
				return cwd + '/composer.phar';
			}

			// Otherwise use composer if it's installed globally...
			if (which('composer')) {
				gutil.log(gutil.colors.green("Defaulting to globally installed composer..."));
				return 'composer';
			}
			gutil.log(gutil.colors.yellow("Composer is not available globally."));

			if (test('-e', self_install_path)) {
				gutil.log(gutil.colors.yellow("Loading composer from system temp directory..."));
				self_install_alert();
				return self_install_path;
			}

			gutil.log(gutil.colors.yellow("Composer is not available locally, either."));

			// It doesn't exist, so we'll attempt to download it locally and delete it afterward
			if (self_install_options) {
				self_install_options = ' -- ' + self_install_options;
			}

			gutil.log(gutil.colors.magenta.inverse(" Attempting to download composer to system temp directory...               "));
			self_install = exec('php -r "readfile(\'https://getcomposer.org/installer\');" | php' + self_install_options, { async: false, silent: true });

			if (self_install.code != 0) {
				stream.emit('error', new gutil.PluginError('gulp-composer', self_install.output));
			}
			log_exec(self_install.output);

			if (ls(self_install_path)[0]) {
				gutil.log(gutil.colors.magenta.inverse(" Successfully downloaded!                                                  "));
				self_install_alert();
				return self_install_path;
			}

			gutil.log(gutil.colors.red.inverse("Failed to download. All options have been exhausted."));
			gutil.log(gutil.colors.red.inverse("Installation instructions: ") + gutil.colors.blue.underline.inverse("https://getcomposer.org/doc/00-intro.md"));

			return '';
		})();
	delete opts.bin; // avoid sending bin parameter

	if (!bin) {
		stream.emit('error', new gutil.PluginError('gulp-composer', "Composer executable does not exist. Please install before continuing."));
	}


	// build the command array
	commandToRun = [bin, cmd, build_arguments(opts)].join(' ');
	gutil.log(gutil.colors.red(commandToRun));
	gutil.log();
	gutil.log(gutil.colors.cyan.inverse(" Executing composer...                                                     "));

	exec(commandToRun, {silent:true}, function(code, output) {
		if (code != 0) {
			stream.emit('error', new gutil.PluginError('gulp-composer', output));
		}

		log_exec(output);

		gutil.log(gutil.colors.cyan.inverse(" Composer completed.                                                       "));

		stream.end();
		stream.emit("end");
	});

	return stream;
};
