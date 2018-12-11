import { EntityAdapter, EntityState, IdSelector, Update } from '@ngrx/entity/src/models';
import { groupByExtended } from '../../../val-modules/common/common.utils';

export function deleteChildrenByParentId<T, S extends EntityState<T>>(childAdapter: EntityAdapter<T>, childState: S, parentIds: number[], parentSelector: IdSelector<T>) : S {
  const parentSet = new Set(parentIds);
  const childrenToRemove = Object.values(childState.entities).reduce((a, e) => parentSet.has(parentSelector(e) as number) ? [...a, childAdapter.selectId(e)] : a, []);
  if (childrenToRemove.length === 0) return childState;
  if (childrenToRemove.length === 1) return childAdapter.removeOne(childrenToRemove[0], childState);
  return childAdapter.removeMany(childrenToRemove, childState);
}

export function deleteChildIds<T, K extends keyof T, S extends EntityState<T>>(parentAdapter: EntityAdapter<T>, parentState: S, childKeys: number[], childName: K) : S {
  const updates: Update<T>[] = [];
  const childSet = new Set(childKeys);
  const parentIds: number[] = parentState.ids as number[];
  parentIds.forEach(id => {
    const children = parentState.entities[id][childName];
    if (Array.isArray(children) && children.filter(c => childSet.has(c)).length > 0) {
      const currentUpdate: any = {};
      currentUpdate[childName] = children.filter(cid => !childSet.has(cid));
      updates.push({ id, changes: currentUpdate });
    }
  });
  if (updates.length === 0) return parentState;
  if (updates.length === 1) return parentAdapter.updateOne(updates[0], parentState);
  return parentAdapter.updateMany(updates, parentState);
}

export function clearChildIds<T, K extends keyof T, S extends EntityState<T>>(parentAdapter: EntityAdapter<T>, parentState: S, childName: K) : S {
  const updates: Update<T>[] = [];
  const parentIds: number[] = parentState.ids as number[];
  for (const id of parentIds) {
    const entity = parentState.entities[id];
    const children = entity[childName];
    if (Array.isArray(children) && children.length > 0) {
      const currentUpdate: any = {};
      currentUpdate[childName] = [];
      updates.push({ id , changes: currentUpdate });
    }
  }
  if (updates.length === 0) return parentState;
  if (updates.length === 1) return parentAdapter.updateOne(updates[0], parentState);
  return parentAdapter.updateMany(updates, parentState);
}

export function addChildIds<T, K extends keyof T, S extends EntityState<T>, C>(parentAdapter: EntityAdapter<T>, parentState: S, children: C[], childName: K, parentSelector: IdSelector<C>) : S {
  const updates: Update<T>[] = [];
  const parentIds: number[] = parentState.ids as number[];
  const groupedChildren = groupByExtended(children, c => parentSelector(c));
  parentIds.forEach(id => {
    if (groupedChildren.has(id)) {
      const currentParent = parentState.entities[id];
      const currentExistingChildren = currentParent[childName];
      if (Array.isArray(currentExistingChildren)) {
        const allChildren = new Set(currentExistingChildren);
        groupedChildren.get(id).forEach(ck => allChildren.add(ck));
        const currentUpdate: any = {};
        currentUpdate[childName] = Array.from(allChildren);
        updates.push({ id, changes: currentUpdate });
      }
    }
  });
  if (updates.length === 0) return parentState;
  if (updates.length === 1) return parentAdapter.updateOne(updates[0], parentState);
  return parentAdapter.updateMany(updates, parentState);
}
