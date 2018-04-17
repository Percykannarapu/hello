import { TargetingSite } from "./TargetingSite";

export class TargetingProfile{

    constructor( ){}

    public dirty                : boolean;
    public baseStatus           : string;
    public pk                   : number;
    public createUser           : number;
    public group                : number;
    public createDate           : Date;
    public name                 : string;
    public description          : string;
    public clientId             : string;
    public methAccess           : number;
    public methAnalysis         : string;
    public methDistribution     : String;
    public methSeason           : string
    public taSource             : number;
    public xmlVariables         : string;
    public xmlTradearea         : string;
    public xmlSicquery          : string;
    public modifyUser           : number;
    public modifyDate           : Date;
    // ----------------------------------------------------------------------------

    // ----------------------------------------------------------------------------
    // TRANSITORY MEMBERS (NOT PERSISTED)
    // ----------------------------------------------------------------------------
    public promoPeriodStartDate : Date;
    public promoPeriodEndDate   : Date;
    public preferredDate        : Date;          ;        /// The client preferred date
    // ----------------------------------------------------------------------------

    // ----------------------------------------------------------------------------
    // SDE.AM_PROFILES ONE TO MANY RELATIONSHIP MEMBERS
    // ----------------------------------------------------------------------------
    public sites?   : Array<TargetingSite>;

}
