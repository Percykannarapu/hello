import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { toUniversalCoordinates } from '../app.utils';
import { EsriApi } from '../esri/core/esri-api.service';
import { EsriUtils } from '../esri/core/esri-utils';

export class LocationQuadTree {

  private quadrants: LocationQuadTree[] = [];
  private height: number = null;
  private width: number = null;

  constructor(private locations: ImpGeofootprintLocation[], private extent?: __esri.Extent) {
    if (extent == null) {
      const locationPoints: number[][] = toUniversalCoordinates(locations).map(uc => [uc.x, uc.y]);
      const multiPoint = new EsriApi.Multipoint({ points: locationPoints });
      this.extent = multiPoint.extent.clone();
    }
  }

  partition(maxChunkSize: number, maxQuadDimension?: number) : ImpGeofootprintLocation[][] {
    if (this.needsToPartition(maxChunkSize, maxQuadDimension)) {
      this.subdivide();
      const result: ImpGeofootprintLocation[][] = [];
      this.quadrants.forEach(q => {
        result.push(...q.partition(maxChunkSize, maxQuadDimension));
      });
      return result;
    } else {
      return [this.locations];
    }
  }

  private needsToPartition(maxChunkSize: number, maxQuadDimension?: number) : boolean {
    if (this.locations.length < 2) return false;
    if (this.locations.length > maxChunkSize) return true;
    if (maxQuadDimension == null) return false;
    this.calculateDistances();
    return this.height > maxQuadDimension || this.width > maxQuadDimension;
  }

  private calculateDistances() : void {
    const { xmax, xmin, ymax, ymin } = this.extent;
    this.height = EsriUtils.getDistance(xmax, ymax, xmin, ymax);
    this.width = EsriUtils.getDistance(xmax, ymax, xmax, ymin);
  }

  private subdivide() : void {
    const center = this.extent.center;
    const q0 = new EsriApi.Extent({ xmax: this.extent.xmax, xmin: center.x, ymax: this.extent.ymax, ymin: center.y });
    const q1 = new EsriApi.Extent({ xmax: center.x, xmin: this.extent.xmin, ymax: center.y, ymin: this.extent.ymin });
    const q2 = new EsriApi.Extent({ xmax: center.x, xmin: this.extent.xmin, ymax: this.extent.ymax, ymin: center.y });
    const q3 = new EsriApi.Extent({ xmax: this.extent.xmax, xmin: center.x, ymax: center.y, ymin: this.extent.ymin });
    const l0 = [];
    const l1 = [];
    const l2 = [];
    const l3 = [];
    this.locations.forEach(loc => {
      const pt = new EsriApi.Point({ x: loc.xcoord, y: loc.ycoord });
      if (q0.contains(pt)) {
        l0.push(loc);
      } else if (q1.contains(pt)) {
        l1.push(loc);
      } else if (q2.contains(pt)) {
        l2.push(loc);
      } else if (q3.contains(pt)) {
        l3.push(loc);
      } else {
        console.error('Could not partition properly', JSON.stringify(this));
        throw new Error('Location could not be allocated to quadrant during partition');
      }
    });
    this.quadrants.push(new LocationQuadTree(l0, q0));
    this.quadrants.push(new LocationQuadTree(l1, q1));
    this.quadrants.push(new LocationQuadTree(l2, q2));
    this.quadrants.push(new LocationQuadTree(l3, q3));
    this.locations = [];
  }
}
