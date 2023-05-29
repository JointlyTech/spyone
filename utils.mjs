import os from 'os';
import git from 'simple-git';

const EXCLUDED_FILES = [
  'package-lock.json',
  'package.json',
  'yarn.lock',
  'CHANGELOG.md',
  'composer.lock',
  'yarn-error.log',
  'pnpm-lock.yaml',
  ''
];

export const downloadRepo = (repoUrl, dir, branchName = 'main') => {
  return new Promise((resolve, reject) => {
    const repoName = repoUrl.split('/').pop().replace('.git', '');

    // Clone the repo in the tmp directory using simple-git
    git(dir).clone(repoUrl, dir, ['--branch', branchName], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(dir);
      }
    });
  });
};

// Check if the repo url is valid and well formatted
export const isValidRepoUrl = (repoUrl) => {
  const regex = new RegExp(
    '^https:\\/\\/github.com\\/[a-zA-Z0-9-]+\\/[a-zA-Z0-9-]+$'
  );
  return regex.test(repoUrl);
};

// Given a path to a directory, get the list of addition and deletion counts from the git history of each file
export const getData = (dir, daysAmount) => {
  return new Promise(async (resolve, reject) => {
    console.log('Getting repo history...');
    getRepoHistory(dir, daysAmount).then((repoHistory) => {
      const files = repoHistory
        .split(os.EOL)
        .map((line) => {
          return line.split('\t').pop();
        })
        .filter((file) => {
          return EXCLUDED_FILES.includes(file) === false;
        });

      const uniqueFiles = [...new Set(files)];

      const fileData = new Map();
      // Get the list of addition and deletion counts for each file
      for (const file of uniqueFiles) {
        const result = getFileHistory(repoHistory, file);
        // Get the list of addition and deletion counts
        const counts = result.split(os.EOL).map((line) => {
          if (line.length === 0) return { additions: 0, deletions: 0 };
          const [additions, deletions] = line.split('\t');
          return {
            additions: parseInt(additions),
            deletions: parseInt(deletions)
          };
        });

        // Sum the addition and deletion counts
        const total = counts.reduce(
          (prev, curr) => {
            return {
              additions: prev.additions + curr.additions,
              deletions: prev.deletions + curr.deletions
            };
          },
          { additions: 0, deletions: 0 }
        );
        fileData.set(file, {
          additions: total.additions || 0,
          deletions: total.deletions || 0,
          commitCount: files.filter((f) => f === file).length
        });
      }
      resolve(fileData);
    });
  });
};

export const getFileHistory = (repoHistory, file) => {
  const fileHistory = repoHistory
    .split(os.EOL)
    .filter((line) => {
      return line.split('\t').pop() === file;
    })
    .join(os.EOL);
  return fileHistory;
};

export const getRepoHistory = (dir, daysAmount) => {
  return new Promise((resolve, reject) => {
    git(dir).raw(
      [
        'log',
        '--pretty=format:',
        '--numstat',
        `--since="${daysAmount} days ago"`
      ],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
};
