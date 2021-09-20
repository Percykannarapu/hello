import { Component, OnInit } from '@angular/core';
import { isString } from '@val/common';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageBoxData } from '../../core/message-box.service';

@Component({
  templateUrl: './message-box.component.html'
})
export class MessageBoxComponent implements OnInit {

  messages: string[];
  icon: string;
  acceptText: string;
  rejectText: string;
  buttonCount: 1 | 2;

  constructor(private ddConfig: DynamicDialogConfig,
              private ddRef: DynamicDialogRef) { }

  ngOnInit() : void {
    const data: MessageBoxData = this.ddConfig.data;
    this.icon = data.icon;
    this.acceptText = data.acceptText;
    this.rejectText = data.rejectText;
    this.buttonCount = data.buttonCount;
    this.messages = isString(data.message) ? [data.message] : data.message;
  }

  onAccept() {
    this.ddRef.close(true);
  }

  onReject() {
    this.ddRef.close(false);
  }
}
