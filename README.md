Crawler CLI
===========

Prerequisites
-------------

- NodeJS (version >= 12)
- Yarn

Install
-------

To install the dependencies, run the following command:

```bash
yarn
```

To install the app as global CLI run the following command:

```bash
$ yarn global add $PWD
```

Usage
-----

```console
$ crawler --help

Usage: crawler [options] [urls...]

Options:
  -V, --version          output the version number
  -o, --output <output>  output directory
  -h, --help             output usage information
```

Example:

```bash
$ crawler --output _output https://example.com
```
