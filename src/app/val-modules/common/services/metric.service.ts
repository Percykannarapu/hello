import { AccordionModule } from 'primeng/primeng';
import {Injectable} from '@angular/core';
import {Message} from '../models/Message';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';    // See: https://github.com/ReactiveX/rxjs
import {of} from 'rxjs/observable/of';
import {Subject} from 'rxjs/Subject';

export enum MetricOperations {
   ADD,
   REMOVE,
   UPDATE,
   COPY
}
export class MetricMessage
{
   operation: MetricOperations;
   group: string;
   key: string;
   value: string;
   metrics: Map<string, Map<string, string>>;

   constructor(operation: MetricOperations,
               group: string,
               key: string,
               value: string,
               metrics?: Map<string, Map<string, string>>)
   {
      this.operation = operation;
      this.group = group;
      this.key = key;
      this.value = value;
      if (metrics != null)
         this.metrics = metrics;
   }
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

   // ----------------------------------------------------------------
   // Model CRUD
   // ----------------------------------------------------------------
   public add(groupName: string, key: string, value: string)
   {
      console.log('Add fired: groupName: ' + groupName + ', key: ' + key + ', value: ' + value);

      // Add the site to the selected sites array
      let group: Map<string, string> = this.metrics.get(groupName);

      console.log ('group: ' + group);

      // If the group didn't exist, create it
      if (group == null)
      {
         console.log('group was null');
         group = new Map<string, string>();
         this.metrics.set(groupName, group);
      }
      else
        console.log ('group: ' + groupName + ' found');

      console.log('about to set key: ' + key);
      group.set(key, value);

      // Notifiy Observers
      console.log('Alerting observers');
      this.subject.next(new MetricMessage(MetricOperations.ADD, groupName, key, value));
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
         this.subject.next(new MetricMessage(MetricOperations.REMOVE, groupName, key, null));
      }
   }
    
   public update (groupName: string, key: string, value: string)
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
      this.subject.next(new MetricMessage(MetricOperations.UPDATE, groupName, key, value));
   }

   // ----------------------------------------------------------------
   // Misc Methods
   // ----------------------------------------------------------------
   public observeMetrics() : Observable<MetricMessage> {
      return this.subject.asObservable();
   }   
}