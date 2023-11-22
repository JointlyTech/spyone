#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import { downloadRepo, getData, isValidRepoUrl } from './utils.mjs';
import http from 'http';
import { exec } from 'child_process';
import os from 'os';
import net from 'net';
import Enquirer from 'enquirer';
import Parse from 'args-parser';
import { help } from './help.mjs';
const { prompt } = Enquirer;

const args = Parse(process.argv);
const isInteractive = Object.keys(args).length === 0;

if (args.help) {
  console.log(help);
  process.exit(0);
}

// Define possible arguments with his default values, both for interactive and cli mode
const cliArguments = {
  repoUrl: {
    type: 'input',
    default: '',
    message: 'Enter the url of the repo to analyze',
    required: true
  },
  days: {
    type: 'input',
    default: 30,
    message: 'Enter the number of days to consider',
    required: true
  },
  branch: {
    type: 'input',
    default: 'main',
    message: 'Enter the name of the branch to consider',
    required: true
  },
  output: {
    type: 'select',
    default: 'json',
    message: 'Choose the output format',
    choices: ['json', 'html'],
    required: true
  },
  save: {
    type: null,
    default: false,
    required: false
  }
};

let DEFAULT_PORT = 9666;

// Transform to compatible format for enquirer
const promptParams = Object.keys(cliArguments)
  .filter((name) => cliArguments[name].type !== null)
  .map((name) => {
    return {
      name,
      ...cliArguments[name]
    };
  });

// Destructure the arguments, if interactive mode is enabled, prompt the user for the values of the arguments, otherwise use the provided arguments. If no arguments are provided, use the default values
const {
  repoUrl = cliArguments.repoUrl.default,
  days = cliArguments.days.default,
  branch = cliArguments.branch.default,
  output = cliArguments.output.default,
  save = cliArguments.save.default
} = isInteractive ? await prompt(promptParams) : args;

// If no valid repo url is provided, exit with help
if (!isValidRepoUrl(repoUrl)) {
  console.error('❌ Invalid repo url');
  console.error(help);
  process.exit(1);
}

let savePath = 'results';
if (save === true) {
  savePath = '.';
}

const tmpDir = path.join(os.tmpdir(), 'tmp-spyone');

// if no save location is provided, save to tmp dir, otherwise save to the provided location starting from the current directory
const resultsDir =
  save === false
    ? path.join(os.tmpdir(), 'results')
    : path.join(process.cwd(), savePath);

// Drop folder if exists
if (fs.existsSync(tmpDir)) {
  fs.rmdirSync(tmpDir, { recursive: true });
}

// Create the tmp directory
fs.mkdirSync(tmpDir);

// Download the repo
console.log('Downloading repo...');
await downloadRepo(repoUrl, tmpDir, branch);

// Get the data
console.log('Getting data...');
let data = await getData(tmpDir, days);

// Sort data map by commitsCount, if equal sort by additions + deletions
data = new Map(
  [...data.entries()].sort((a, b) => {
    return (
      b[1].commitCount - a[1].commitCount ||
      b[1].additions + b[1].deletions - (a[1].additions + a[1].deletions)
    );
  })
);

// Create results directory if it doesn't exist
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir);
}

// Write the data to a file, consider data is a map
const today = new Date();
const resultsFileName = `${today.getFullYear()}-${
  today.getMonth() + 1
}-${today.getDate()}-${today.getHours()}-${today.getMinutes()}-${repoUrl
  .split('/')
  .pop()
  .replace('.git', '')}-${days}-${branch}.json`;
const resultsFilePath = path.join(resultsDir, resultsFileName);
const fileContent = JSON.stringify([...data.entries()]);
fs.writeFileSync(resultsFilePath, fileContent);

// Drop tmp folder
if (fs.existsSync(tmpDir)) {
  fs.rmdirSync(tmpDir, { recursive: true });
}

const stats = [...data.entries()].reduce((prev, curr) => {
  // @todo: Improve this check
  if (Number.isNaN(prev + curr[1].additions + curr[1].deletions)) return prev;
  return prev + curr[1].additions + curr[1].deletions;
}, 0);

console.log(`Results saved to ${resultsFilePath}, total stats: ${stats}`);

// exit here if save location is provided
if (save !== false) {
  process.exit(0);
}

const server = http.createServer(function (req, res) {
  fs.readFile(resultsFilePath, function (err, data) {
    if (err) throw err;

    if (!isInteractive && !cliArguments.output.choices.includes(output)) {
      const errorMessage =
        '❌ Output format not supported (' +
        cliArguments.output.choices.join(' or ') +
        ')';
      console.log(errorMessage);
      res.writeHead(500);
      res.write(errorMessage);
      res.end();
      process.exit(1);
    }

    // build html page
    if (output === 'html') {
      res.writeHead(200, { 'Content-Type': 'text/html' });

      fs.readFile('./index.html', null, function (error, html) {
        if (error) {
          res.writeHead(404);
          res.write('Whoops! File not found!');
        } else {
          res.write(`<script>const fullData = ${data}</script>`);
          res.write(html);
        }
        res.end();
      });
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write(data);
    res.end();
  });
});

// Check if the port is available
const tester = net
  .createServer()
  .once('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      handleListenError(error);
    }
  })
  .once('listening', () => {
    tester
      .once('close', () => {
        startServer();
      })
      .close();
  })
  .listen(DEFAULT_PORT);

// Start the server
function startServer() {
  server.listen(DEFAULT_PORT, () => {
    console.log(`🚀 Server running at http://localhost:${DEFAULT_PORT}/`);
    console.log('🛑 Ctrl+c to exit');
    // open the URL in the default browser
    exec(`open http://localhost:${DEFAULT_PORT}/`);
  });
}

// Handle listen error
function handleListenError(error) {
  if (error.code === 'EADDRINUSE') {
    console.warn(
      `❌ Port ${DEFAULT_PORT} is already in use. Trying another port...`
    );
    setTimeout(() => {
      server.close();
      DEFAULT_PORT++;
      startServer();
    }, 1000);
  } else {
    console.error(error);
  }
}
