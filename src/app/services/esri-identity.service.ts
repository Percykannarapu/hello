import { Injectable } from '@angular/core';
import { EsriLoaderWrapperService } from './esri-loader-wrapper.service';

@Injectable()
export class EsriIdentityService {

  constructor() { }

  public async authenticate() {
    console.log("Fired authenticate() in EsriIdentityService");
    var loader = EsriLoaderWrapperService.esriLoader;
    var [OAuthInfo, identityManager, ServerInfo, Portal, PortalQueryParams] = await loader.loadModules([
      "esri/identity/OAuthInfo",
      "esri/identity/IdentityManager",
      "esri/identity/ServerInfo",
      "esri/portal/Portal",
      "esri/portal/PortalQueryParams"
    ]);
    var oauthInfo: __esri.OAuthInfo = new OAuthInfo({
      appId: "VEK4VwkLC342LuqE",
      "portalUrl": "https://valvcshad001vm.val.vlss.local/portal",
      authNamespace: "portal_oauth_inline",
      popup: false
    });
    var serverInfoProps: __esri.ServerInfoProperties = {
      currentVersion: 10.5,
      server: "https://valvcshad001vm.val.vlss.local/portal",
      shortLivedTokenValidity: 120,
      tokenServiceUrl: "https://valvcshad001vm.val.vlss.local/portal/sharing/rest/generateToken"
    }
    var serverInfo: __esri.ServerInfo = new ServerInfo(serverInfoProps);
    //identityManager.generateToken(serverInfo, {"username": "admin", "password": "admin123"});
    console.log("registering OAuth++++");
    //identityManager.registerOAuthInfos([oauthInfo]);
    //identityManager.registerServers(serverInfo);
    
    //window.open('https://valvcshad001vm.val.vlss.local/portal/sharing/oauth2/authorize?client_id=VEK4VwkLC342LuqE&response_type=token&state=%7B%22portalUrl%22%3A%22https%3A%2F%2Fvalvcshad001vm.val.vlss.local%2Fportal%22%7D&expiration=20160&redirect_uri=http%3A%2F%2Flocalhost%3A4200%2F', 'oauth', 'height=400,width=600,menubar=no,location=yes,resizable=yes,scrollbars=yes,status=yes');
    
 
    //identityManager.oAuthSignIn("https://valvcshad001vm.val.vlss.local/portal", null, oauthInfo, null);
    
    
    
    //identityManager.checkSignInStatus(oauthInfo.portalUrl + "/sharing");
    identityManager.getCredential(oauthInfo.portalUrl + "/sharing").then(response => {
      console.log("Received token: " + response.token);
      console.log("creating portal object");
      var portal: __esri.Portal = new Portal();
      portal.url = "https://valvcshad001vm.val.vlss.local/portal";
      console.log("setting authMode");
      portal.authMode = "immediate";
      console.log("running load");
      portal.load().then(f => {
        console.log("setting up query params");
        const queryParams: __esri.PortalQueryParams = new PortalQueryParams();
        queryParams.query = "owner:" + portal.user.username;
        queryParams.sortField = "numViews";
        queryParams.sortOrder = "desc";
        queryParams.num = 20;
        console.log("executing query");
        portal.queryItems(queryParams).then(result => {
          console.log("Portal Query Result: " + JSON.stringify(result.results, null, 4));
        });
      });
    });
    
    
  }

  
}
