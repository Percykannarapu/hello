import { isNil } from '@val/common';
import { TreeNode } from 'primeng/api';

export function timestampIsExpired(timestamp: number, expirationHours: number) : boolean {
  const now = Date.now();
  return isNil(timestamp)
    || timestamp > now
    || now - timestamp > (expirationHours * 60 * 60 * 1000);
}

export function treeNodeSortBuilder<T>(sortField: (n: TreeNode) => T, levelSortAlgorithm: (a: T, b: T) => number) : (a: TreeNode, B: TreeNode) => number {
  return (a: TreeNode, b: TreeNode) => (a.leaf === b.leaf ? levelSortAlgorithm(sortField(a), sortField(b)) : a.leaf ? 1 : -1);
}
