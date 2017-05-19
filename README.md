# Translation Resources Transform

[![Build Status][travis-image]][travis-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Codacy Badge][codacy-image]][codacy-url]

i18n transform is a CMF developer tool that easily converts the development translation resources (in typescript) into the [gettext PO](https://www.gnu.org/software/gettext/manual/html_node/PO-Files.html) files and vice-versa.


[travis-image]: https://www.travis-ci.org/criticalmanufacturing/dev-i18n-transform.svg?branch=master
[travis-url]: https://www.travis-ci.org/criticalmanufacturing/dev-i18n-transform

[coveralls-image]: https://coveralls.io/repos/github/criticalmanufacturing/dev-i18n-transform/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/criticalmanufacturing/dev-i18n-transform?branch=master

[codacy-image]: https://api.codacy.com/project/badge/Grade/1aa4a40533a4467984416962e3c23762
[codacy-url]: https://www.codacy.com/app/criticalmanufacturing/dev-i18n-transform?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=criticalmanufacturing/dev-i18n-transform&amp;utm_campaign=Badge_Grade

## Transform TS -> PO
### Typescript
```typescript
// Get parser for TS files
let parser = ParserFactory.getParser(
    __dirname, // path to package
    [
        // these files are your ts files, relative to your package
        path.join(__dirname, "test/mocks/multilevelExample/mock.default.ts"),
        path.join(__dirname, "test/mocks/multilevelExample/mock.pt-PT.ts")
    ]
);
// Run parser and get package
let pack = parser.run();

// Get writer for "pt-PT" language
let writer = WriterFactory.getWriter(pack, "pt-PT", "po");

// Run writer and get buffer files
let buffer = writer.run();

// Write buffer (create files)
fs.writeFileSync("output/i18n.po", buffer[0].content);
```

### Gulp
```javascript
var i18n = require("cmf.dev.i18n").gulp;

gulp.task('i18n-ts-to-po', function() {
    return gulp
        .src([
            // these files are your ts files, relative to your package
            // in this example, __dirname is the package root dir
            path.join(__dirname, "test/**/*.ts"),
            "!**/*.d.ts" // remember to remove *.d.ts files
        ], { cwd: __dirname }) // very important
        .pipe(i18n({
            base: __dirname, // your package root dir
            languages: ["en-EN", "pt-PT", ...], // 
            dest: "po" // destination format, "ts" or "po"
        }))
        .pipe(gulp.dest("output")); // this will create 1 file for each language in dest folder
});
```


## Transform PO -> TS
### Typescript
```typescript
// Get parser for PO files
let parser = ParserFactory.getParser(
    __dirname, // path to package
    [
        // these files are your po files, relative to your package
        path.join(__dirname, "output/i18n.po"),
    ]
);
// Run parser and get package
let pack = parser.run();

// Get writer for "pt-PT" language
let writer = WriterFactory.getWriter(pack, "pt-PT", "ts");

// Run writer and get buffer files
let buffer = writer.run();

// Write buffer (create files)
for(let file of buffer) {
    fs.writeFileSync(path.join("output", file.file), file.content);
}
```

### Gulp
```javascript
var i18n = require("cmf.dev.i18n").gulp;

gulp.task('i18n-po-to-ts', function() {
    return gulp
        .src([
            // these files are your po files, relative to your package
            // in this example, __dirname is the package root dir
            path.join(__dirname, "output/*.po")
        ], { cwd: __dirname }) // very important
        .pipe(i18n({
            base: __dirname, // your package root dir
            languages: ["en-EN", "pt-PT", ...], // 
            dest: "ts" // destination format, "ts" or "po"
        }))
        .pipe(gulp.dest("output")); // this will create 1 file for each language in dest folder
});
```

## Additional Information

This package was developed during the [UX-FAB: Universal Experience for Advanced Fabs](http://www.criticalmanufacturing.com/en/r-d/ux-fab) project.

![Portugal2020](http://www.criticalmanufacturing.com/uploads/richtext/images/2017030610420258bd3cfa033c0.png)