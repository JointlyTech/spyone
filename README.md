_spyone_ is a tool that generates a JSON heatmap of any Git repository's commits showing most edited files.  
It comes from the italian word _spione_, which means _spy_.

Please, keep in mind this project is not perfect. It was made to analyze our most edited files to create some sort of `heatmap` of the technical debt of our internal projects, so some manual actions are requested. This should be easily portable into an `npx` command and probably will in the future.

## What does it do?

This script downloads any Git repository and extracts statistics from its commits. The resulting data is then sorted by commit count, and if there is a tie, by the sum of additions and deletions in descending order. The result is saved in a folder called `results/` with a self-explanatory name (`yyyy-m-dd-hh-mm-{repo-slug}-{days-to-cover}-{branch-name}.json`).

## Usage
To use it, run the following command:

```bash
git clone git@github.com:JointlyTech/spyone.git && cd spyone && npm install
```

Then, run the following command to generate a heatmap:

```bash
node index.mjs <repo-url> <days-to-cover> <branch-name>
```

The result can be opened in a browser or a simple editor.

### Parameters
- `repo-url`: the URL of the GitHub repository to extract statistics from. This can be either an https or ssh URL.
- `days-to-cover`: the number of days before today to consider when extracting data from commits. We suggest 30 for highly updated projects and 90 days for common day-to-day work projects.
- `branch-name` (optional): the name of the branch to consider. Defaults to `main`.

