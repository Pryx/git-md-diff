#!/usr/bin/env node
import { markdownDiff } from 'markdown-diff';
import yargs from 'yargs';

var argv = yargs
  .scriptName("diff")
  .usage('Usage: $0 <command> [args]')
  .command(
    'run',
    'Run the diff script on provided files',
    {
      f: {
        demand: true,
        string: true
      },
      m: {
        demand: true,
        string: true
      },
      o: {
        demand: false,
        string: true
      }
    }
  )
  .help('h')
  .alias('h', 'help')
  .alias('f', 'original')
  .nargs('f', 1)
  .describe('f', 'Original file')
  .alias('o', 'output')
  .nargs('o', 1)
  .describe('o', 'Output file')
  .alias('m', 'modified')
  .nargs('m', 1)
  .describe('m', 'Modified file')
  .argv



var fs = require('fs')

var output = argv.o || "out.md";

console.log(output)

var original = fs.readFileSync(argv.original, 'utf8');
var modified = fs.readFileSync(argv.modified, 'utf8');

const res = markdownDiff(original, modified);

var unified = require('unified')
var markdown = require('remark-parse')
var html = require('remark-html')

unified()
  .use(markdown)
  .use(html)
  .process(res, function(err, file) {
    if (err) {
      return console.log(err);
    }

    fs.writeFile(output, String(file), function (err,data) {
      if (err) {
        return console.log(err);
      }
    });
  })
