import { chunkArray, toUniversalCoordinates } from '@val/common';
import { EsriUtils } from './esri-utils';

class SimpleExtent {

  center: { x: number, y: number };

  constructor(public xmax: number, public xmin: number, public ymax: number, public ymin: number) {
    this.center = {
      x: ((this.xmax - this.xmin) / 2) + this.xmin,
      y: ((this.ymax - this.ymin) / 2) + this.ymin
    };
  }

  contains(x: number, y: number) : boolean {
    return this.xmin <= x && this.xmax >= x && this.ymin <= y && this.ymax >= y;
  }
}

type NonArray<T> = T extends (infer R)[] ? R : T;
export class EsriQuadTree<T extends NonArray<Parameters<typeof toUniversalCoordinates>[0]>> {

  private quadrants: EsriQuadTree<T>[] = [];
  private height: number = null;
  private width: number = null;

  constructor(private locations: T[], private readonly extent?: SimpleExtent, private readonly depth = 0) {
    if (locations.length === 0) return;
    if (extent == null) {
      let xmin = Number.POSITIVE_INFINITY;
      let xmax = Number.NEGATIVE_INFINITY;
      let ymin = Number.POSITIVE_INFINITY;
      let ymax = Number.NEGATIVE_INFINITY;
      locations.forEach(loc => {
        const uc = toUniversalCoordinates(loc);
        xmin = Math.min(uc.x, xmin);
        xmax = Math.max(uc.x, xmax);
        ymin = Math.min(uc.y, ymin);
        ymax = Math.max(uc.y, ymax);
      });
      this.extent = new SimpleExtent(xmax, xmin, ymax, ymin);
    }
  }

  partition(maxChunkSize: number, maxQuadDimension?: number) : T[][] {
    if (this.depth >= 9 && this.locations.length <= maxChunkSize * 3) {
      return chunkArray(this.locations, maxChunkSize);
    } else if (this.needsToPartition(maxChunkSize, maxQuadDimension)) {
      this.subdivide();
      let result: T[][] = [];
      this.quadrants.forEach(q => {
        result = result.concat(q.partition(maxChunkSize, maxQuadDimension));
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
    const q0 = new SimpleExtent(this.extent.xmax,     this.extent.center.x, this.extent.ymax,     this.extent.center.y);
    const q1 = new SimpleExtent(this.extent.center.x, this.extent.xmin,     this.extent.center.y, this.extent.ymin);
    const q2 = new SimpleExtent(this.extent.center.x, this.extent.xmin,     this.extent.ymax,     this.extent.center.y);
    const q3 = new SimpleExtent(this.extent.xmax,     this.extent.center.x, this.extent.center.y, this.extent.ymin);
    const l0 = [];
    const l1 = [];
    const l2 = [];
    const l3 = [];
    this.locations.forEach(loc => {
      const uc = toUniversalCoordinates(loc);
      if (q0.contains(uc.x, uc.y)) {
        l0.push(loc);
      } else if (q1.contains(uc.x, uc.y)) {
        l1.push(loc);
      } else if (q2.contains(uc.x, uc.y)) {
        l2.push(loc);
      } else if (q3.contains(uc.x, uc.y)) {
        l3.push(loc);
      } else {
        console.error('Could not partition properly', JSON.stringify(this));
        throw new Error('Location could not be allocated to quadrant during partition');
      }
    });
    if (l0.length > 0) this.quadrants.push(new EsriQuadTree(l0, q0, this.depth + 1));
    if (l1.length > 0) this.quadrants.push(new EsriQuadTree(l1, q1, this.depth + 1));
    if (l2.length > 0) this.quadrants.push(new EsriQuadTree(l2, q2, this.depth + 1));
    if (l3.length > 0) this.quadrants.push(new EsriQuadTree(l3, q3, this.depth + 1));
    this.locations = [];
  }
}
