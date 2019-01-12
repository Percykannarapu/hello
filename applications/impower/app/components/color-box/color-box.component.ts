import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { OverlayPanel } from 'primeng/primeng';
import { Subscription } from 'rxjs';
import { AppStateService } from '../../services/app-state.service';

@Component({
  selector: 'val-color-box',
  templateUrl: './color-box.component.html'
})
export class ColorBoxComponent implements OnInit, OnDestroy{
   @ViewChild('op') overlayPanel: OverlayPanel;
   @Input() header:         string = 'Header';
   @Input() boxStyle:       string = 'colorbox-1';
   @Input() popupStyle:     string = 'green-panel';
   @Input() icon:           string;
   @Input() model:          Map<string, string>;
   @Input() flags:          Map<string, boolean>;
   @Input() displayOverlay: string;
   @Input() dismissible:    boolean = true;  // This property is currently only set once, not toggled, but will revisit if we can get change detection from child panels

   index: number = 0;
   metric: string = null;
   metricValue: string;
   isFlagged: boolean;

   private overlaySub: Subscription;

   constructor(private appStateService: AppStateService) {
     this.flags = new Map<string, boolean>();
    }

   ngOnInit() {
      this.generateColorBoxValues();
      this.overlaySub = this.appStateService.closeOverlayPanel$.subscribe(header => {
        if (header !== this.header) this.overlayPanel.hide();
      });
   }

   ngOnDestroy(){
     if (this.overlaySub) this.overlaySub.unsubscribe();
   }

   public onShowOverlay(event: any) {
     if (this.displayOverlay === 'true') {
       this.appStateService.closeOverlays(this.header);
       this.overlayPanel.toggle(event);
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
         console.log('model is null');
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