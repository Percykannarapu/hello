# imPower

imPower is a multichannel media planning system using modern software fueled by enhanced audience, media cost and performance data to drive increased integrated print + digital revenue.

### Technologies
imPower is based on these core technologies:

- [Angular CLI](https://angular.io/cli): Scaffolding and command line running
- [Angular](https://angular.io/api): DOM and [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) management
- [PrimeNg](https://www.primefaces.org/primeng-v11-lts/#/): UI Elements
- [Esri ArcGis JS API](https://developers.arcgis.com/javascript/latest/api-reference/): Map and other GIS needs
- [NgRx](https://ngrx.io/docs): Reactive state management
- [Dexie.js](https://dexie.org/docs/API-Reference): [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) managing and querying

### Node & NPM Versions
imPower currently requires node version 12 and npm version 6. You may check these versions from your CLI via:

`node --version` and `npm --version`

If you have Node Version manager installed, you can switch to node 12 & npm 6 via:

`nvm use 12`

### imPower scripts
imPower has added several scripts to allow for a variety of development situations.

The run scripts build the app, start the local web server, and watch the angular codebase for changes:
- `npm start` This is the default script to run while you are developing in the front end.
- `npm run local-prod` This script connects to production middleware servers. This script is generally used to debug user issues in the production app. *CAUTION: ANY PROJECT CHANGES SAVED WHILE RUNNING THIS WILL BE VISIBLE IN PRODUCTION. USE THIS SCRIPT WITH EXTREME CARE.*
- `npm run local` This script connects to locally-running middleware servers, both Karaf and Print. Generally used for development and testing of the middleware in conjunction with front end changes (i.e. different payloads). 
- `npm run local-print` This script connects to dev Karaf and local print middleware servers. Generally used when developing and testing print changes.
- `npm run local-print-prod` This script connects to production Karaf and local print middleware servers. This script is generally used to troubleshoot print problems reported by users, or to run print jobs that exceed the limits imposed by the front end app. *CAUTION: ANY PROJECT CHANGES SAVED WHILE RUNNING THIS WILL BE VISIBLE IN PRODUCTION. USE THIS SCRIPT WITH EXTREME CARE.*

The build scripts only build the app into the `/dist` folder:
- `npm run build-dev` Builds the app for deployment to the development servers. This script is usually only used by Jenkins.
- `npm run build-qa` Builds the app for deployment to the QA servers. This script is usually only used by Jenkins.
- `npm run build-prod` Builds the app for deployment to the production servers.

