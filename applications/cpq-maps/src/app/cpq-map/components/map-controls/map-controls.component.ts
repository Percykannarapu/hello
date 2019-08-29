import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { LocalState } from '../../state';
import { SetIsDistrQtyEnabled, SetGridSize, SetMapPreference } from '../../state/shared/shared.actions';
import { withLatestFrom, filter } from 'rxjs/operators';
import { localSelectors } from '../../state/app.selectors';
import { MapConfig } from '../header-bar/header-bar.component';

@Component({
  selector: 'val-map-controls',
  templateUrl: './map-controls.component.html',
  styleUrls: ['./map-controls.component.css']
})
export class MapControlsComponent implements OnInit {

  @Output() onGridSizeChange = new EventEmitter<'small' | 'large' | 'none'>();

  public gridSize1: string = 'small';
  public gridSize: 'small' | 'large' | 'none' = 'small';


  public distributionQtyEnabled: boolean = false;

  constructor(private store$: Store<LocalState>) { }

  ngOnInit() {
    this.store$.pipe(
      select(localSelectors.getAppReady),
      withLatestFrom(this.store$.select(localSelectors.getSharedState), this.store$.select(localSelectors.getMediaPlanPrefEntities)),
      filter(([ready]) => ready)
    ).subscribe( ([,  shared, mediaPlanPrefs]) => {
      const prefs = mediaPlanPrefs.filter(pref => pref.prefGroup === 'CPQ MAPS');
      if (prefs.length > 0){
        const mapConfig: MapConfig = JSON.parse(prefs[0].val);
        this.distributionQtyEnabled = mapConfig.showDist;
        this.gridSize = mapConfig.gridDisplay;
        this.store$.dispatch(new SetGridSize({gridSize: this.gridSize}));
        this.store$.dispatch(new SetIsDistrQtyEnabled({ isDistrQtyEnabled: this.distributionQtyEnabled }));
        this.onGridSizeChange.emit(this.gridSize);
      }
    });
  }

  public onDistributionQtyChange(event: any) {
    this.store$.dispatch(new SetIsDistrQtyEnabled({ isDistrQtyEnabled: event }));
    this.store$.dispatch(new SetMapPreference({ mapPrefChanged: false}));
  }

  public updateGridSize(event: any ) {
    this.onGridSizeChange.emit(event);
    this.store$.dispatch(new SetGridSize({gridSize: event}));
    this.store$.dispatch(new SetMapPreference({ mapPrefChanged: false}));
  }

}
