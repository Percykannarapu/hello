import { Component, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { LocalState, localSelectors } from '../../state';
import { tap } from 'rxjs/operators';
import { SetIsDistrQtyEnabled } from '../../state/shared/shared.actions';

@Component({
  selector: 'val-map-controls',
  templateUrl: './map-controls.component.html',
  styleUrls: ['./map-controls.component.css']
})
export class MapControlsComponent implements OnInit {
  public distrQtyEnabled: boolean = false;

  constructor(private store$: Store<LocalState>) { }

  ngOnInit() {
  }

  public onDistryQtyChange(event: any) {
    this.store$.dispatch(new SetIsDistrQtyEnabled({ isDistrQtyEnabled: event }));
  }

}
