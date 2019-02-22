import { Component, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { LocalState, localSelectors } from '../../state';
import { tap } from 'rxjs/operators';
import { RfpUiEditDetailState } from '../../state/rfpUiEditDetail/rfp-ui-edit-detail.reducer';

@Component({
  selector: 'additional-toolbar-group',
  templateUrl: './additional-toolbar-group.component.html',
  styleUrls: ['./additional-toolbar-group.component.css']
})
export class AdditionalToolbarGroupComponent implements OnInit {

  public totalDistribution: string = '0';
  public totalInvestment: string = '$0';

  constructor(private store$: Store<LocalState>) { }

  ngOnInit() {
    this.store$.pipe(
      select(localSelectors.getRfpUiEditDetails)
    ).subscribe(state => {
      this.calcMetrics(state);
    });
  }

  private calcMetrics(state: RfpUiEditDetailState) {
    let totalDistribution: number = 0;
    let totalInvestment: number = 0;
    for (const id of state.ids) {
      if (!state.entities[id].isSelected) continue;
      totalDistribution += state.entities[id].distribution;
      totalInvestment += state.entities[id].investment;
    }
    this.totalDistribution = totalDistribution.toLocaleString();
    totalInvestment = Number(totalInvestment.toFixed(2));
    this.totalInvestment = `$${totalInvestment.toLocaleString()}`;
  }
}
