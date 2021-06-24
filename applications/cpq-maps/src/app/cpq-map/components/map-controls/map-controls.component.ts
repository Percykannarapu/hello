import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { LocalState } from '../../state/index';
import { GridSize } from '../../state/app.interfaces';
import { withLatestFrom, filter } from 'rxjs/operators';
import { localSelectors } from '../../state/app.selectors';
import { SetGridSize, SetIsDistributionVisible } from '../../state/map-ui/map-ui.actions';
import { SetPrefsDirty } from '../../state/shared/shared.actions';

@Component({
  selector: 'cpq-map-controls',
  templateUrl: './map-controls.component.html',
  styleUrls: ['./map-controls.component.css']
})
export class MapControlsComponent implements OnInit {

  @Output() onGridSizeChange = new EventEmitter<GridSize>();

  public gridSize: GridSize = 'small';
  public distributionQtyEnabled: boolean = false;

  constructor(private store$: Store<LocalState>) { }

  ngOnInit() {
    this.store$.select(localSelectors.getAppReady).pipe(
      withLatestFrom(this.store$.select(localSelectors.getMapUIState)),
      filter(([ready]) => ready)
    ).subscribe( ([,  shared]) => {
      this.distributionQtyEnabled = shared.isDistrQtyEnabled;
      this.gridSize = shared.gridSize;
      this.onGridSizeChange.emit(this.gridSize);
    });
  }

  public onDistributionQtyChange(event: any) {
    this.store$.dispatch(new SetIsDistributionVisible({ isVisible: event }));
    this.store$.dispatch(new SetPrefsDirty());
  }

  public updateGridSize(event: any ) {
    this.onGridSizeChange.emit(event);
    this.store$.dispatch(new SetGridSize({ gridSize: event }));
    this.store$.dispatch(new SetPrefsDirty());
  }

}
