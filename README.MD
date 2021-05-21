# Git-md-diff
 A feature complete tool for managing documentations written in Markdown or MDX and generated via a specialized tool - e.g. Docusaurus. Written in JavaScript using NodeJS for backend and React for frontend. This repository contains code for my master's thesis.

![edit_page](https://user-images.githubusercontent.com/5222912/119131124-5f515500-ba39-11eb-8916-8d0e7938dae1.png)


## Quickstart

Make sure you have `docker` and `docker-compose` installed. Then run `docker-compose up` in the root folder of this repository and everything should start up automatically.

Before doing that, please check that you have the correct configuration present. For the backend and render services, the file `config.prod.json` should be present in the config folder. You can use the `config.template.json` to create yours. You will first need to setup a new Gitlab application (to use in the gitlab appid and secret fields) and obtain working SMTP server and credentials for everything to work properly.

The frontend should be ready to use, if you need make any changes, the `runtime-configuration.js` contains the config.

### What will be running?
There are several ports utilized by the docker-compose configuration. These ports include:

* **http://localhost:3000** The render service
* **http://localhost:4000** The backend service
* **http://localhost:5000** The frontend service
* **http://localhost:5050** A pgadmin instance 
* **http://localhost:7000** The api documentation

## Additional commands
To lint the project manually run:  npm run lint
You can also fix linting problems with:  npm run lint -- --fix

## Additional info
This repository uses forked markdown-diff version [Pryx/markdown-diff](https://github.com/Pryx/markdown-diff) which tries to solve some issues with the original library. 
