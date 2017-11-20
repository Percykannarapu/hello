import { Component } from '@angular/core';
import { EsriLoaderWrapperService } from './services/esri-loader-wrapper.service';
import { EsriIdentityService } from './services/esri-identity.service';

@Component({
  providers: [EsriLoaderWrapperService, EsriIdentityService],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ESRI / Angular First Look';
  mapZoom: number = 12;

  constructor(private esriLoaderWrapperService: EsriLoaderWrapperService, private esriIdentityService: EsriIdentityService) { }
  
    ngOnInit() {
      this.esriLoaderWrapperService.loadApi();
      this.esriIdentityService.authenticate();
    }

}
