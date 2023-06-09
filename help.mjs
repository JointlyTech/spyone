export const help = `
Usage: npx @jointly/spyone [options]

If no options are provided, the tool will run in interactive mode.

Options:

    The repo url to analyze
    --repoUrl=repourl.com

    The number of days to consider
    --days=30

    The name of the branch to consider
    --branch=main

    The output format
    --output=json

    The location to save the result. Put "." to save in the current directory.
    If the save argument is provided, the server will not start.
    --save=your-folder
`;
