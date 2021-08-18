import { defaultEsriAppSettings, EsriQuadTree } from '@val/esri';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';

export function quadPartitionLocations(locations: ImpGeofootprintLocation[], analysisLevel: string) : ImpGeofootprintLocation[][] {
  const quadTree = new EsriQuadTree(locations);
  let maxDimension = 250;
  let chunkSize = defaultEsriAppSettings.maxPointsPerBufferQuery;
  switch ((analysisLevel || '').toLowerCase()) {
    case 'atz':
      maxDimension = 175;
      chunkSize = defaultEsriAppSettings.maxPointsPerBufferQuery / 2;
      break;
    case 'digital atz':
      maxDimension = 100;
      chunkSize = defaultEsriAppSettings.maxPointsPerBufferQuery / 5;
      break;
    case 'pcr':
      maxDimension = 100;
      chunkSize = defaultEsriAppSettings.maxPointsPerBufferQuery / 10;
      break;
  }
  const result = quadTree.partition(chunkSize, maxDimension);
  return result.filter(chunk => chunk && chunk.length > 0);
}

export function quadPartitionGeos(geos: { geocode: string, xcoord: number, ycoord: number }[]) : { geocode: string, xcoord: number, ycoord: number }[][] {
  const quadTree = new EsriQuadTree(geos);
  const result = quadTree.partition(defaultEsriAppSettings.maxPointsPerQuery);
  return result.filter(chunk => chunk && chunk.length > 0);
}
