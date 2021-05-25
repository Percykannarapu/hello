import { Dictionary } from '@ngrx/entity';
import { groupBy, isNil, isNotNil, mapArrayToEntity } from '@val/common';

export interface DynamicVariable {
  geocode: string;                   // must have a geocode
  [name: string] : string | number;  // may have additional properties
}

export function mergeVariables(entities: Dictionary<DynamicVariable>, varsToMerge: DynamicVariable[]) : DynamicVariable[] {
  const result: DynamicVariable[] = [];
  groupBy(varsToMerge, 'geocode').forEach((currentVars, geocode) => {
    const mergedVars: DynamicVariable = Object.assign({}, ...currentVars);
    const newKeys = Object.keys(mergedVars);
    const existingVars = entities[geocode];
    if (isNotNil(existingVars)) {
      const oldKeys = new Set(Object.keys(existingVars));
      if (!newKeys.every(k => oldKeys.has(k))) result.push(mergedVars);
    } else {
      // new geocode - data needs adding
      result.push(mergedVars);
    }
  });
  return result;
}

export function mergeVariablesToEntity(entities: Dictionary<DynamicVariable>, varsToMerge: DynamicVariable[]) : Dictionary<DynamicVariable> {
  const newEntities: Dictionary<DynamicVariable> = { };
  groupBy(varsToMerge, 'geocode').forEach((currentVars, geocode) => {
    const mergedVars: DynamicVariable = Object.assign({}, ...currentVars);
    const existingVars = entities[geocode];
    if (isNil(existingVars)) {
      newEntities[geocode] = {
        ...mergedVars
      };
    } else {
      newEntities[geocode] = {
        ...existingVars,
        ...mergedVars
      };
    }
  });
  return {
    ...entities,
    ...newEntities
  };
}
