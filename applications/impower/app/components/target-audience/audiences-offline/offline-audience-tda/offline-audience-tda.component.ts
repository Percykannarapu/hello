import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { TreeNode } from 'primeng/api';
import { OfflineAudienceResponse } from '../../../../../worker-shared/data-model/custom/treeview';
import { WorkerFactory } from '../../../../common/worker-factory';
import { createOfflineAudienceInstance } from '../../../../models/audience-factories';
import { LocalAppState } from '../../../../state/app.interfaces';

@Component({
  selector: 'val-offline-audience-tda',
  templateUrl: './offline-audience-tda.component.html'
})
export class OfflineAudienceTdaComponent {

  @Input() reservedAudienceIds: Set<number> = new Set<number>();
  public tdaBroker = WorkerFactory.createOfflineTreeviewWorker();
  public selectedAudiences$ = this.store$.select(fromAudienceSelectors.getTdaAudiences);

  public createAudience = (node: TreeNode<OfflineAudienceResponse>) => createOfflineAudienceInstance(node.data.fielddescr, `${node.data.pk}`, node.data.fieldconte);
  public getPk = (node: TreeNode<OfflineAudienceResponse>) => node.data.pk;

  constructor(private store$: Store<LocalAppState>) {}
}
