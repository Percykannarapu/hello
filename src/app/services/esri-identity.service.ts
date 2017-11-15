import { Injectable } from '@angular/core';
import { EsriLoaderWrapperService } from './esri-loader-wrapper.service';

@Injectable()
export class EsriIdentityService {

  constructor() { }

  public async authenticate() {
    console.log("Fired authenticate() in EsriIdentityService");
    var loader = EsriLoaderWrapperService.esriLoader;
    var [OAuthInfo, IdentityManager, ServerInfo] = await loader.loadModules([
      "esri/identity/OAuthInfo",
      "esri/identity/IdentityManager",
      "esri/identity/ServerInfo"
    ]);
    var oauthInfo: __esri.OAuthInfo = new OAuthInfo({
      appId: "VEK4VwkLC342LuqE",
      portalUrl: "https://valvcshad001vm.val.vlss.local/portal",
      authNamespace: "portal_oauth_inline",
      popup: true
    });
    var serverInfoProps: __esri.ServerInfoProperties = {
      adminTokenServiceUrl: "https://valvcshad001vm.val.vlss.local/portal/sharing/rest/generateToken",
      currentVersion: 5.1,
      server: "https://valvcshad001vm.val.vlss.local/portal",
      shortLivedTokenValidity: 120,
      tokenServiceUrl: "https://valvcshad001vm.val.vlss.local/portal/sharing/rest/generateToken"
    }
    var serverInfo: __esri.ServerInfo = new ServerInfo(serverInfoProps);
    console.log("registering OAuth");
    IdentityManager.registerOAuthInfos([oauthInfo]);
    //IdentityManager.oAuthSignIn("https://valvcshad001vm.val.vlss.local/portal", serverInfo, oauthInfo, null);
  }
}
