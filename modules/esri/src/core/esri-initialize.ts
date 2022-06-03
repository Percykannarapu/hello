import config from '@arcgis/core/config';
import { EsriConfigOptions } from '../configuration';

export function setupEsriConfig(options: EsriConfigOptions) : void {
  config.portalUrl = options.portalUrl;
  config.request.timeout = options.request.timeout;
}

export function displayInitializationError(err: any) : void {
  const errorMsgElement = document.querySelector('#errorMsgElement');
  let message = 'Application initialization failed';
  if (err) {
    if (err.message) {
      message = message + ': ' + err.message;
    } else {
      message = message + ': ' + err;
    }
  }
  errorMsgElement.textContent = message;
}
