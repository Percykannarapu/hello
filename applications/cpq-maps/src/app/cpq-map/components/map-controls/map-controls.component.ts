import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { LocalState } from '../../state';
import { SetIsDistrQtyEnabled } from '../../state/shared/shared.actions';

@Component({
  selector: 'val-map-controls',
  templateUrl: './map-controls.component.html',
  styleUrls: ['./map-controls.component.css']
})
export class MapControlsComponent implements OnInit {

  @Output() onGridSizeChange = new EventEmitter<'small' | 'large' | 'none'>();

  public gridSize: 'small' | 'large' | 'none' = 'small';

  public distributionQtyEnabled: boolean = false;

  constructor(private store$: Store<LocalState>) { }

  ngOnInit() {
  }

  public onDistributionQtyChange(event: any) {
    this.store$.dispatch(new SetIsDistrQtyEnabled({ isDistrQtyEnabled: event }));
  }

  public updateGridSize(event: any ) {
    this.onGridSizeChange.emit(event);
  }

}
