/** A METRICS domain class representing the table: IMPOWER.IMP_METRIC_HEALTH_CHECKS
 **
 ** Generated from VAL_ENTITY_GEN - v2.01
 **/

import { ImpMetricName } from '../../app/val-modules/metrics/models/ImpMetricName';

export class ImpMetricHealthCheck
{
   public healthCheckId:        number;
   public createUser:           number;
   public createDate:           Date;
   public modifyUser:           number;
   public modifyDate:           Date;
   public origSystemRefId:      string;
   public origSystemRefCode:    string;
   public metricValue:          number;
   public metricText:           string;

   // IMPOWER.IMP_METRIC_HEALTH_CHECKS - MANY TO ONE RELATIONSHIP MEMBERS
   // -------------------------------------------------------------------
   public impMetricName:        ImpMetricName;             /// Registry Of Impower Metrics made up of: <namespace>.<instrumented section>.<target (noun)>.<action (past tense verb>) EXAMPLE: customers.registration.validation.failed

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<ImpMetricHealthCheck>) {
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
         ['healthCheckId',         'number'],
         ['createUser',            'number'],
         ['createDate',            'Date'],
         ['modifyUser',            'number'],
         ['modifyDate',            'Date'],
         ['origSystemRefId',       'string'],
         ['origSystemRefCode',     'string'],
         ['metricValue',           'number'],
         ['metricText',            'string']
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
         ['impMetricName',         'ImpMetricName']
         ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');
}
