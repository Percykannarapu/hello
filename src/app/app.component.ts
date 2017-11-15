import { Component } from '@angular/core';
import { EsriLoaderWrapperService } from './services/esri-loader-wrapper.service';

@Component({
  providers: [EsriLoaderWrapperService],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ESRI / Angular First Look';
  mapZoom: number = 12;

  constructor(private esriLoaderWrapperService: EsriLoaderWrapperService) { }
  
    ngOnInit() {
      this.esriLoaderWrapperService.loadApi();
    }

}
