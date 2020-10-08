# Markdown diff tool
Diff tool for Docusaurus flavored markdown using node and git. This repository contains code for my master's thesis.

# Quickstart
## Linux
Make sure your system has folowing packages installed:

`bash` `nodejs` `git` `npm`

If you have them installed then you just need to run `npm install` in this repository and you should be good to go.

## Windows
On Windows this software should be able to run on Windows Subsystem for Linux (WSL) using the Linux quickstart guide. While testing with Ubuntu on WSL there has been only one substantial error - WSL doesn't support metadata on mounted Windows partitions. To fix that you can simply create/update `/etc/wsl.conf` file. You should add these lines:

```
[automount]
options = "metadata"
```

You might still need to run the `git config --global core.filemode false` command, although it should not be neccessary.
