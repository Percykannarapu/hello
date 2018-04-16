export interface UniversalCoordinates {
  x: number;
  y: number;
}

export interface GeoCoordinates {
  xCoord: number;
  yCoord: number;
}
export function isGeoCoordinates(c: AllCoordinates) : c is GeoCoordinates {
  return c != null && c.hasOwnProperty('xCoord') && c.hasOwnProperty('yCoord');
}

interface LocationCoordinates {
  xcoord: number;
  ycoord: number;
}
export function isLocationCoordinates(c: AllCoordinates) : c is LocationCoordinates {
  return c != null && c.hasOwnProperty('xcoord') && c.hasOwnProperty('ycoord');
}

interface RequestCoordinates {
  latitude: number;
  longitude: number;
}
export function isRequestCoordinates(c: AllCoordinates) : c is RequestCoordinates {
  return c != null && c.hasOwnProperty('latitude') && c.hasOwnProperty('longitude');
}

interface ResponseCoordinates {
  Latitude: number;
  Longitude: number;
}
export function isResponseCoordinates(c: AllCoordinates) : c is ResponseCoordinates {
  return c != null && c.hasOwnProperty('Latitude') && c.hasOwnProperty('Longitude');
}

export type AllCoordinates = GeoCoordinates | LocationCoordinates | RequestCoordinates | ResponseCoordinates;

