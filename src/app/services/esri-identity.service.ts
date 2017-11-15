import { Injectable } from '@angular/core';
import { EsriLoaderWrapperService } from './esri-loader-wrapper.service';

@Injectable()
export class EsriIdentityService {

  constructor() { }

  public async authenticate() {
    console.log("Fired authenticate() in EsriIdentityService");
    const loader = EsriLoaderWrapperService.esriLoader;
    const [OAuthInfo, IdentityManager] = await loader.loadModules([
      "esri/identity/OAuthInfo",
      "esri/identity/IdentityManager"
    ]);
    var oauthInfo: __esri.OAuthInfo = new OAuthInfo({
      appId: "VEK4VwkLC342LuqE",
      portalUrl: "https://valvcshad001vm.val.vlss.local/portal",
      authNamespace: "portal_oauth_inline",
      popup: true
    });
  }
}
