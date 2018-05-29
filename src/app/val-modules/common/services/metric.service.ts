import {Injectable} from '@angular/core';
import { Observable, Subject } from 'rxjs';    // See: https://github.com/ReactiveX/rxjs
import { ImpMetricName } from '../../metrics/models/ImpMetricName';

export enum MetricOperations {
   ADD,
   REMOVE,
   UPDATE,
   COPY // todo: what is the COPY operation??
}
export class MetricMessage
{
   constructor(public operation: MetricOperations,
               public group: string,
               public key: string,
               public value: string,
               public flag: boolean,
               public metrics?: Map<string, Map<string, string>>) { }
}

export class CounterMetrics{
      constructor(public usageMetricName: ImpMetricName, public metricText: string, public metricValue: number
      ){}
}

@Injectable()
export class MetricService
{
   // Map of metric maps - Key: colorbox name, Value: map of metrics tracked by the colorbox
   metrics: Map<string, Map<string, string>>;

   private subject: Subject<MetricMessage> = new Subject<MetricMessage>();

   constructor()
   {
      this.metrics = new Map<string, Map<string, string>> ();
   }

   public getMetrics() {
         return this.metrics;
   }

   // ----------------------------------------------------------------
   // Model CRUD
   // ----------------------------------------------------------------
   public add(groupName: string, key: string, value: string, flag: boolean = false)
   {
      // console.log('Add fired: groupName: ' + groupName + ', key: ' + key + ', value: ' + value);

      // Add the site to the selected sites array
      let group: Map<string, string> = this.metrics.get(groupName);

      // console.log ('group: ' + group);

      // If the group didn't exist, create it
      if (group == null)
      {
         // console.log('group was null');
         group = new Map<string, string>();
         this.metrics.set(groupName, group);
      }
      // else
      //   console.log ('group: ' + groupName + ' found');

      // console.log('about to set key: ' + key);
      group.set(key, value);

      // Notifiy Observers
      // console.log('Alerting observers');
      this.subject.next(new MetricMessage(MetricOperations.ADD, groupName, key, value, flag));
   }

   public remove (groupName: string, key: string)
   {
      // Add the site to the selected sites array
      const group: Map<string, string> = this.metrics.get(groupName);

      // If the group didn't exist, create it
      if (group != null)
      {
         group.delete(key);

         // Notifiy Observers
         this.subject.next(new MetricMessage(MetricOperations.REMOVE, groupName, key, null, false));
      }
   }

   public update (groupName: string, key: string, value: string, flag: boolean = false)
   {
      // Add the site to the selected sites array
      let group: Map<string, string> = this.metrics.get(groupName);

      // If the group didn't exist, create it
      if (group === null)
      {
         group = new Map<string, string>();
         this.metrics.set(groupName, group);
      }

      group.set(key, value);

      // Notifiy Observers
      this.subject.next(new MetricMessage(MetricOperations.UPDATE, groupName, key, value, flag));
   }

   // ----------------------------------------------------------------
   // Misc Methods
   // ----------------------------------------------------------------
   public observeMetrics() : Observable<MetricMessage> {
      return this.subject.asObservable();
   }

   public copy(groupName: string, key: string, src: Map<string, Map<string, string>>, dest: Map<string, Map<string, string>>) {

   }

   public colorboxUsageMetricsCreate(actionName: string) {

        //CAMPAIGN
        const counterMetrics = [];
        const campaignMap: Map<string, string> = this.metrics.get('CAMPAIGN'); 
        //console.log('CAMPAIGN map ::::', campaignMap);
       let  usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'campaign-colorbox', target: 'household-count', action: actionName });
      //  const hhcount = campaignMap.get('Household Count');
      //  const hhcountNumber = Number(campaignMap.get('Household Count').replace(/,(?!(?<=",)")/g, ''));
      //  const hhcountNum = Number(campaignMap.get('Household Count').replace(/,(?!(?<=",)")/g, ''));
      //  const parsehhcount = parseFloat(campaignMap.get('Household Count').replace('$', ''));
       counterMetrics.push(new CounterMetrics(usageMetricName, null, Number(campaignMap.get('Household Count').replace(/[^\w.\s]/g, ''))));
  
        usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'campaign-colorbox', target: 'ip-count', action: actionName });
        counterMetrics.push(new CounterMetrics(usageMetricName, null, Number(campaignMap.get('IP Address Count').replace(/[^\w.\s]/g, ''))));
  
        usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'campaign-colorbox', target: 'total-investment', action: actionName });
        counterMetrics.push(new CounterMetrics(usageMetricName, null, Number(campaignMap.get('Est. Total Investment').replace(/[^\w.\s]/g, ''))));
  
        usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'campaign-colorbox', target: 'progress-to-budget', action: actionName });
        counterMetrics.push(new CounterMetrics(usageMetricName, null , Number(campaignMap.get('Progress to Budget').replace(/[^\w.\s]/g, ''))));
        
  
        //AUDIENCE
        const audienceMap:  Map<string, string> = this.metrics.get('AUDIENCE'); 
        usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'audience-colorbox', target: 'CL2I00', action: actionName });
        counterMetrics.push(new CounterMetrics(usageMetricName, null , Number(audienceMap.get('Median Household Income').replace(/[^\w.\s]/g, ''))));
  
        usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'audience-colorbox', target: 'CL0C00', action: actionName });
        counterMetrics.push(new CounterMetrics(usageMetricName, null , Number(audienceMap.get('% \'17 HHs Families with Related Children < 18 Yrs').replace(/[^\w.\s]/g, ''))));
  
        usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'audience-colorbox', target: 'CL2PRH', action: actionName });
        counterMetrics.push(new CounterMetrics(usageMetricName, null , Number(audienceMap.get('% \'17 Pop Hispanic or Latino').replace(/[^\w.\s]/g, ''))));
  
        usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'audience-colorbox', target: 'TAP049', action: actionName });
        counterMetrics.push(new CounterMetrics(usageMetricName, null , Number(audienceMap.get('Casual Dining: 10+ Times Past 30 Days').replace(/[^\w.\s]/g, ''))));
        
        //console.log('AUDIENCE map ::::', audienceMap);  
  
        //PERFORMANCE
        const performanceMap:  Map<string, string> = this.metrics.get('PERFORMANCE'); 
        //console.log('PERFORMANCE map ::::', performanceMap);  
        usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'performance-colorbox', target: 'predicted-response', action: actionName });
        counterMetrics.push(new CounterMetrics(usageMetricName, null , Number(performanceMap.get('Predicted Response').replace(/[^\w.\s]/g, ''))));
  
        usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'performance-colorbox', target: 'predicted-sales', action: actionName });
        counterMetrics.push(new CounterMetrics(usageMetricName, null , Number(performanceMap.get('Predicted Topline Sales Generated').replace(/[^\w.\s]/g, ''))));

        //TODO: need to check issue on this metric
        usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'performance-colorbox', target: 'cost-per-response', action: actionName });
        //counterMetrics.push(new CounterMetrics(usageMetricName, null , Number(performanceMap.get('Cost per Response').replace(/[^\w.\s]/g, ''))));

        return counterMetrics;

   }
}
