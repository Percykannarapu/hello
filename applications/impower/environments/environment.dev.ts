// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build -c prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `angular.json`
// in the projects->esri-angular-first-look->architect->build->configurations section.

import { LogLevels } from '@val/common';
import { LayerKeys } from '@val/esri';
import { serverEnv } from './server-urls';

export const environment = {
  production: false,
  serverBuild: true,
  logLevel: LogLevels.INFO,
  sanitizeActions: false,
  sanitizeState: false,
};

export class EnvironmentData {
  // The name of the environment
  public static environmentName = 'DEV';

  public static fuseBaseUrl = serverEnv.middlewareBase;
  public static impowerBaseUrl = 'https://impowerdev.valassis.com/';
  public static printServiceUrl = 'http://tx1dapim040131p.tx1.prod.maxpoint.mgt:9128';

  public static esri = {
    portalServer:  'https://impowerqa.valassis.com/',
    userName: process.env.ESRI_USERNAME,
    password: process.env.ESRI_PASSWORD
  };

  public static layerKeyFixup: Map<string, LayerKeys> = new Map<string, LayerKeys>([
    ['99fd67933e754a1181cc755146be21ca', LayerKeys.State],
    ['423fa5dd0d824080b4026dbce6752e02', LayerKeys.DMA],
    ['5c8d7e4a824f4aa0b254925348f2a14a', LayerKeys.DMA],
    ['4f6b219aabca46beb9f03add5f7e54d1', LayerKeys.Counties],
    ['39b51d9d498f4107bc69ac30f31ac115', LayerKeys.Counties],
    ['dba9d6282fd24e29b40445c3c05be500', LayerKeys.Counties],
    ['28ab27c41d214e7e83a4f05372c7f387', LayerKeys.Zip],
    ['47817fd990cc40e28b6bec5ff1fb7ac5', LayerKeys.Zip],
    ['1be0a79bf27b46ce82cf459fd70c1bad', LayerKeys.Zip],
    ['23a54308e914496aa24d94a9b36776a0', LayerKeys.Zip],
    ['88120ac630d746239b133296e87b8e1f', LayerKeys.Zip],
    ['fb4295cfef1743f9a8a12c1d444effeb', LayerKeys.Zip],
    ['9918dff6c1b34b139cb00bc3561ad81a', LayerKeys.ATZ],
    ['f9b657116f8c4a5a855de601f012e16e', LayerKeys.ATZ],
    ['b58a024badbc4b63bce258aceaab7f31', LayerKeys.ATZ],
    ['c0ee701ee95f4bbdbc15ded2a37ca802', LayerKeys.ATZ],
    ['fd4b078fc2424dd5a48af860dc421431', LayerKeys.ATZ],
    ['269894235d7946d19500e4bbf3ea9b09', LayerKeys.ATZ],
    ['5e81da421ebf402e98d64622f84b3603', LayerKeys.DTZ],
    ['e44e37afe10d4145b5e09d1a9027003b', LayerKeys.DTZ],
    ['a4449b3ee55442af881f6ac660ca8163', LayerKeys.DTZ],
    ['377018a24ba14afa9e02e56110b3a568', LayerKeys.DTZ],
    ['0dff970830cb4b14b58596a57e7f1518', LayerKeys.DTZ],
    ['80b9f78d11ea49d6a325375d47c946bc', LayerKeys.PCR],
    ['a4a8221c2c9b453ca84acbc8cb31df5c', LayerKeys.PCR],
    ['53482efa44914dc199f3833276ddb5a1', LayerKeys.PCR],
    ['ab655c84473748159307fe18962138d1', LayerKeys.PCR],
    ['b2b002057e714a73b7760f4a4511534a', LayerKeys.PCR],
    ['7fa52ae91fb047519a7e3e1651d91b1b', LayerKeys.Wrap],
    ['ba378a55b58647b7ba2ee2fedea1adad', LayerKeys.Wrap],
    ['12bae62392eb47aeb887b6509da557b5', LayerKeys.Wrap],
    ['f9594a876236492dab4bb667c28e18a5', LayerKeys.Wrap]
  ]);

  public static serviceUrls = {
    batchPrintService: `${EnvironmentData.fuseBaseUrl}v1/impower/print`
  };
}
