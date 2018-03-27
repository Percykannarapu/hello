/** A METRICS domain class representing the table: IMPOWER.IMP_METRIC_NAMES
 **
 ** Generated from VAL_ENTITY_GEN - v2.01
 **/

import { ImpMetricType } from './ImpMetricType';

export class ImpMetricName
{
   public metricId:             number;                    /// Primary key uniquely identifying a Metric row
   public createUser:           number;                    /// User to create the row
   public createDate:           Date;                      /// Date/Time row was created
   public modifyUser:           number;                    /// User to modify the row
   public modifyDate:           Date;                      /// Date/Time row was modified
   public namespace:            string;                    /// Metric Namespace (Ex. Customer)
   public section:              string;                    /// Metric Instrumented Section (Ex. registration)
   public target:               string;                    /// Metric Target (noun) (Ex. validation)
   public action:               string;                    /// Metric Action (past tense verb (Ex. failed)
   public description:          string;
   public isActive:             number;                    /// Is Active
   public metricTypeCode:       string;                    /// The metric type being used, COUNTER, HISTOGRAM, etc

   // IMPOWER.IMP_METRIC_NAMES - MANY TO ONE RELATIONSHIP MEMBERS
   // -----------------------------------------------------------
   //public impMetricType:        ImpMetricType;             /// Impower Metric Types (Gauge, Counter, Histogram, Meter, Timer, Health-Check)

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<ImpMetricName>) {
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
         ['metricId',              'number'],
         ['createUser',            'number'],
         ['createDate',            'Date'],
         ['modifyUser',            'number'],
         ['modifyDate',            'Date'],
         ['namespace',             'string'],
         ['section',               'string'],
         ['target',                'string'],
         ['action',                'string'],
         ['description',           'string'],
         ['isActive',              'number']
         ]);
   }

   /**
    * Produces a map of this classes relationships and data types.
    * Used instead of reflection, which has limitations.
    *
    * @returns Map<field, type>
    */
   /*public static getRelationships () : Map<string, string>
   {
      return new Map([
         // MANY TO ONE RELATIONSHIP MEMBERS
         ['impMetricType',         'ImpMetricType']
         ]);
   }*/

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');
}