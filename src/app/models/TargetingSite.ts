export class TargetingSite{
    constructor( ){}

    public dirty            : boolean;
    public baseStatus       : string;
   
   
    public pk               : number;
    public profile          : number;
    public xcoord           : number;
    public ycoord           : number;
    public siteType         : number;
    public legacySiteId     : string;
    public name             : string;
    public owner            : String;
    public franchisee       : string;
    public address          : string;
    public crossStreet      : string;
    public city             : string;
    public state            : string;
    public zip              : string;
    public taSource         : number;
    public xmlLocation      : string;
    public xmlTradeArea     : string;
    public createType       : number;
}