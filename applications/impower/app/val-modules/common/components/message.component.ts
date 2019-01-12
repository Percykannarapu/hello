import {Component, OnInit } from '@angular/core';
import {FormBuilder} from '@angular/forms';
import {Observable } from 'rxjs';
import {Message } from '../models/Message';

@Component({
  selector: 'val-message-component',
  template: `
    <div>
<!--      <form [formGroup]="messageForm" (submit)="onSubmit()">
         <button>Add Message</button><br />
      </form>
      
      <p>
        {{singleMessage$ | async | json}}
      </p>
      
      <div *ngFor="let message of messages | async">
        {{ message.value }} <button (click)="deleteMessage(message.id)">x</button>
      </div>-->
    </div>
  `
})
export class MessageComponent implements OnInit
{
  messages: Observable<Message[]>;
  singleMessage$: Observable<Message>;
  messageForm: FormBuilder;
 /*
  constructor(
    private messageService: MessageService,
    private formBuilder: any) {

    this.messageForm = this.formBuilder.group({
      'message': ['', Validators.required]
    });
  }*/

  ngOnInit() {
 /*   this.messages = this.messageService.messages;
    this.singleMessage$ = this.messageService.messages.pipe(
      map(messages => messages.find(item => item.id === '1'))
    );

    this.messageService.loadAll();
    this.messageService.load('1');*/
  }
 /*
  onSubmit() {
    //this.messageService.create({ value: this.messageForm.control. .controls.message.value });
  }

  deleteTodo(messageId: number) {
    this.messageService.remove(messageId);
  }*/
}