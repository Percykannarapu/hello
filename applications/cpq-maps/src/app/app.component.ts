import { Component, Input, ElementRef, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { SetGroupId, SetRadius, SetAnalysisLevel } from './cpq-map/state/shared/shared.actions';
import { FullState } from './cpq-map/state';
import { SetSelectedLayer } from '@val/esri';
import { ConfigService } from './cpq-map/services/config.service';

@Component({
  selector: 'cpq-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(private elementRef: ElementRef,
    private store$: Store<FullState>,
    private configService: ConfigService) {}

  ngOnInit() {
    const groupId = Number(this.elementRef.nativeElement.getAttribute('groupId'));
    this.store$.dispatch(new SetGroupId(groupId));
    const analysisLevel: string = this.elementRef.nativeElement.getAttribute('analysisLevel') || 'atz';
    this.store$.dispatch(new SetAnalysisLevel({ analysisLevel: analysisLevel.toLowerCase() }));
    this.store$.dispatch(new SetSelectedLayer({ layerId: this.configService.layers[analysisLevel.toLowerCase()].boundaries.id }));
    const radius = Number(this.elementRef.nativeElement.getAttribute('radius'));
    this.store$.dispatch(new SetRadius({ radius: radius }));
  }

}
