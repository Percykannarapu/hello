import { Component, OnInit } from '@angular/core';
import { MessageCenterData } from '@val/messaging';
import { MenuItem, PrimeIcons } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MessageCenterComponent } from '../../../../../../modules/messaging/components/message-center/message-center.component';
import { MessageCenterService } from '../../../../../../modules/messaging/core/message-center.service';
import { UserService } from '../../../services/user.service';
import { ImpowerHelpComponent } from '../../dialogs/impower-help/impower-help.component';

@Component({
  selector: 'val-app-header',
  templateUrl: './app.header.component.html',
  styleUrls: ['./app.header.component.scss'],
  providers: [DialogService]
})
export class AppHeaderComponent implements OnInit {

  username: string;
  helpLinkAddress = 'http://myvalassis/da/ts/imPower%20Resources/Forms/AllItems.aspx';
  marketLinkAddress = 'http://myvalassis/Sales%20%20Marketing/marketplanning/marketreach/2020%20Direct%20Mail%20Optimization/Forms/AllItems.aspx';
  marketLinkName = '2021 Market Optimizations';

  messageCenterMenu: MenuItem[];
  messageTip$: Observable<string>;
  messageCount$: Observable<number>;

  constructor(private dialogService: DialogService,
              private messageCenter: MessageCenterService,
              private userService: UserService) {}

  ngOnInit() {
    this.userService.userObservable.subscribe(user => {
      this.username = user.displayName ?? user.username ?? user.email;
    });
    this.messageCenterMenu = [
      { label: 'Show Message Center', icon: PrimeIcons.INBOX, command: () => this.showMessageCenter() },
      { separator: true },
      { label: 'Success Messages', icon: PrimeIcons.CHECK_CIRCLE, command: () => this.showMessageCenter('success') },
      { label: 'Warning Messages', icon: PrimeIcons.INFO_CIRCLE, command: () => this.showMessageCenter('warn') },
      { label: 'Error Messages', icon: PrimeIcons.TIMES_CIRCLE, command: () => this.showMessageCenter('error') },
      { separator: true },
      { label: 'Clear All Messages', icon: PrimeIcons.TRASH, command: () => this.clearAllMessages() },
    ];
    this.messageCount$ = this.messageCenter.getMessageCount();
    this.messageTip$ = this.messageCount$.pipe(
      map(value => `${value > 0 ? value : 'No'} ${value === 1 ? 'message' : 'messages'} waiting`)
    );
  }

  showMessageCenter(severity?: MessageCenterData['severity']) : void {
    this.dialogService.open(MessageCenterComponent, {
      data: {
        severity
      },
      header: 'Message Center',
      width: '67vw',
      styleClass: 'val-table-dialog'
    });
  }

  clearAllMessages() : void {
    this.messageCenter.clearMessages();
  }

  showHelp() : void {
    if (this.userService.userHasGrants(['IMPOWER_INTERNAL_FEATURES'])) {
      window.open(this.helpLinkAddress, '_blank');
    } else {
      this.dialogService.open(ImpowerHelpComponent, {
        header: 'Impower Help Resources',
        width : '33vw'
      });
    }
  }
}
