import { arrayDedupe, CommonSort, groupByExtended, isConvertibleToNumber, isEmpty, isNil, mapBy, mapByExtended, toNullOrNumber } from '@val/common';
import Dexie from 'dexie';
import { PrimeIcons } from 'primeng/api';
import { mapTo } from 'rxjs/operators';
import { WorkerResponse, WorkerStatus } from '../common/core-interfaces';
import { serverEnv } from '../../environments/server-urls';
import { OnlineAudienceDefinition, ValassisTreeNode } from '../data-model/custom/treeview';
import { OnlineQuery } from './dexie/online-query';
import { InMarketSchema, InterestSchema, PixelSchema, VLHSchema } from './dexie/schemas';
import { timestampIsExpired, treeNodeSortBuilder } from './dexie/utils';
import { TreeviewPayload, TreeViewResponse } from './payloads';
import { TreeviewState } from './treeview-helpers';

let pixelStateInstance: OnlineTreeviewState;
let vlhStateInstance: OnlineTreeviewState;
let inMarketStateInstance: OnlineTreeviewState;
let interestStateInstance: OnlineTreeviewState;

export async function requestPixelTreeNodes(payload: TreeviewPayload) : Promise<WorkerResponse<TreeViewResponse>> {
  const url = 'v1/targeting/base/impdigcategory/search?q=impdigcategory&source=pixel&isActive=1';
  if (isNil(pixelStateInstance)) {
    const schema = new PixelSchema();
    pixelStateInstance = new OnlineTreeviewState(schema, url, false, null, pixelLeafBuilder);
  }
  return await pixelStateInstance.getNodes(payload);
}

export async function requestVlhTreeNodes(payload: TreeviewPayload) : Promise<WorkerResponse<TreeViewResponse>> {
  const url = 'v1/targeting/base/impdigcategory/search?q=impdigcategory&source=vlh&isActive=1';
  if (isNil(vlhStateInstance)) {
    const schema = new VLHSchema();
    vlhStateInstance = new OnlineTreeviewState(schema, url, false, vlhLeafFilter);
  }
  return await vlhStateInstance.getNodes(payload);
}

export async function requestInMarketTreeNodes(payload: TreeviewPayload) : Promise<WorkerResponse<TreeViewResponse>> {
  const url = 'v1/targeting/base/impdigcategory/search?q=impdigcategory&source=in_market&isActive=1';
  if (isNil(inMarketStateInstance)) {
    const schema = new InMarketSchema();
    inMarketStateInstance = new OnlineTreeviewState(schema, url, true);
  }
  return await inMarketStateInstance.getNodes(payload);
}

export async function requestInterestTreeNodes(payload: TreeviewPayload) : Promise<WorkerResponse<TreeViewResponse>> {
  const url = 'v1/targeting/base/impdigcategory/search?q=impdigcategory&source=interest&isActive=1';
  if (isNil(interestStateInstance)) {
    const schema = new InterestSchema();
    interestStateInstance = new OnlineTreeviewState(schema, url, true);
  }
  return await interestStateInstance.getNodes(payload);
}

function vlhLeafFilter(audience: OnlineAudienceDefinition) : boolean {
  return !audience.categoryName.match('-canada$') && !audience.categoryName.match('-uk$') && !audience.categoryName.match('_canada$') && !audience.categoryName.match('_uk$');
}

function defaultLeafBuilder(audience: OnlineAudienceDefinition) : ValassisTreeNode {
  return {
    label: audience.categoryName,
    data: audience,
    icon: PrimeIcons.FILE,
    leaf: true,
    key: `${audience.digCategoryId}`
  };
}

function pixelLeafBuilder(audience: OnlineAudienceDefinition) : ValassisTreeNode<OnlineAudienceDefinition> {
  const UnSelectableLimit = 1000;
  const selectable: boolean = (isConvertibleToNumber(audience.taxonomy) && Number(audience.taxonomy) > UnSelectableLimit);
  return {
    label: `${audience.categoryName}&nbsp;&nbsp;&nbsp;${audience.categoryDescr}&nbsp;&nbsp;&nbsp;${toNullOrNumber(audience.taxonomy)?.toLocaleString() ?? 'n/a'}`,
    data: audience,
    icon: selectable ? PrimeIcons.FILE : PrimeIcons.LOCK,
    selectable: selectable,
    leaf: true,
    key: `${audience.digCategoryId}`,
    escaped: true
  };
}

function defaultFolderBuilder(audience: OnlineAudienceDefinition) : ValassisTreeNode<OnlineAudienceDefinition> {
  return {
    label: audience.categoryName,
    data: audience,
    expandedIcon: PrimeIcons.FOLDER_OPEN,
    collapsedIcon: PrimeIcons.FOLDER,
    leaf: false,
    selectable: false,
    key: `${audience.categoryId}` // needs to be different than the leaf builder key
  };
}

export class OnlineTreeviewState implements TreeviewState<TreeviewPayload, TreeViewResponse> {

