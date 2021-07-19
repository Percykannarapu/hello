import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { isEmpty, isNil, isNotNil, isString } from '@val/common';
import { SelectItem } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Table } from 'primeng/table';
import { Observable } from 'rxjs';
import { MessageCenterService } from '../../core/message-center.service';
import { MessageCenterData } from '../../state/messaging.interfaces';

@Component({
  selector: 'val-message-center',
  templateUrl: './message-center.component.html'
})
export class MessageCenterComponent implements OnInit, AfterViewInit {

  @ViewChild('messageTable') table: Table;

  severities: SelectItem<MessageCenterData['severity']>[] = [
    { label: 'Success', value: 'success' },
    { label: 'Info', value: 'info' },
    { label: 'Warnings', value: 'warn' },
    { label: 'Errors', value: 'error' }
  ];
  messages$: Observable<MessageCenterData[]>;
  messageColumns = [
    {field: 'timeStamp', header: 'Date/Time sent', sortable: true, width: '15%', filterType: 'date' },
    {field: 'severity',  header: 'Severity',       sortable: true, width: '10%', filterType: 'severityMulti' },
    {field: 'title',     header: 'Title',          sortable: true, width: '15%', filterType: 'text' },
    {field: 'message',   header: 'Message',        sortable: true, width: '40%', filterType: 'text' },
    {field: 'otherData', header: 'Other Info',     sortable: false },
  ];

  entityDefaultSortField = 'timeStamp';
  entityDefaultSortOrder = -1;
  entityId = 'id';
  trackByEntityId = (index: number, container: MessageCenterData) => container.id;

  constructor(private ddRef: DynamicDialogRef,
              private ddConfig: DynamicDialogConfig,
              private service: MessageCenterService) { }

  ngOnInit() : void {
    this.messages$ = this.service.getMessages();
  }

  ngAfterViewInit() : void {
    const sev = this.ddConfig.data.severity;
    if (isNotNil(sev)) {
      this.table.filter([sev], 'severity', 'in');
    }
  }

  hasObjectData(value: any) : boolean {
    return !isString(value);
  }

  copyToClipboard(value: any) : void {
    window.navigator.clipboard.writeText(JSON.stringify(value));
  }

  removeMessages() : void {
    // for table.filteredValue
    // null / undefined means no filter is currently applied
    // empty array means a filter is applied, but no values match
    if (isNil(this.table.filteredValue)) {
      this.service.clearMessages();
    } else {
      const idsToRemove = this.table.filteredValue.map((m: MessageCenterData) => m.id);
      if (!isEmpty(idsToRemove)) {
        this.service.clearMessages(idsToRemove);
      }
    }
    this.ddRef.close();
  }
}
