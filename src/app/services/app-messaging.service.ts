import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/components/common/messageservice';
import { Subject, BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class AppMessagingService {

  private spinnerStack: string[] = [];
  private spinnerMessageMap: Map<string, string> = new Map<string, string>();

  private spinnerMessage: Subject<string> = new Subject<string>();
  private spinnerState: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  public spinnerMessage$: Observable<string> = this.spinnerMessage.asObservable();
  public spinnerState$: Observable<boolean> = this.spinnerState.asObservable();

  constructor(private growlService: MessageService) { }

  public showGrowlError(title: string, message: string) : void {
    this.growlService.add({ severity: 'error', summary: title, detail: message });
  }

  public showGrowlWarning(title: string, message: string) : void {
    this.growlService.add({ severity: 'warn', summary: title, detail: message});
  }

  public showGrowlSuccess(title: string, message: string) : void {
    this.growlService.add({ severity: 'success', summary: title, detail: message });
  }

  public showGrowlInfo(title: string, message: string) : void {
    this.growlService.add({ severity: 'info', summary: title, detail: message});
  }

  public clearGrowlMessages() : void {
    this.growlService.clear();
  }

  public startSpinnerDialog(key: string, message: string) {
    if (!this.spinnerMessageMap.has(key)) {
      this.spinnerMessageMap.set(key, message);
      this.spinnerStack.push(key);
      this.manageSpinnerState();
    }
  }

  public stopSpinnerDialog(key: string) {
    if (this.spinnerMessageMap.has(key)) {
      const index = this.spinnerStack.lastIndexOf(key);
      if (index > -1) {
        this.spinnerStack.splice(index, 1);
        this.spinnerMessageMap.delete(key);
      }
      this.manageSpinnerState();
    }
  }

  private manageSpinnerState() : void {
    const showSpinner = this.spinnerStack.length > 0;
    if (showSpinner) {
      const spinnerKey = this.spinnerStack[this.spinnerStack.length - 1];
      this.spinnerMessage.next(this.spinnerMessageMap.get(spinnerKey));
    }
    this.spinnerState.next(showSpinner);
  }
}
