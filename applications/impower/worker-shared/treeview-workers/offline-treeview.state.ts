import { groupByExtended, isEmpty, isNil, toNullOrNumber } from '@val/common';
import { PrimeIcons } from 'primeng/api';
import { WorkerResponse, WorkerStatus } from '../common/core-interfaces';
import { OfflineAudienceResponse, OfflineCategoryResponse, ValassisTreeNode } from '../data-model/custom/treeview';
import { OfflineQuery } from './dexie/offline-query';
import { timestampIsExpired } from './dexie/utils';
import { TreeviewPayload, TreeViewResponse } from './payloads';
import { TreeviewState } from './treeview-helpers';

let stateInstance: OfflineTreeviewState;

export async function requestTreeNodes(payload: TreeviewPayload) : Promise<WorkerResponse<TreeViewResponse>> {
  if (isNil(stateInstance)) stateInstance = new OfflineTreeviewState();
  return await stateInstance.getNodes(payload);
}

export class OfflineTreeviewState implements TreeviewState<TreeviewPayload, TreeViewResponse> {

  private queryEngine: OfflineQuery;

  constructor() {
    this.queryEngine = new OfflineQuery();
  }

  private async setup(forceRefresh: boolean, fetchHeaders: { Authorization: string }) {
    if (forceRefresh || timestampIsExpired(this.queryEngine.currentTimeStamp, 12)) {
      await this.queryEngine.initialize(forceRefresh, fetchHeaders).toPromise();
    }
  }

  public async getNodes(payload: TreeviewPayload) : Promise<WorkerResponse<TreeViewResponse>> {
    const result = {
      status: WorkerStatus.Running,
      message: '',
      rowsProcessed: 0,
      value: {
        rootId: payload.rootId,
        nodes: []
      }
    };
    if (payload.initPayload) {
      await this.setup(payload.forceRefresh, payload.fetchHeaders);
    }
    if (isNil(payload.rootId) && isEmpty(payload.searchTerm)) {
      const categories = await this.queryEngine.getAllCategories();
      result.value.nodes = this.convertCategories(categories);
    } else if (isEmpty(payload.searchTerm)) {
      const lazyChildren = await this.queryEngine.filterAudiencesByCategory(payload.rootId);
      result.value.nodes = this.convertAudiences(lazyChildren);
    } else {
      const searchChildren = await this.queryEngine.searchAudiences(payload.searchTerm, payload.includeFolder, payload.rootId);
      if (isNil(payload.rootId)) {
        const resultGroups = groupByExtended(searchChildren, a => a.parentPk);
        const searchParents = await this.queryEngine.filterCategories(Array.from(resultGroups.keys()));
        result.value.nodes = this.buildSearchResults(searchParents, resultGroups);
      } else {
        result.value.nodes = this.convertAudiences(searchChildren);
      }
    }

    return result;
  }

  private buildSearchResults(categories: OfflineCategoryResponse[], audienceMap: Map<number, OfflineAudienceResponse[]>) : ValassisTreeNode[] {
    const result = this.convertCategories(categories);
    result.forEach(category => {
      const currentChildren = audienceMap.get(toNullOrNumber(category.key)) ?? [];
      if (currentChildren.length < 5) {
        category.expanded = true;
        category.children = this.convertAudiences(currentChildren);
      }
    });
    return result;
  }

  private convertCategories(categories: OfflineCategoryResponse[]) : ValassisTreeNode[] {
    return categories.map(category => ({
      label: category.tabledesc,
      key: `${category.pk}`,
      expandedIcon: PrimeIcons.FOLDER_OPEN,
      collapsedIcon: PrimeIcons.FOLDER,
      leaf: false,
      selectable: false,
      data: category
    }));
  }

  private convertAudiences(audiences: OfflineAudienceResponse[]) : ValassisTreeNode<OfflineAudienceResponse>[] {
    return audiences.map(audience => ({
      label: audience.fielddescr,
      key: `${audience.pk}`,
      icon: PrimeIcons.FILE,
      leaf: true,
      data: audience
    }));
  }
}
