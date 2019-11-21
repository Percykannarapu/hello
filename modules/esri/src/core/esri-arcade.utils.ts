export function createGeoArcade(geocodes: Record<string, boolean>, selectedResult: string, unselectedResult: string, nullResult: string = null) : string {
  const arcadeDataValue: Record<string, string> = {};
  const nullEncoded = nullResult == null ? 'null' : `'${nullResult}'`;
  Object.entries(geocodes).forEach(([k, v]) => arcadeDataValue[k] = v ? selectedResult : unselectedResult);
  const arcade = `var geos = ${JSON.stringify(arcadeDataValue)};
                  return DefaultValue(geos[$feature.geocode], ${nullEncoded});`;
  return arcade;
}

export function createDataArcade(data: Record<string, number | string>, nullResult: string = null, featureName: string = 'geocode') : string {
  const nullEncoded = nullResult == null ? 'null' : `'${nullResult}'`;
  const arcade = `var data = ${JSON.stringify(data)};
                  if(hasKey(data, $feature.${featureName})) {
                      return data[$feature.${featureName}];
                  }
                  return ${nullEncoded};`;
  return arcade;
}
