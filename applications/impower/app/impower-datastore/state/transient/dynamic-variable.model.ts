import { Dictionary } from '@ngrx/entity';
import { groupBy, isNil, isNotNil, mapArrayToEntity } from '@val/common';

export interface DynamicVariable {
  geocode: string;                   // must have a geocode
  [name: string] : string | number;  // may have additional properties
}

export function mergeVariables(entities: Dictionary<DynamicVariable>, varsToMerge: DynamicVariable[]) : DynamicVariable[] {
  const result: DynamicVariable[] = [];
  groupBy(varsToMerge, 'geocode').forEach((currentVars, geocode) => {
    const mergedNewVars: DynamicVariable = Object.assign({}, ...currentVars);
    const existingVars = entities[geocode];
    if (isNotNil(existingVars)) {
      const fullyMerged: DynamicVariable = Object.assign({}, existingVars, mergedNewVars);
      result.push(fullyMerged);
    } else {
      // new geocode - data needs adding
      result.push(mergedNewVars);
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
