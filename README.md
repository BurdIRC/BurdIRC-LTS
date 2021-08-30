# Burd IRC

This is the offical LTS release of the Burd IRC client. This is an IRC client that uses Node.JS as a backend and your web browser as the frontend.

## LTS

This client is in LTS, and will be supported until December 25th, 2025. This date may be changed to a later point, but not to an earlier one. 

## Installation

Make sure you have node.js and NPM installed. Next clone this repository, then in the main BurdIRC directory run

```bash
npm install
```

## Usage

After you have installed the required modules run the follow to start the server

```bash
node index.js
```
Once the server is running you can open the app two ways, either by using chrome's (or chromium's) --app switch (**Recommended**)

```bash
chrome --app=http://localhost:1987/
```
Or by running the app as a webpage, by visiting the URL in your browser

```bash
http://localhost:1987/
```

## License

This app and all code under it, including modules, are released under MIT (or equivalent) license.