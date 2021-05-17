# Community Graph Analysis: Front End

The front end is based on [Preact](https://preactjs.com/) and [Preact-CLI](https://github.com/developit/preact-cli/). Node.js is required for building the project.

### Installation

Install dependencies using:

```bash
npm install
```

In some cases, e.g. if the `package-lock.json` is missing, there will be errors because the project uses dependencies that rely on React and do not recognize _Preact_ as an alternative. The project will work without React. If dependency errors occur, they can be ignored by running:

```bash
npm install --force
```

### Running & Building the Front End

The following NPM scripts are available:

``` bash
# serve the front end with hot reloading at localhost:8080
npm run dev

# create a production build with minified assets
# (files are built into a ./build folder)
npm run build

# test the production build locally
npm run serve
```

**Note:** The front end expects the server to run at `localhost:5000`. The server URL can be changed in the `src/api/index.js` file.