  private queryEngine: OnlineQuery;

  constructor(schema: Dexie, resourceUrl: string, dataIsNested: boolean,
              private additionalLeafFilter?: (a: OnlineAudienceDefinition) => boolean,
              private leafBuilder: (a: OnlineAudienceDefinition) => ValassisTreeNode<OnlineAudienceDefinition> = defaultLeafBuilder) {
    const fullUrl = serverEnv.middlewareBase + resourceUrl;
    this.queryEngine = new OnlineQuery(schema, fullUrl, dataIsNested, additionalLeafFilter);
  }

  private async setup(forceRefresh: boolean, initPayload: boolean, fetchHeaders: { Authorization: string }) {
    if (forceRefresh || (initPayload && timestampIsExpired(this.queryEngine.currentTimeStamp, 12))) {
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
    await this.setup(payload.forceRefresh, payload.initPayload, payload.fetchHeaders);
    if (isNil(payload.rootId) && isEmpty(payload.searchTerm)) {
      const audienceData = await this.queryEngine.getAudiencesByParentId(null);
      result.value.nodes = this.convertAudiences(audienceData);
    } else if (isEmpty(payload.searchTerm)) {
      const lazyChildren = await this.queryEngine.getAudiencesByParentId(payload.rootId);
      result.value.nodes = this.convertAudiences(lazyChildren);
    } else {
      const searchChildren = await this.queryEngine.searchAudiences(payload.searchTerm, payload.includeFolder, payload.rootId);
      const dedupedChildren = arrayDedupe(searchChildren, def => def.digCategoryId);
      const allParentIds = new Set(dedupedChildren.flatMap(child => child.familyIds));
      const allParents = await this.queryEngine.getAudiencesByFamily(Array.from(allParentIds));
      result.value.nodes = this.buildSearchResults(allParents, dedupedChildren, payload.rootId);
    }
    return result;
  }

  private convertAudiences(audiences: OnlineAudienceDefinition[], folderOnlyAudiences: OnlineAudienceDefinition[] = []) : ValassisTreeNode<OnlineAudienceDefinition>[] {
    const leafNodes = audiences.reduce((a, c) => {
      if (c.digCategoryId > 0) {
        a.push(this.leafBuilder(c));
      }
      return a;
    }, [] as ValassisTreeNode<OnlineAudienceDefinition>[]);
    const existingFolderIds = new Set<number>();
    const folderNodes = audiences.reduce((a, c) => {
      if (c.hasChildren) {
        existingFolderIds.add(c.digCategoryId);
        a.push(defaultFolderBuilder(c));
      }
      return a;
    }, [] as ValassisTreeNode[]);
    const folderOnlyNodes = folderOnlyAudiences.reduce((a, c) => {
      if (c.hasChildren && !existingFolderIds.has(c.digCategoryId)) a.push(defaultFolderBuilder(c));
      return a;
    }, [] as ValassisTreeNode[]);
    const allNodes = leafNodes.concat(folderNodes).concat(folderOnlyNodes);
    allNodes.sort(treeNodeSortBuilder(n => n.label, CommonSort.GenericString));
    return allNodes;
  }

  private buildSearchResults(parents: OnlineAudienceDefinition[], leaves: OnlineAudienceDefinition[], rootId: number) : ValassisTreeNode<OnlineAudienceDefinition>[] {
    const usableRootId = rootId ?? -1;
    const parentNodes = mapByExtended(parents, p => p.digCategoryId, p => defaultFolderBuilder(p));
    const leafNodes = groupByExtended(leaves.filter(l => l.digCategoryId > 0), l => l.parentId, l => this.leafBuilder(l));
    const rootNodes: ValassisTreeNode<OnlineAudienceDefinition>[] = leafNodes.get(usableRootId) ?? [];
    const nodesWithAttachments = new Set<ValassisTreeNode<OnlineAudienceDefinition>>();
    parentNodes.forEach((parent, digCategoryId) => {
      if (leafNodes.has(digCategoryId)) {
        parent.children = (parent.children ?? []).concat(leafNodes.get(digCategoryId));
        nodesWithAttachments.add(parent);
      }
      if (parent.data.parentId === usableRootId) {
        rootNodes.push(parent);
      } else {
        if (parentNodes.has(parent.data.parentId)) {
          const grandparent = parentNodes.get(parent.data.parentId);
          grandparent.children = (grandparent.children ?? []).concat(parent);
          nodesWithAttachments.add(grandparent);
        }
      }
    });
    nodesWithAttachments.forEach(node => {
      if (!isEmpty(node.children)) {
        if (node.children.length < 5) {
          node.expanded = true;
          node.children.sort(treeNodeSortBuilder(n => n.label, CommonSort.GenericString));
        } else {
          node.children = [];
        }
      }
    });
    rootNodes.sort(treeNodeSortBuilder(n => n.label, CommonSort.GenericString));
    return rootNodes;
  }
}
