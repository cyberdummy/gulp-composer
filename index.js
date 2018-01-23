'use strict';
/*jslint node: true */
/*jslint unparam: true */
/*global which, gulp, tempdir, test, exec, ls */
var log = require('fancy-log'),
    PluginError = require('plugin-error'),
    colors = require('ansi-colors'),
    shelljs = require('shelljs/global'),
    through = require('through2'),

    stream = through.obj(function (file, enc, callback) {
        this.push(file);
        callback();
    });

var build_arguments = function (opts) {
        var i, args = [], // initialize command array
            keys = Object.keys(opts),
            parameter;
        for (i = 0; i < keys.length; i += 1) {
            if (opts[keys[i]]) { //handle false case if passed in explicitly
                parameter = ((keys[i].length === 1) ? '-' : '--'); // use - for d, w, n, etc.
                parameter += keys[i]; // add parameter name
                if (typeof opts[keys[i]] !== 'boolean') {
                    parameter += ' ' + opts[keys[i]];
                }
                args.push(parameter); // add parameter to command array
            }
        }
        return args.join(' ');
    },
    log_indent = '|   ',
    log_exec = function (output) {
        var output_lines, log_line;
        if (output) {
            output_lines = output.replace(/^\s+|\s+$/, '').split(/[\n\r]+/); // Trims the output and returns it split into an array of lines
            for (log_line = 0; log_line < output_lines.length; log_line += 1) {
                log(log_indent, output_lines[log_line]);
            }
        }
    };
/*jslint unparam: false*/

if (!which('php')) {
    stream.emit('error', new PluginError('gulp-composer', "PHP is a composer requirement and therefore it is required to use gulp-composer."));
}
module.exports = function (cmd, opts) {
    var commandToRun, execReturn,
        self_install = true,
        async = true,
        bin, cwd,
        handle_exec = function (code, output) {
            if (code !== 0) {
                stream.emit('error', new PluginError('gulp-composer', output));
            }

            log_exec(output);

            log(colors.inverse(colors.cyan(" Composer completed.                                                       ")));

            stream.end();
            stream.emit("end");
        };

    if (cmd === undefined || typeof cmd === 'object') {
        // Looks like this was called with either no parameters
        // or the options were passed through the first parameter
        // In this case, we'll ignore all subsequent params
        opts = cmd || {};
        cmd = 'install';
    } else {
        // Make sure opts is set
        opts = opts || {};
    }

    // optional self-install support
    if (opts['self-install'] !== undefined) {
        self_install = !!opts['self-install'];
        delete opts['self-install']; // avoid sending parameter to composer
    }

    // optional async support
    if (opts.async !== undefined) {
        async = !!opts.async;
        delete opts.async; // avoid sending parameter to composer
    }

    // cwd legacy support
    cwd = "\"" + (opts['working-dir'] || opts.d || opts.cwd || process.cwd()) + "\"";

    // using --working-dir=xxxx instead of -d makes logging clearer
    // and allows us to remove an unneeded `log` line
    opts['working-dir'] = cwd;

    delete opts.cwd; // avoid sending parameter to composer
    delete opts.d; // avoid sending duplicate -d parameter

    // Ensure opts.quiet is a bool
    opts.quiet = !!opts.quiet;

    if (!opts.quiet) {
        // Turn colors on by default
        if (!opts['no-ansi'] && opts.ansi === undefined) {
            opts.ansi = true;
        }
    }

    if (opts.bin === 'auto') {
        delete opts.bin;
    }

    // if supplied a custom binary make sure self install is off
    if (opts.bin) {
      self_install = false;
    }

    bin = opts.bin || (function () {
        var self_install_cmd,
            self_install_dir = tempdir(),
            self_install_file = 'gulp-composer.phar',
            self_install_path = self_install_dir + '/' + self_install_file,
            self_install_options = build_arguments({
                'install-dir': self_install_dir,
                'filename': self_install_file,
                'quiet': opts.quiet,
                'ansi': opts.ansi,
                'no-ansi': !opts.ansi
            }),
            self_install_alert = function () {
                log();
                log(colors.inverse(colors.yellow(" Significantly improve performance by installing composer on this machine. ")));
                log(colors.inverse(colors.yellow(" Installation: ")) + colors.inverse(colors.underline(colors.yellow("https://getcomposer.org/doc/00-intro.md"))) + colors.inverse(colors.yellow("                     ")));
                log();
            };

        // Use composer.phar if it exists locally...
        if (test('-e', cwd + '/composer.phar')) {
            log(colors.green("Defaulting to locally installed " + cwd + "/composer.phar..."));
            return cwd + '/composer.phar';
        }
        log(colors.yellow("Composer is not available locally."));

        // Otherwise use composer if it's installed globally...
        if (which('composer')) {
            log(colors.green("Defaulting to globally installed composer..."));
			self_install = false;
            return 'composer';
        }
        log(colors.yellow("Composer is not available globally."));

        if (!self_install) {
            log(colors.inverse(colors.red("Failed to load composer and self-install has been disabled.")));
            log(colors.inverse(colors.red("Installation instructions: ")) + colors.inverse(colors.underline(colors.blue("https://getcomposer.org/doc/00-intro.md"))));
            return '';
        }

        if (test('-e', self_install_path)) {
            log(colors.yellow("Loading composer from system temp directory..."));
            self_install_alert();
            return self_install_path;
        }

        log(colors.yellow("Composer is not available from the system temp, either."));

        // It doesn't exist, so we'll attempt to download it locally and delete it afterward
        if (self_install_options) {
            self_install_options = ' -- ' + self_install_options;
        }

        log(colors.inverse(colors.magenta(" Attempting to download composer to system temp directory...               ")));
        self_install_cmd = exec('php -r "readfile(\'https://getcomposer.org/installer\');" | php' + self_install_options, {
            async: false,
            silent: true
        });

        if (self_install_cmd.code !== 0) {
            stream.emit('error', new PluginError('gulp-composer', self_install_cmd.output));
        }
        log_exec(self_install_cmd.output);

        if (ls(self_install_path)[0]) {
            log(colors.inverse(colors.magenta(" Successfully downloaded!                                                  ")));
            self_install_alert();
            return self_install_path;
        }

        log(colors.inverse(colors.red("Failed to download. All options have been exhausted.")));
        log(colors.inverse(colors.red("Installation instructions: ")) + colors.inverse(colors.underline(colors.blue("https://getcomposer.org/doc/00-intro.md"))));

        return '';
    }());
    delete opts.bin; // avoid sending bin parameter

    if (!bin) {
        stream.emit('error', new PluginError('gulp-composer', "Composer executable does not exist. " + (self_install ? "Self-install was unsuccessful. Please install before continuing." : "Please install or enable the self-install option before continuing.")));
    }

	// fix self install command
	if(self_install) {
        bin = 'php ' + bin;
    }

    // build the command array
    commandToRun = [bin, cmd, build_arguments(opts)].join(' ');
    log(colors.red(commandToRun));
    log();
    log(colors.inverse(colors.cyan(" Executing composer...                                                     ")));

    if (async) {
        exec(commandToRun, {
            silent: true
        }, handle_exec);
    } else {
        execReturn = exec(commandToRun, {
            silent: true,
            async: false
        });
        if(typeof execReturn.output === 'undefined') execReturn.output = execReturn.stderr;
        handle_exec(execReturn.code, execReturn.output);
    }

    return stream;
};
