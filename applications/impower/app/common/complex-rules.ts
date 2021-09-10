import { ImpProject } from '../val-modules/targeting/models/ImpProject';

export function geoPassesFilter(geoAttributes: Record<string, any>, currentProject: ImpProject) : boolean {
  const includeValassis = currentProject.isIncludeValassis;
  const includeAnne = currentProject.isIncludeAnne;
  const includeSolo = currentProject.isIncludeSolo;
  const includePob = !currentProject.isExcludePob;
  let result: boolean = true;
  switch (geoAttributes['owner_group_primary']) {
    case 'VALASSIS':
      result = includeValassis;
      break;
    case 'ANNE':
      result = includeAnne;
      break;
  }
  if (geoAttributes['cov_frequency'] === 'Solo') {
    result &&= includeSolo;
  }
  if (geoAttributes['pob'] === 'B') {
    result &&= includePob;
  }
  return result;
}
