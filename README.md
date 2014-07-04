# gulp-composer
> Install composer files.

## Install

## Examples

```js
composer = require('gulp-composer');

gulp.task('composer', function () {
	composer({ cwd: './php-stuff', bin: 'composer' });
});
```

### Options
#### options.cwd
Type: `String`

This is the working directory, normally where the composer.json is located (default to current).

#### options.bin
Type: `String`
Default value: `composer`

This is where the composer binary is located. Also possible to add things like "php /somewhere/composer".
