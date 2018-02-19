import {Component, OnInit} from '@angular/core';
import { MapService } from '../../services/map.service';

@Component({
  selector: 'val-esri-map-tools',
  templateUrl: './esri-map-tools.component.html',
  styleUrls: ['./esri-map-tools.component.css']
})
export class EsriMapToolsComponent implements OnInit {

  constructor(public mapService: MapService) {
    console.log('Constructing esri-map-tools-component');
  }


  public ngOnInit() {
  }

}
