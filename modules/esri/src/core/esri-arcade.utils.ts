import { isEmpty } from '@val/common';

export function createGeoArcade(geocodes: Record<string, boolean>, selectedResult: string, unselectedResult: string, nullResult: string = null) : string {
  const arcadeDataValue: Record<string, string> = {};
  const nullEncoded = nullResult == null ? 'null' : `'${nullResult}'`;
  Object.entries(geocodes).forEach(([k, v]) => arcadeDataValue[k] = v ? selectedResult : unselectedResult);
  const stringifiedData = JSON.stringify(arcadeDataValue);
  if (isEmpty(stringifiedData) || stringifiedData === '{}') return null;
  return `var geos = ${stringifiedData}; return DefaultValue(geos[$feature.geocode], ${nullEncoded});`;
}

export function createDataArcade(data: Record<string, number | string>, nullResult: string = null, featureName: string = 'geocode') : string {
  const nullEncoded = nullResult == null ? 'null' : `'${nullResult}'`;
  const stringifiedData = JSON.stringify(data);
  if (isEmpty(stringifiedData)  || stringifiedData === '{}') return null;
  return `var data = ${stringifiedData}; if(hasKey(data, $feature.${featureName})) { return data[$feature.${featureName}]; } return ${nullEncoded};`;
}

export function createTextArcade(data: Record<string, number | string>, sortedUniqueValues: string[]) : string {
  const valueIndexMap: Record<string, string> = {};
  const newDataMap: Record<string, string> = {};
  sortedUniqueValues.forEach((sv, i) => valueIndexMap[sv] = `${i}`);
  Object.keys(data).forEach(key => newDataMap[key] = valueIndexMap[data[key]]);
  return createDataArcade(newDataMap);
}
