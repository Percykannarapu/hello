import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { Store } from '@ngrx/store';
import { FullState } from '../../state';
import { filter } from 'rxjs/operators';
import { SetActiveMediaPlanId, SetGroupId } from '../../state/shared/shared.actions';
import { ClearMediaPlanGroups } from '../../state/mediaPlanGroup/media-plan-group.actions';

@Component({
  selector: 'val-dev-tools',
  templateUrl: './dev-tools.component.html',
  styleUrls: ['./dev-tools.component.css']
})
export class DevToolsComponent implements OnInit {

  mediaPlanIds: Array<SelectItem> = [];
  loading: boolean = false;
  groupId = null;

  constructor(private store$: Store<FullState>,
    private cd: ChangeDetectorRef) { }

  ngOnInit() {

    this.store$.select(state => state.mediaPlanGroup).pipe(
      filter(state => state.ids.length > 0)
    ).subscribe(state => {
      if (state.ids.length > 1) {
        console.warn('Multiple media plan groups loaded, this is not supported');
      } else {
        const newIds: Array<SelectItem> = [];
        for (const id of state.entities[state.ids[0]].mediaPlans) {
          newIds.push({ label: id.toString(), value: id });
        }
        this.mediaPlanIds = [...newIds];
        this.cd.markForCheck();
      }
    });

    this.store$.select(state => state.shared).subscribe(state => {
      this.loading = state.entitiesLoading;
      this.groupId = state.groupId;
      this.cd.markForCheck();
    });

  }

  public onGroupIdChange(value: string) {
    this.store$.dispatch(new ClearMediaPlanGroups);
    this.store$.dispatch(new SetGroupId(Number(value)));
  }

  public setActiveMediaPlan(event: any) {
    this.store$.dispatch(new SetActiveMediaPlanId({ mediaPlanId: Number(event.value) }));
  }

}
