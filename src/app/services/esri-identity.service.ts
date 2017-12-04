import { Injectable } from '@angular/core';
import { EsriLoaderWrapperService } from './esri-loader-wrapper.service';
import { Http, Headers } from '@angular/http';

interface TokenResponse {
  token: string,
  expires: number,
  ssl: boolean
}

@Injectable()
export class EsriIdentityService {

  constructor(public http: Http) { }

  public async authenticate() {
    console.log("Fired authenticate() in EsriIdentityService");
    var loader = EsriLoaderWrapperService.esriLoader;
    var [identityManager] = await loader.loadModules(["esri/identity/IdentityManager"]);
    var headers = new Headers();
    headers.append("content-type", "application/x-www-form-urlencoded")
    const url: string = "https://valvcshad001vm.val.vlss.local/portal/sharing/rest/generateToken"
    const body: string = "username=admin&password=admin123&f=json&client=referer&referer=http://vallomjbs002vm:8080";
    this.http.post(url, body, {headers: headers}).map(res => res.json() as TokenResponse).subscribe(data => {
      console.log("Got token: " + data.token);
      identityManager.registerToken({expires: data.expires, server: "https://valvcshad001vm.val.vlss.local/server/rest/services", ssl: data.ssl, token: data.token});
    });
    console.log("posted");
  }

  
}
