import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { EsriMapService } from '../../services/esri-map.service';

@Component({
  selector: 'val-esri-invalid-overlay',
  templateUrl: './esri-invalid-overlay.component.html',
  styleUrls: ['./esri-invalid-overlay.component.scss']
})
export class EsriInvalidOverlayComponent implements OnInit {

  public isInvalid$: Observable<boolean>;

  constructor(private mapService: EsriMapService) { }

  public ngOnInit() : void {
    this.isInvalid$ = this.mapService.contextLost$.asObservable();
  }

  public recover() : void {
    this.mapService.attachMap().pipe(take(1)).subscribe();
  }
}
