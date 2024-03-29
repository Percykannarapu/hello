export interface UniversalCoordinates {
  x: number;
  y: number;
}
interface GeoCoordinates {
  xCoord: number;
  yCoord: number;
}
interface LocationCoordinates {
  xcoord: number;
  ycoord: number;
}
interface RequestCoordinates {
  latitude: number;
  longitude: number;
}
interface ResponseCoordinates {
  Latitude: number;
  Longitude: number;
}
interface MediaPlanningCoordinates {
  siteLat: number;
  siteLong: number;
}

type AllCoordinates = GeoCoordinates | LocationCoordinates | RequestCoordinates | ResponseCoordinates | MediaPlanningCoordinates;

function isGeoCoordinates(c: AllCoordinates) : c is GeoCoordinates {
  return c != null && c.hasOwnProperty('xCoord') && c.hasOwnProperty('yCoord');
}

function isLocationCoordinates(c: AllCoordinates) : c is LocationCoordinates {
  return c != null && c.hasOwnProperty('xcoord') && c.hasOwnProperty('ycoord');
}

function isRequestCoordinates(c: AllCoordinates) : c is RequestCoordinates {
  return c != null && c.hasOwnProperty('latitude') && c.hasOwnProperty('longitude');
}

function isMediaPlanningCoordinates(c: AllCoordinates) : c is MediaPlanningCoordinates {
  return c != null && c.hasOwnProperty('siteLat') && c.hasOwnProperty('siteLong');
}

export function toUniversalCoordinates(coordinates: AllCoordinates) : UniversalCoordinates;
export function toUniversalCoordinates(coordinate: AllCoordinates[]) : UniversalCoordinates[];
export function toUniversalCoordinates(coordinates: AllCoordinates | AllCoordinates[]) : UniversalCoordinates | UniversalCoordinates[] {
  if (Array.isArray(coordinates)) {
    return coordinates.map(c => toUniversalCoordinates(c));
  } else if (isGeoCoordinates(coordinates)) {
    return {x: coordinates.xCoord, y: coordinates.yCoord};
  } else if (isLocationCoordinates(coordinates)) {
    return {x: coordinates.xcoord, y: coordinates.ycoord};
  } else if (isRequestCoordinates(coordinates)) {
    return {x: coordinates.longitude, y: coordinates.latitude};
  } else if (isMediaPlanningCoordinates(coordinates)) {
    return {x: coordinates.siteLong, y: coordinates.siteLat};
  } else {
    return {x: coordinates.Longitude, y: coordinates.Latitude};
  }
}
