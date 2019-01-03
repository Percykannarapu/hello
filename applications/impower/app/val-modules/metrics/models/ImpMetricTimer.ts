/** A METRICS domain class representing the table: IMPOWER.IMP_METRIC_TIMERS
 **
 ** Generated from VAL_ENTITY_GEN - v2.01
 **/

import { ImpMetricName } from './ImpMetricName';

export class ImpMetricTimer
{
   public timerId:           number;
   public createUser:        number;
   public createDate:        Date;
   public modifyUser:        number;
   public modifyDate:        Date;
   public origSystemRefId:   string;
   public origSystemRefCode: string;
   public count:             number;
   public min:               number;
   public max:               number;
   public mean:              number;
   public p50:               number;
   public p75:               number;
   public p95:               number;
   public p98:               number;
   public p99:               number;
   public p999:              number;
   public stddev:            number;
   public m1Rate:            number;
   public m5Rate:            number;
   public m15Rate:           number;
   public meanRate:          number;
   public rateUnit:          string;
   public durationUnit:      string;
   public metricValue:       number;
   public metricText:        string;

   // IMPOWER.IMP_METRIC_TIMERS - MANY TO ONE RELATIONSHIP MEMBERS
   // ------------------------------------------------------------
   public impMetricName:     ImpMetricName;       /// Registry Of Impower Metrics made up of: <namespace>.<instrumented section>.<target (noun)>.<action (past tense verb>) EXAMPLE: customers.registration.validation.failed

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<ImpMetricTimer>) {
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
         ['timerId',            'number'],
         ['createUser',         'number'],
         ['createDate',         'Date'],
         ['modifyUser',         'number'],
         ['modifyDate',         'Date'],
         ['origSystemRefId',    'string'],
         ['origSystemRefCode',  'string'],
         ['count',              'number'],
         ['min',                'number'],
         ['max',                'number'],
         ['mean',               'number'],
         ['p50',                'number'],
         ['p75',                'number'],
         ['p95',                'number'],
         ['p98',                'number'],
         ['p99',                'number'],
         ['p999',               'number'],
         ['stddev',             'number'],
         ['m1Rate',             'number'],
         ['m5Rate',             'number'],
         ['m15Rate',            'number'],
         ['meanRate',           'number'],
         ['rateUnit',           'string'],
         ['durationUnit',       'string'],
         ['metricValue',        'number'],
         ['metricText',         'string']
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
         // MANY TO ONE RELATIONSHIP MEMBERS
         ['impMetricName',      'ImpMetricName']
         ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');
}
