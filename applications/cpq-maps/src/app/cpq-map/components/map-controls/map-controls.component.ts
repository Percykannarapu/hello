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
  @Output() 
  onPanelChange = new EventEmitter<'small' | 'large' | 'none'>();
  public panelSize: 'small' | 'large' | 'none' = 'small';

  public distrQtyEnabled: boolean = false;
  

  constructor(private store$: Store<LocalState>) { }

  ngOnInit() {
  }

  public onDistryQtyChange(event: any) {
    this.store$.dispatch(new SetIsDistrQtyEnabled({ isDistrQtyEnabled: event }));
  }

  public updatePanelSize(event: any ) {
    this.onPanelChange.emit(event);
  }

}
