import { TreeNode } from 'primeng/api';

export function treeNodeSortBuilder<T>(sortField: (n: TreeNode) => T, levelSortAlgorithm: (a: T, b: T) => number) : (a: TreeNode, B: TreeNode) => number {
  return (a: TreeNode, b: TreeNode) => (a.leaf === b.leaf ? levelSortAlgorithm(sortField(a), sortField(b)) : a.leaf ? 1 : -1);
}

export function filterTreeNodesRecursive(term: string, nodes: TreeNode[], fieldValue: (n: TreeNode) => string, styleForHiding: string = 'val-hidden-by-search', expandCount: number = 6) : TreeNode[] {
  applyFilter(term, nodes, fieldValue, styleForHiding, expandCount);
  return nodes;
}

function applyFilter(term: string, nodes: TreeNode[], fieldValue: (n: TreeNode) => string, styleForHiding: string, expandCount: number) {
  nodes.forEach(node => {
    if (term == null || term.length === 0) {
      applyFilter(term, node.children || [], fieldValue, styleForHiding, expandCount);
      node.styleClass = null;
      node.expanded = false;
    } else {
      if (!node.leaf) {
        applyFilter(term, node.children || [], fieldValue, styleForHiding, expandCount);
        const visibleChildCount = (node.children || []).filter(n => n.styleClass == null).length;
        node.expanded = visibleChildCount < expandCount;
        node.styleClass = visibleChildCount > 0 ? null : styleForHiding;
      } else {
        const searchField = fieldValue(node);
        const searchHit = searchField.toLowerCase().includes(term.toLowerCase());
        node.styleClass = searchHit ? null : styleForHiding;
      }
    }
  });
}

export function findSingleTreeNodeRecursive<T>(term: T, nodes: TreeNode[], fieldValue: (n: TreeNode) => T) : TreeNode {
  let foundNode: TreeNode = null;
  for (let i = 0; i < nodes.length; ++i) {
    if (!nodes[i].leaf) {
      const n = findSingleTreeNodeRecursive(term, nodes[i].children || [], fieldValue);
      if (n != null) {
        foundNode = n;
        break;
      }
    } else {
      if (term === fieldValue(nodes[i])) {
        foundNode = nodes[i];
        break;
      }
    }
  }
  return foundNode;
}
