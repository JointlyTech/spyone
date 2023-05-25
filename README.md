_spyone_ is a tool that generates a JSON heatmap of any Git repository's commits showing most edited files.  
It comes from the italian word _spione_, which means _spy_.

Please, keep in mind this project is not perfect. It was made to analyze our most edited files to create some sort of `heatmap` of the technical debt of our internal projects.

## What does it do?

This script downloads any Git repository and extracts statistics from its commits. The resulting data is then sorted by commit count, and if there is a tie, by the sum of additions and deletions in descending order. The result is opened in your default browser and you're able to save it in any location on your computer.

## Usage

To use it, run the following command:

```bash
npx @jointly/spyone
```

You will be prompted to enter the URL of the repository you want to analyze, the number of days to consider when extracting data from commits, the name of the branch to consider and the output format.

You can provide all the parameters in the command line, like this:

```bash
npx @jointly/spyone --repo-url=<repo-url> --days-to-cover=30 --branch-name=main --output-format=json
```

and you don't need to provide any input.

You will be able to save the resulting heatmap in any location on your computer just with --save flag:

```bash
npx @jointly/spyone --repo-url=<repo-url> --days-to-cover=30 --branch-name=main --output-format=json --save
```

### Parameters

- `repo-url`: the URL of the GitHub repository to extract statistics from. This can be either an https or ssh URL.
- `days-to-cover`: the number of days before today to consider when extracting data from commits. We suggest 30 for highly updated projects and 90 days for common day-to-day work projects.
- `branch-name` (optional): the name of the branch to consider. Defaults to `main`.
- `output-format` (optional): Accepts {html|json}. Defaults to `json`.
- `save` (optional): If provided, the resulting heatmap will be saved in a file in the current directory or in the directory specified inside the `save` parameter.
