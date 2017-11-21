//import { GeofootprintGeo } from 'geofootprintGeo.model';

import { GeofootprintSite } from './GeofootprintSite';
import { GeofootprintTaName } from './GeofootprintTaName';
import { GeofootprintTradeArea } from './GeofootprintTradeArea';
import { GeofootprintVar } from './GeofootprintVar';
import { GeofootprintGeo } from './geofootprintGeo.model';
import { LinkedList } from 'ngx-bootstrap';
export class GeofootprintMaster {
  
  constructor( ){}
  
  
    public dirty               : boolean;
    public baseStatus          : string;
    public cgmId               : number;
    public profile             : number;  
    public summaryInd          : number;
    public allowDuplicates     : number;
    public createdDate         : Date;
    public status              : string;
    public methAnalysis        : string;
    public profileName         : string;
    public methSeason          : string;
    public activeSiteCount     : number;
    public totalSiteCount      : number;
    public isMarketBased       : boolean;

    public geofootprintGeos?   : Array<GeofootprintGeo>;
    public geofootprintSites?  : Array<GeofootprintSite>;
    public geofootprintTaNames?: Array<GeofootprintTaName>;
    public geofootprintTradeAreas? : Array<GeofootprintTradeArea>; 
    public geofootprintVars?   : Array<GeofootprintVar>;     


    /*public geofootprintGeoList?    : LinkedList<GeofootprintGeo>;//GeofootprintGeo[];
    public geofootprintSiteList?   : LinkedList<GeofootprintSite>;
    public geofootprintTaNameList? : LinkedList<GeofootprintTaName>;
    public geofootprintTradeAreaList? : LinkedList<GeofootprintTradeArea>;
    public geofootprintVarList?    : LinkedList<GeofootprintVar>;*/
}