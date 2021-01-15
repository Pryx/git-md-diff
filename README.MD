# Markdown diff tool
Diff tool for Docusaurus flavored markdown using node and git. This repository contains code for my master's thesis.

## Quickstart

Make sure your system has folowing packages installed:

`bash` `nodejs` `git` `npm`

If you have them installed then you just need to run `npm install` in both frontend and backend folders you should be good to go.

Starting the backend and frontend parts is as easy as running `npm start`. You should be able to clone a repository from the frontend, otherwise you can put folder with the cloned repository into the `backend/repositories` folder.


## Additional commands
To lint the project manually run:  npm run lint
You can also fix linting problems with:  npm run lint -- --fix

## Additional info
This repository uses forked markdown-diff version [Pryx/markdown-diff](https://github.com/Pryx/markdown-diff) which tries to solve some issues with the original version. 
