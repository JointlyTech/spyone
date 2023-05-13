#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import { downloadRepo, getData } from './utils.mjs';
import { buildHtml } from './buildHtml.mjs';
import http from 'http';
import { exec } from 'child_process';
import os from 'os';
import net from 'net';

// First argument passed via CLI is the url of a github repo
const repoUrl = process.argv[2];

// Second argument passed via CLI is the number of days to consider
const daysAmount = process.argv[3];

// Third argument passed via CLI is the name of the branch to consider
const branchName = process.argv[4] || 'main';

// Fourth argument passed via CLI to choose the output format
const outputFormat = process.argv[5] || 'json';

const tmpDir = path.join(os.tmpdir(), 'tmp-spyone');

const resultsDir = path.join(os.tmpdir(), 'results');

if (!repoUrl || !daysAmount) {
  console.error('Usage: npx @jointly/spyone <repo-url> <commit-count>');
  process.exit(1);
}

// Drop folder if exists
if (fs.existsSync(tmpDir)) {
  fs.rmdirSync(tmpDir, { recursive: true });
}

// Create the tmp directory
fs.mkdirSync(tmpDir);

// Download the repo
console.log('Downloading repo...');
await downloadRepo(repoUrl, tmpDir, branchName);

// Get the data
console.log('Getting data...');
let data = await getData(tmpDir, daysAmount);

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
  .replace('.git', '')}-${daysAmount}-${branchName}.json`;
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

const server = http.createServer(function (req, res) {
  fs.readFile(resultsFilePath, function (err, data) {
    if (err) throw err;

    // build html page
    if (outputFormat === 'html') {
      const html = buildHtml(data);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(html);
      res.end();
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write(data);
    res.end();
  });
});

server.listen(9666, function () {
  console.log('Server running at http://localhost:9666/');
  console.log('Ctrl+c to exit');
  // open the URL in the default browser
  exec('open http://localhost:9666/');
});
