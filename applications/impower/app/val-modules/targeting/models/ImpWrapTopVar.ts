/** A TARGETING domain class representing the table: IMPOWER.IMP_WRAP_TOP_VARS
 **
 ** Generated from VAL_ENTITY_GEN - v2.01
 **/

export class ImpWrapTopVar
{
   public geocode:         string;
   public shape:           Object; // TODO - This is really sde.st_geometry
   public percapt:         number;
   public percaptw:        number;
   public persfdu:         number;
   public persfduw:        number;
   public annecnt:         number;
   public annecntw:        number;
   public aptcnt:          number;
   public aptcntW:         number;
   public hhld:            number;
   public hhldW:           number;
   public mailCountSummer: number;
   public mailCountWinter: number;
   public newsMailCount:   number;
   public newsCount:       number;
   public numDirectParent: number;
   public pcdCount:        number;
   public pobScount:       number;
   public pobWcount:       number;
   public smc:             number;
   public smcW:            number;
   public sfdu:            number;
   public sfduW:           number;
   public solo:            number;
   public soloW:           number;
   public vdp:             number;
   public vdpW:            number;
   public vdpHhld:         number;
   public vdpHhldW:        number;
   public cl0c00:          number;
   public cl0c01:          number;
   public cl0c03:          number;
   public cl0c04:          number;
   public cl0phm:          number;
   public cl2f00:          number;
   public cl2ha5:          number;
   public cl2ha6:          number;
   public cl2ha7:          number;
   public cl2ha8:          number;
   public cl2hsz:          number;
   public cl2i02:          number;
   public cl2i0k:          number;
   public cl2i0o:          number;
   public cl2i0p:          number;
   public cl2i0r:          number;
   public cl2i0:           number;
   public cl2i0t:          number;
   public cl2i0u:          number;
   public cl2m00:          number;
   public cl2pra:          number;
   public cl2prb:          number;
   public cl2prh:          number;
   public cl2prw:          number;
   public occhb:           number;
   public occhba:          number;
   public occhh:           number;
   public cl2a0009:        number;
   public cl2a1014:        number;
   public cl2a1517:        number;
   public cl2a1519:        number;
   public cl2a1820:        number;
   public cl2a1821:        number;
   public cl2a2029:        number;
   public cl2a2124:        number;
   public cl2a2224:        number;
   public cl2a2529:        number;
   public cl2a2554:        number;
   public cl2a3034:        number;
   public cl2a3039:        number;
   public cl2a3539:        number;
   public cl2a4044:        number;
   public cl2a4049:        number;
   public cl2a4549:        number;
   public cl2a5054:        number;
   public cl2a5059:        number;
   public cl2a5559:        number;
   public cl2a6000:        number;
   public cl2a6064:        number;
   public cl2a6500:        number;
   public cl2a7000:        number;
   public cl2f1821:        number;
   public cl2f2029:        number;
   public cl2f2224:        number;
   public cl2f2529:        number;
   public cl2f2554:        number;
   public cl2f3034:        number;
   public cl2f3039:        number;
   public cl2f3539:        number;
   public cl2f4044:        number;
   public cl2f4049:        number;
   public cl2f4549:        number;
   public cl2f5054:        number;
   public cl2f5059:        number;
   public cl2f5559:        number;
   public cl2f6000:        number;
   public cl2m4049:        number;
   public cl2m5059:        number;
   public cl2m6000:        number;
   public cl0pe5:          number;
   public cl0pe6:          number;
   public cl0pe7:          number;
   public cl0pe9:          number;
   public cl0pw3:          number;
   public cl0ub9:          number;
   public cl0uba:          number;
   public cl0ubb:          number;
   public cl0ubc:          number;
   public cl0ubd:          number;
   public cl0ube:          number;
   public cl0ubf:          number;
   public cl0ubg:          number;
   public cl0utr:          number;
   public cl0utw:          number;
   public cl0uu2:          number;
   public cl0uu6:          number;
   public cl0uw0:          number;
   public cl2hwv:          number;
   public y2lh02:          number;
   public cl0ps2:          number;
   public cl2a00:          number;
   public cl2ha0:          number;
   public cl2i00:          number;
   public cl2w00:          number;
   public clpfs4:          number;
   public go00:            number;
   public r003:            number;
   public r005:            number;
   public df11:            number;
   public seg0:            number;
   public hspnnoti:        number;
   public clhspf25:        number;
   public clhspf35:        number;
   public clhspf45:        number;
   public vsAIdx:          number;
   public vsAPct:          number;
   public vsBIdx:          number;
   public vsBPct:          number;
   public vsCIdx:          number;
   public vsCPct:          number;
   public vsDIdx:          number;
   public vsDPct:          number;
   public vsEIdx:          number;
   public vsEPct:          number;
   public numIpAddr:       number;
   public nla029:          number;
   public nla084:          number;
   public nla107:          number;
   public highTech:        number;
   public loTech:          number;
   public midTech:         number;
   public noTech:          number;
   public tap049:          number;
   public tap106:          number;
   public tap109:          number;
   public tap116:          number;
   public tap123:          number;
   public tap169:          number;
   public tap178:          number;
   public tap181:          number;
   public tap199:          number;
   public tap200:          number;
   public tap201:          number;
   public tap203:          number;
   public tap298:          number;

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?:Partial<ImpWrapTopVar>) {
      Object.assign(this, data);
   }

   /**
    * Produces a map of this classes fields and data types.
    * Used instead of reflection, which has limitations.
    *
    * @returns Map<field, type>
    */
   public static getFields () : Map<string, string>
   {
      return new Map([
         ['geocode',          'string'],
         ['shape',            'struct'],
         ['percapt',          'number'],
         ['percaptw',         'number'],
         ['persfdu',          'number'],
         ['persfduw',         'number'],
         ['annecnt',          'number'],
         ['annecntw',         'number'],
         ['aptcnt',           'number'],
         ['aptcntW',          'number'],
         ['hhld',             'number'],
         ['hhldW',            'number'],
         ['mailCountSummer',  'number'],
         ['mailCountWinter',  'number'],
         ['newsMailCount',    'number'],
         ['newsCount',        'number'],
         ['numDirectParent',  'number'],
         ['pcdCount',         'number'],
         ['pobScount',        'number'],
         ['pobWcount',        'number'],
         ['smc',              'number'],
         ['smcW',             'number'],
         ['sfdu',             'number'],
         ['sfduW',            'number'],
         ['solo',             'number'],
         ['soloW',            'number'],
         ['vdp',              'number'],
         ['vdpW',             'number'],
         ['vdpHhld',          'number'],
         ['vdpHhldW',         'number'],
         ['cl0c00',           'number'],
         ['cl0c01',           'number'],
         ['cl0c03',           'number'],
         ['cl0c04',           'number'],
         ['cl0phm',           'number'],
         ['cl2f00',           'number'],
         ['cl2ha5',           'number'],
         ['cl2ha6',           'number'],
         ['cl2ha7',           'number'],
         ['cl2ha8',           'number'],
         ['cl2hsz',           'number'],
         ['cl2i02',           'number'],
         ['cl2i0k',           'number'],
         ['cl2i0o',           'number'],
         ['cl2i0p',           'number'],
         ['cl2i0r',           'number'],
         ['cl2i0',            'number'],
         ['cl2i0t',           'number'],
         ['cl2i0u',           'number'],
         ['cl2m00',           'number'],
         ['cl2pra',           'number'],
         ['cl2prb',           'number'],
         ['cl2prh',           'number'],
         ['cl2prw',           'number'],
         ['occhb',            'number'],
         ['occhba',           'number'],
         ['occhh',            'number'],
         ['cl2a0009',         'number'],
         ['cl2a1014',         'number'],
         ['cl2a1517',         'number'],
         ['cl2a1519',         'number'],
         ['cl2a1820',         'number'],
         ['cl2a1821',         'number'],
         ['cl2a2029',         'number'],
         ['cl2a2124',         'number'],
         ['cl2a2224',         'number'],
         ['cl2a2529',         'number'],
         ['cl2a2554',         'number'],
         ['cl2a3034',         'number'],
         ['cl2a3039',         'number'],
         ['cl2a3539',         'number'],
         ['cl2a4044',         'number'],
         ['cl2a4049',         'number'],
         ['cl2a4549',         'number'],
         ['cl2a5054',         'number'],
         ['cl2a5059',         'number'],
         ['cl2a5559',         'number'],
         ['cl2a6000',         'number'],
         ['cl2a6064',         'number'],
         ['cl2a6500',         'number'],
         ['cl2a7000',         'number'],
         ['cl2f1821',         'number'],
         ['cl2f2029',         'number'],
         ['cl2f2224',         'number'],
         ['cl2f2529',         'number'],
         ['cl2f2554',         'number'],
         ['cl2f3034',         'number'],
         ['cl2f3039',         'number'],
         ['cl2f3539',         'number'],
         ['cl2f4044',         'number'],
         ['cl2f4049',         'number'],
         ['cl2f4549',         'number'],
         ['cl2f5054',         'number'],
         ['cl2f5059',         'number'],
         ['cl2f5559',         'number'],
         ['cl2f6000',         'number'],
         ['cl2m4049',         'number'],
         ['cl2m5059',         'number'],
         ['cl2m6000',         'number'],
         ['cl0pe5',           'number'],
         ['cl0pe6',           'number'],
         ['cl0pe7',           'number'],
         ['cl0pe9',           'number'],
         ['cl0pw3',           'number'],
         ['cl0ub9',           'number'],
         ['cl0uba',           'number'],
         ['cl0ubb',           'number'],
         ['cl0ubc',           'number'],
         ['cl0ubd',           'number'],
         ['cl0ube',           'number'],
         ['cl0ubf',           'number'],
         ['cl0ubg',           'number'],
         ['cl0utr',           'number'],
         ['cl0utw',           'number'],
         ['cl0uu2',           'number'],
         ['cl0uu6',           'number'],
         ['cl0uw0',           'number'],
         ['cl2hwv',           'number'],
         ['y2lh02',           'number'],
         ['cl0ps2',           'number'],
         ['cl2a00',           'number'],
         ['cl2ha0',           'number'],
         ['cl2i00',           'number'],
         ['cl2w00',           'number'],
         ['clpfs4',           'number'],
         ['go00',             'number'],
         ['r003',             'number'],
         ['r005',             'number'],
         ['df11',             'number'],
         ['seg0',             'number'],
         ['hspnnoti',         'number'],
         ['clhspf25',         'number'],
         ['clhspf35',         'number'],
         ['clhspf45',         'number'],
         ['vsAIdx',           'number'],
         ['vsAPct',           'number'],
         ['vsBIdx',           'number'],
         ['vsBPct',           'number'],
         ['vsCIdx',           'number'],
         ['vsCPct',           'number'],
         ['vsDIdx',           'number'],
         ['vsDPct',           'number'],
         ['vsEIdx',           'number'],
         ['vsEPct',           'number'],
         ['numIpAddr',        'number'],
         ['nla029',           'number'],
         ['nla084',           'number'],
         ['nla107',           'number'],
         ['highTech',         'number'],
         ['loTech',           'number'],
         ['midTech',          'number'],
         ['noTech',           'number'],
         ['tap049',           'number'],
         ['tap106',           'number'],
         ['tap109',           'number'],
         ['tap116',           'number'],
         ['tap123',           'number'],
         ['tap169',           'number'],
         ['tap178',           'number'],
         ['tap181',           'number'],
         ['tap199',           'number'],
         ['tap200',           'number'],
         ['tap201',           'number'],
         ['tap203',           'number'],
         ['tap298',           'number']
         ]);
   }

   /**
    * Produces a map of this classes relationships and data types.
    * Used instead of reflection, which has limitations.
    *
    * @returns Map<field, type>
    */
   public static getRelationships () : Map<string, string>
   {
      return new Map([
         ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');
}
