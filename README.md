_spyone_ is a tool that generates a JSON heatmap of any Git repository's commits.  
It comes from the italian word _spione_, which means _spy_.

This script downloads any Git repository and extracts statistics from its commits. The resulting data is then sorted by commit count, and if there is a tie, by the sum of additions and deletions in descending order. The result is saved in a folder called `results/` with a self-explanatory name.

## Usage
To use this code, run the following command:

```bash
git clone git@github.com:JointlyTech/spyone.git && cd spyone && npm install
```

Then, run the following command to generate a heatmap:

```bash
node index.mjs <repo-url> <days-to-cover> <branch-name>
```

The result will be a heatmap in the form of a JSON file, which can be opened in a browser.

### Parameters
- `repo-url`: the URL of the GitHub repository to extract statistics from. This can be either an https or ssh URL.
- `days-to-cover`: the number of days to consider when extracting data from commits.
- `branch-name` (optional): the name of the branch to consider. Defaults to `main`.

