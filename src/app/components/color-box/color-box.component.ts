import { Component, Input, OnDestroy, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { AppBusinessSearchService } from '../../services/app-business-search.service';
import { markDirty } from '../../../../node_modules/@angular/core/src/render3';
import { markDirtyIfOnPush, markViewDirty } from '../../../../node_modules/@angular/core/src/render3/instructions';
import { markParentViewsForCheck, markParentViewsForCheckProjectedViews } from '../../../../node_modules/@angular/core/src/view/util';

@Component({
  selector: 'val-color-box',
  templateUrl: './color-box.component.html',
  providers: [AppBusinessSearchService]
})
export class ColorBoxComponent implements OnInit, OnDestroy{
   @ViewChild('op') overlayPanel;
   @Input() header:         string = 'Header';
   @Input() boxStyle:       string = 'colorbox-1';
   @Input() popupStyle:     string = 'green-panel';
   @Input() icon:           string;
   @Input() model:          Map<string, string>;
   @Input() flags:          Map<string, boolean>;
   @Input() displayOverlay: string;
   @Input() dismissable:    string = "true";  // This property is currently only set once, not toggled, but will revisit if we can get change detection from child panels

   index: number = 0;
   metric: string = null;
   metricValue: string;
   isFlagged: boolean;

   constructor(private appService: AppBusinessSearchService, private cd: ChangeDetectorRef) {
     this.appService.closeOverLayPanel.subscribe((value) => {
      if (value){
        this.overlayPanel.hide();
      }
     });
     this.flags = new Map<string, boolean>();
//     this.overlayPanel.dismissable = this.dismissable;
    }

   ngOnInit() {
      // The overlay seems to just ignore this (Setting to false in template for now)
      this.overlayPanel.dismissable = this.dismissable;
      this.cd.detectChanges();
      this.generateColorBoxValues();
   }

   public onShowOverlay(event: any) {
     if (this.displayOverlay === 'true') {
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
   ngOnDestroy(){
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

   // Make change detection publicly available
   public detectChanges()
   {
      this.cd.detectChanges();
   }

   public onChangeDismiss(event) {
   /* this.dismissable is currently unused.  revisit when we can detect changes in child panels
      console.log("colorbox " + this.header + " - onChangeDismiss: event: ", event);
      this.dismissable = event as boolean;
      console.log("colorbox[" + this.header + "].dismissable = " + this.dismissable + " (typeof: " + typeof(this.dismissable) + ")");
      this.cd.detectChanges();
      console.log("overlayPanel", this.overlayPanel);
      this.overlayPanel.dismissable = this.dismissable; */
   }   
}
