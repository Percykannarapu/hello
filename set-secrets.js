/*const fs = require('fs');
const targetPath = './applications/impower/environments/environment.ts';
const profileName = process.env.npm_config_profile;

let sourcePath = '';

switch (profileName) {
  case 'dev':
    sourcePath = './applications/impower/environments/environment.dev.ts';
    break;
  case 'local-fuse':
    sourcePath = './applications/impower/environments/environment.local-fuse.ts';
    break;
  case 'prod-as-dev':
    sourcePath = './applications/impower/environments/environment.prod-as-dev.ts';
    break;
  case 'prod':
    sourcePath = './applications/impower/environments/environment.prod.ts';
    break;
  case 'qa':
    sourcePath = './applications/impower/environments/environment.qa.ts';
    break;
}

const colors = require('colors');

if (sourcePath === '')
  throw console.error(colors.red('Invalid profile'));


console.log(colors.green('Creating environment file from ' + sourcePath));

fs.copyFileSync(sourcePath, targetPath, (err) => {
  if (err) throw err;
});

console.log(colors.green('Appending ESRI secrets to config file: ' + targetPath));

require('dotenv');
const esriParams = `export const esri = {
    portalServer:  'https://vallomimpor1vm.val.vlss.local/',
    userName: '${process.env.ESRI_USERNAME}',
    password: '${process.env.ESRI_PASSWORD}'
};
`;

fs.appendFileSync(targetPath, esriParams, function (err) {
  if (err) throw err;
});*/

const fs = require('fs');
require('dotenv').config();
const targetPath = './applications/impower/environments/esri-secrets.ts';
const esriParams = `export const esri = {
  portalServer:  '${process.env.ESRI_PORTAL_SERVER}',
  userName: '${process.env.ESRI_USERNAME}',
  password: '${process.env.ESRI_PASSWORD}'
};
`;
fs.writeFileSync(targetPath, esriParams, function (err) {
  if (err) throw err;
});
