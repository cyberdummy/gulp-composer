# gulp-composer
> Install composer packages from within gulp, even without composer itself installed on the system.

## Install

    npm i gulp-composer --save-dev

## Requirements

 - PHP (obviously)
   
   > PHP 5.3.2 or above (at least 5.3.4 recommended to avoid potential bugs)
   > 
   > <cite>https://github.com/composer/composer#requirements</cite>

## Recommended
Part of the magic of `gulp-composer` is that having `composer` [installed on the system][install-composer] is *not required*!  However, it is still recommended as it will increase performance of the task.
 - By default, `gulp-composer` will search for composer in `{working-dir}/composer.phar`.  If it's not found, it will attempt to use the globally installed `composer` command.
 - If `composer(.phar)` is still not found on the system, it will attempt to download it to the system temp directory. Future builds will check the system temp directory so it doesn't download it too often.

## Usage

```js
composer = require('gulp-composer');
composer([ command, ] [ options ]);
```

## Parameters

| Parameter                       | Default       | Description                                                                           |
|:------------------------------- |:------------- |:------------------------------------------------------------------------------------- |
| command <br><sup>*String*</sup> | install       | The composer command to execute. See `composer --help` for list of available commands |
| options <br><sup>*Object*</sup> | see [options] | All options for `gulp-composer` and native `composer`                                 |

#### Options

| Option                                | Default | Description                                                                                         | Passed to composer |
|:------------------------------------- |:------- |:--------------------------------------------------------------------------------------------------- |:------------------ |
| bin          <br><sup>*String*</sup>  | auto    | Path to the composer binary. E.g. `composer`, `/usr/bin/composer.phar`, or `php /path/to/composer`. | *No*               |
| self-install <br><sup>*Boolean*</sup> | true    | Set to `false` to disable self-install.                                                             | *No*               |
| async        <br><sup>*Boolean*</sup> | true    | By default, the `composer` bin will load asynchronously. Use `false` to run it synchronously.       | *No*               |
| ansi         <br><sup>*Boolean*</sup> | true    | The default for this parameter is automatically passed `composer` to enable logging in color.       | *Yes*              |
| working-dir  <br><sup>*String*</sup>  | [cwd]   | The path with which to run composer against (normally where the composer.json is located).          | *Yes*              |
| ...                                   | *mixed* | Any other arguments will be passed through to composer                                              | *Yes*              |


## Examples
Most basic setup:
```js
var composer = require("gulp-composer");

gulp.task("composer", function () {
	composer();
});
```

Most basic setup with self-install disabled:
```js
var composer = require("gulp-composer");

gulp.task("composer", function () {
	composer({ "self-install": false });
});
```

Adding a few options:
```js
var composer = require("gulp-composer");

gulp.task("composer", function () {
	composer({
		"working-dir": "./php-stuff",
		bin: "composer"
	});
});
```
A more complex setup:
```js
var composer = require("gulp-composer"),
	gutils = require("gulp-utilities");

// ...

composer("init", { "no-interaction": true });
composer('require "codeception/codeception:*"', {});

if (gutils.env.production) {
	composer({
		"bin":          "/build/share/composer.phar",
		"no-ansi":      true,
		"self-install": false,
	});
} else {
	//default install
	composer();
}

composer("dumpautoload", {optimize: true});
```

## Contributors

+ Tom Westcott <tom.westcott@gmail.com>
+ Nathan J. Brauer <nathan@marketera.com>
+ Joseph Richardson <jrichardson@zingermans.com>

[install-composer]: https://getcomposer.org/doc/00-intro.md
[cwd]:              https://nodejs.org/api/process.html#process_process_cwd
[options]:          #options