export interface GeoVar {
  geocode: string;                   // GeoVar must have a geocode
  [name: string] : string | number;  // GeoVar may have additional properties
}
