import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';

export function extractUniqueAttributeValues(data: Array<ImpGeofootprintLocation> | ReadonlyArray<ImpGeofootprintLocation>, featureAttributeName: string) : string[] {
  const dedupedResults = new Set<string>();
  data.forEach(loc => {
    const directField = loc[featureAttributeName];
    const attribute = loc.impGeofootprintLocAttribs.filter(a => a.attributeCode === featureAttributeName)[0];
    if (directField != null) {
      dedupedResults.add(directField);
    } else if (attribute != null) {
      dedupedResults.add(attribute.attributeValue);
    }
  });
  const result = Array.from(dedupedResults);
  result.sort();
  return result;
}
