import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MessageBoxService } from '@val/messaging';
import { OverlayPanel } from 'primeng/overlaypanel';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { AppStateService } from '../../../../services/app-state.service';
import { LoggingService } from '../../../../val-modules/common/services/logging.service';

@Component({
  selector: 'val-color-box',
  templateUrl: './color-box.component.html',
  styleUrls: ['./color-box.component.scss']
})
export class ColorBoxComponent implements OnInit, OnDestroy {
   @ViewChild('op', { static: true }) overlayPanel: OverlayPanel;
   @Input() header:         string = 'Header';
   @Input() boxStyle:       string = 'colorbox-1';
   @Input() popupStyle:     string = 'green-panel';
   @Input() icon:           string;
   @Input() model:          Map<string, string>;
   @Input() flags:          Map<string, boolean>;
   @Input() displayOverlay: string;

   @Output() overlayClosed = new EventEmitter<void>();

   index: number = 0;
   metric: string = null;
   metricValue: string;
   isFlagged: boolean;

   private overlaySub: Subscription;
   private dialogSub: Subscription;

   constructor(private appStateService: AppStateService,
               private logger: LoggingService,
               private messageBoxService: MessageBoxService) {
     this.flags = new Map<string, boolean>();
    }

   ngOnInit() {
      this.generateColorBoxValues();
      this.overlaySub = this.appStateService.closeOverlayPanel$.pipe(
        filter(header => header !== this.header)
      ).subscribe(() => {
        this.overlayClosed.emit();
        this.overlayPanel.hide();
      });
   }

  ngOnDestroy(){
     if (this.overlaySub) this.overlaySub.unsubscribe();
     if (this.dialogSub) this.dialogSub.unsubscribe();
   }

   public onShowOverlay(event: MouseEvent, target?: any) {
     if (this.displayOverlay === 'true') {
       this.appStateService.closeOverlays(this.header);
       this.overlayPanel.toggle(event, target);
       event.stopPropagation();
       event.stopImmediatePropagation();
       if (this.dialogSub) this.dialogSub.unsubscribe();
       this.dialogSub = this.messageBoxService.messageIsOpen$.pipe(
         distinctUntilChanged()
       ).subscribe(dialogVisible => {
         if (dialogVisible) {
           this.overlayPanel.unbindDocumentClickListener();
         } else {
           this.overlayPanel.bindDocumentClickListener();
         }
       });
     }
   }

   private generateColorBoxValues(){
    const keys = Array.from(this.model.keys());

    this.index = 0;
    this.metric = keys[this.index];
    this.metricValue = this.model.get(this.metric);
    this.isFlagged = this.flags.get(this.metric) || false;
   }

   private updateModel(model: Map<string, string>) {
     this.model = model;
     const keys = Array.from(this.model.keys());
     this.metric = keys[this.index];
     this.metricValue = this.model.get(this.metric);
     this.isFlagged = this.flags.get(this.metric) || false;
   }

   // Model methods that update the UI
   public set(key: string, value: string, flag: boolean = false){
      this.model.set(key, value);
      this.flags.set(key, flag);
      this.updateModel(this.model);
   }

   public delete(key: string){
      this.model.delete(key);
      this.updateModel(this.model);
   }

   onClick(direction: string){
      if (this.model == null) {
         this.logger.info.log('model is null');
      }
      if (direction === 'Up'){
         if (this.model != null){
            this.index--;
            if (this.index < 0) {
               this.index = this.model.size - 1;
            }
         }
      }else{
         if (this.model != null){
            this.index++;
            if (this.index >= this.model.size) {
               this.index = 0;
            }
         }
      }
      this.updateModel(this.model);
   }
}
