import { Component, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { FullState } from '../../state';
import { localSelectors } from '../../state/app.selectors';
import { tap, filter, withLatestFrom } from 'rxjs/operators';
import { SharedState, shadingType } from '../../state/shared/shared.reducers';
import { SelectItem } from 'primeng/api';
import { SetShadingType } from '../../state/shared/shared.actions';

@Component({
  selector: 'val-shading-config',
  templateUrl: './shading-config.component.html',
  styleUrls: ['./shading-config.component.css']
})
export class ShadingConfigComponent implements OnInit {

  public shadingOptions: Array<SelectItem> = [];
  public selectOption: string = 'Site';

  constructor(private store: Store<FullState>) { }

  ngOnInit() {
    this.shadingOptions.push({ label: 'Site', value: shadingType.SITE });
    this.shadingOptions.push({ label: 'Zip', value: shadingType.ZIP });
    this.store.pipe(
      select(localSelectors.getAppReady),
      withLatestFrom(this.store.select(localSelectors.getSharedState)),
      filter(([ready, shared]) => ready)
    ).subscribe(([ready, shared]) => this.createDropdownList(shared));
  }

  private createDropdownList(state: SharedState) {
    if (state.isWrap)
      this.shadingOptions.push({ label: 'Wrap Zone', value: shadingType.WRAP_ZONE });
    if (state.analysisLevel === 'atz')
      //this.shadingOptions.push({ label: 'ATZ Designator', value: shadingType.ATZ_DESIGNATOR }); //commented out for US9631
      this.shadingOptions.push({ label: 'ATZ Indicator', value: shadingType.ATZ_INDICATOR });
  }

  public onShadingOptionChange(event: { originalEvent: MouseEvent, value: shadingType }) {
    this.store.dispatch(new SetShadingType({ shadingType: event.value }));
  }

}
