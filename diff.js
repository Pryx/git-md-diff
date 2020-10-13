#!/usr/bin/env node
import { markdownDiff } from 'markdown-diff';
import yargs from 'yargs';

var argv = yargs
  .scriptName("diff.js")
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
    },
    (argv) => {
      diff(argv);
    }
  )
  .command(
    'compile',
    'Compiles the markdown files into HTML format, creates new file in the same folder',
    {
      f: {
        demand: true,
        string: true
      },
      m: {
        demand: true,
        string: true
      }
    },
    (argv) => {
      compile(argv);
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


function compile(argv){
  var fs = require('fs')
  console.log(`Compiling ${argv.original} ${argv.modified}`);
  var original = fs.readFileSync(argv.original, 'utf8');
  var modified = fs.readFileSync(argv.modified, 'utf8');
  original = removeDocusaurusInfo(original)
  modified = removeDocusaurusInfo(modified)
  original = imagePlaceholders(original)
  modified = imagePlaceholders(modified)

  var remark = require('remark')
  var markdown = require('remark-parse')
  var html = require('remark-html')

  var removeBlocks = require('./removeBlocks.js');

  remark()
    .use(removeBlocks)
    .use(html)
    .process(original, function(err, file) {
      if (err) {
        return console.log(err);
      }

      let html = String(file)

      fs.writeFile(argv.original+".html", html, function (err,data) {
        if (err) {
          return console.log(err);
        }
      });
    });
    
    remark()
    .use(removeBlocks)
    .use(html).process(modified, function(err, file) {
      if (err) {
        return console.log(err);
      }

      let html = String(file)

      fs.writeFile(argv.modified+".html", html, function (err,data) {
        if (err) {
          return console.log(err);
        }
      });
    })

}


function diff(argv){
  var fs = require('fs')

  var output = argv.o || "out.html";

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

      let html = String(file)

      html = html.replace(/<del>/g, `<del style="color:#a33;background:#ffeaea;text-decoration:line-through;">`); 
      html = html.replace(/<ins>/g, `<ins style="color:darkgreen;background:#eaffea;">`); 

      fs.writeFile(output, html, function (err,data) {
        if (err) {
          return console.log(err);
        }
      });
    })
}

function imagePlaceholders(markdown){
  markdown = markdown.replace(/src={useBaseUrl.*}/g, `src="http://via.placeholder.com/200?text=IMAGE"`);
  return markdown;
}

function removeDocusaurusInfo(markdown){
  markdown = markdown.replace(/---.*title: ([^\n]*).*---/s, `# Title: $1`);
  markdown = markdown.replace(/\s*import.*docusaurus.*;/, ``);

  return markdown;
}