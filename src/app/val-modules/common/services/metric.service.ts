import {Injectable} from '@angular/core';
import { Observable, Subject } from 'rxjs';    // See: https://github.com/ReactiveX/rxjs

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

   public copy(groupName:string, key: string, src: Map<string, Map<string, string>>, dest: Map<string, Map<string, string>>) {

   }
}
