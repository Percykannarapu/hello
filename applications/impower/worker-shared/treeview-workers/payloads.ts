import { ValassisTreeNode } from '../data-model/custom/treeview';

export interface TreeViewResponse<T = any> {
  rootId: number;
  nodes: ValassisTreeNode<T>[];
}

export interface TreeviewPayload {
  fetchHeaders: { Authorization: string };
  forceRefresh: boolean;
  searchTerm: string;
  rootId: number;
  includeFolder: boolean;
  initPayload: boolean;
}
