import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { TreeNode } from 'primeng/api';
import { OnlineAudienceDefinition } from '../../../../../worker-shared/data-model/custom/treeview';
import { FieldContentTypeCodes } from '../../../../../worker-shared/data-model/impower.data-model.enums';
import { WorkerFactory } from '../../../../common/worker-factory';
import * as fromAudienceSelectors from '../../../../impower-datastore/state/transient/audience/audience.selectors';
import { OnlineSourceTypes } from '../../../../models/audience-enums';
import { createOnlineAudienceInstance } from '../../../../models/audience-factories';
import { LocalAppState } from '../../../../state/app.interfaces';

@Component({
  selector: 'val-online-audience-vlh',
  templateUrl: './online-audience-vlh.component.html'
})
export class OnlineAudienceVlhComponent {

  @Input() reservedAudienceIds: Set<number> = new Set<number>();
  public vlhBroker = WorkerFactory.createVlhTreeviewWorker();
  public selectedAudiences$ = this.store$.select(fromAudienceSelectors.getVlhAudiences);

  public createAudience = (node: TreeNode<OnlineAudienceDefinition>) => createOnlineAudienceInstance(node.data.categoryName, `${node.data.digCategoryId}`, FieldContentTypeCodes.Index, OnlineSourceTypes.VLH);
  public getPk = (node: TreeNode<OnlineAudienceDefinition>) => node.data.digCategoryId;

  constructor(private store$: Store<LocalAppState>) {}
}
