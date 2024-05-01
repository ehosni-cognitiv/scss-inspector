# SCSS Inspector

Inspects scss modules and tsx files for unused, non-existent, and duplicate scss classes.

## Description

IMPORTANT: This plugin only works if you are using typescript, react, and .scss modules imported using the following method:

`import cn from 'example-path/example-file.module.scss';`

Upon running `npx scss-inspector`, it will log warnings in the command line for the following issues:

- Unused classes: these classes exist in your .scss file but are not used in any .tsx files
- Duplicate classes: these classes are declared more than once in your .scss file
- Non-existing classes: these classes are used in your .tsx file but do not exist in your .scss file

## Authors

Evan Hosni
[@EvanHosni](https://evanhosni.com)

## License

This project is not licensed. Feel free to use it, copy it, claim it as your own, put it on your resume, etc. I won't judge.
