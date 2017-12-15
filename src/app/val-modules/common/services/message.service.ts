import {Injectable} from '@angular/core';
//import {HttpClient} from '@angular/common/http';
import {HttpClientModule} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {Message} from '../models/Message';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

@Injectable()
export class MessageService
{
   messages: Observable<Message[]>;

   private _messages: BehaviorSubject<Message[]>;
   private baseUrl: string;
   private dataStore: { messages: Message[] };
/*
   constructor(private http: HttpClient)
   {
      this.baseUrl   = 'https://56e05c3213da80110013eba3.mockapi.io/api';
      this.dataStore = { messages: [] };
      this._messages = <BehaviorSubject<Message[]>>new BehaviorSubject([]);
      this.messages  = this._messages.asObservable();
   }

   loadAll()
   {
   this.http.get(`${this.baseUrl}/messages`).subscribe(
      data  => {
                  this.dataStore.messages = data;
                  this._messages.next(Object.assign({}, this.dataStore).messages);
               },
      error => console.log('Could not load messages.'));
   }

   load(id: number | string)
   {
      this.http.get(`${this.baseUrl}/messages/${id}`).subscribe(data => {
      let notFound = true;

      this.dataStore.messages.forEach((item, index) => {
         if (item.id === data.id) {
            this.dataStore.messages[index] = data;
            notFound = false;
         }
      });

      if (notFound) {
         this.dataStore.messages.push(data);
      }

      this._messages.next(Object.assign({}, this.dataStore).messages);
      }, error => console.log('Could not load message.'));
   }

   create(message: Message)
   {
      this.http.post(`${this.baseUrl}/messages`, JSON.stringify(message)).subscribe(data => {
         this.dataStore.messages.push(data);
         this._messages.next(Object.assign({}, this.dataStore).messages);
      }, error => console.log('Could not create todo.'));
   }

   update(message: Message)
   {
      this.http.put(`${this.baseUrl}/messages/${message.id}`, JSON.stringify(message)).subscribe(data => {
         this.dataStore.messages.forEach((t, i) => {
            if (t.id === data.id) { this.dataStore.messages[i] = data; }
         });

         this._messages.next(Object.assign({}, this.dataStore).messages);
      }, error => console.log('Could not update todo.'));
   }

   remove(messageId: number)
   {
      this.http.delete(`${this.baseUrl}/messages/${messageId}`).subscribe(response => {
      this.dataStore.messages.forEach((t, i) => {
         if (t.id === messageId) { this.dataStore.messages.splice(i, 1); }
      });

      this._messages.next(Object.assign({}, this.dataStore).messages);
      }, error => console.log('Could not delete todo.'));
   }*/
}