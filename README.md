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

Usage: crawler [options] [command]

Options:
  -v, --version              output the version number
  -h, --help                 output usage information

Commands:
  crawl [options] [urls...]
  help [command]
```

Example
-------

```bash
$ crawler init
$ crawler url add example.com
$ crawler fetch 10
$ crawler start
```
