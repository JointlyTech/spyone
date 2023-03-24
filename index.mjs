import path from 'path';
import fs from 'fs';
import { downloadRepo, getData } from "./utils.mjs";

// First argument passed via CLI is the url of a github repo
const repoUrl = process.argv[2];

// Second argument passed via CLI is the number of days to consider
const daysAmount = process.argv[3];

// Third argument passed via CLI is the name of the branch to consider
const branchName = process.argv[4] || 'main';

const tmpDir = path.join(import.meta.url.replace('file://', '').replace('index.mjs', ''), 'tmp');
const resultsDir = path.join(import.meta.url.replace('file://', '').replace('index.mjs', ''), 'results');

if (!repoUrl || !daysAmount) {
  console.error('Usage: node index.mjs <repo-url> <commit-count>');
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
data = new Map([...data.entries()].sort((a, b) => {
  return b[1].commitCount - a[1].commitCount || (b[1].additions + b[1].deletions) - (a[1].additions + a[1].deletions);
}));

// Create results directory if it doesn't exist
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir);
}

// Write the data to a file, consider data is a map
const today = new Date();
const resultsFileName = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}-${today.getHours()}-${today.getMinutes()}-${repoUrl.split('/').pop().replace('.git', '')}-${daysAmount}-${branchName}.json`;
const resultsFilePath = path.join(resultsDir, resultsFileName);
const fileContent = JSON.stringify([...data.entries()]);
fs.writeFileSync(resultsFilePath, fileContent);

// Drop tmp folder
if (fs.existsSync(tmpDir)) {
  fs.rmdirSync(tmpDir, { recursive: true });
}

const stats = [...data.entries()].reduce((prev, curr) => {
  // @todo: Improve this check
  if (Number.isNaN(prev + curr[1].additions + curr[1].deletions))
    return prev;
  return prev + curr[1].additions + curr[1].deletions;
}, 0);
console.log(`Results saved to ${resultsFilePath}, total stats: ${stats}`);