# gulp-composer
> Install composer files.

## Install

    npm install --save-dev gulp-composer

## Usage

```js
composer = require('gulp-composer');
composer([ command, ] [ options ]);
```

## Parameters

### `command` - The composer command to execute

> Type: *String*

> Options: See `composer --help` for list of available commands

> Default: `install`

### `options` - All options for `gulp-composer` and native `composer`

> Type: *Object*

#### options.cwd
Type: `String`

This is the working directory, normally where the composer.json is located (default to current).

#### options.bin
Type: `String`
Default value: `composer`

This is where the composer binary is located. Also possible to add things like "php /somewhere/composer".

## Examples
Most basic setup:
```js
var composer = require('gulp-composer');

gulp.task('composer', function () {
	composer();
});
```
Adding a few options:
```js
var composer = require('gulp-composer');

gulp.task('composer', function () {
	composer({ cwd: './php-stuff', bin: 'composer' });
});
```
A more complex setup involving non-default commands:
```js
var composer = require('gulp-composer');

composer('init', {'no-interaction':true});
composer('require "codeception/codeception:*"', {});
composer(); //default install
composer('dumpautoload', {optimize: true});
```
