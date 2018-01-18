import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AppService } from '../../services/app.service';

@Component({
  selector: 'val-color-box',
  templateUrl: './color-box.component.html',
  providers: [AppService]
})
export class ColorBoxComponent implements OnInit, OnDestroy{
  @ViewChild('op') overlayPanel; 
   @Input() header:     string = 'Header';
   @Input() boxStyle:   string = 'colorbox-1';
   @Input() popupStyle: string = 'green-panel';
   @Input() popupWidth: string = '40%';
   @Input() icon:       string;
   @Input() model:      Map<string, string>;

   index: number = 0;
   metric: string = null;
   metricValue: string;

   popupWidthStr: string = '{\'width\':\'40%\'}';

   constructor(private appService: AppService) {
     this.appService.closeOverLayPanel.subscribe((value) => {
      if (value){
        this.overlayPanel.hide();
      }
     });
    }

   ngOnInit(){
    // //US6475: Attach the # of Sites and Competitors; nallana
    // this.appService.updateColorBoxValue.subscribe((data) => {
    //   const modelvalue = this.model;
    //   const plottedData = data;
    //   if (plottedData.type === 'Competitors'){
    //     modelvalue.set('# of Competitors', (plottedData.countCompetitors).toString());
    //   }else{
    //     const count = + modelvalue.get('# of Sites');
    //     const sitesCount = (count + plottedData.countSites).toString();
    //     modelvalue.set('# of Sites', sitesCount);
    //   }
    //   this.generateColorBoxValues();
    //  });
     this.generateColorBoxValues();
   }

   private generateColorBoxValues(){
    this.popupWidthStr = '{\'width\':\'' + this.popupWidth + '\'}';
    const keys = Array.from(this.model.keys());
    const vals = Array.from(this.model.values());

    this.index = 0;
    this.metric = keys[this.index];
    this.metricValue = vals[this.index];
   }
   ngOnDestroy(){
   }

   public updateModel(model: Map<string, string>) {
     this.model = model;
     const keys = Array.from(this.model.keys());
     const vals = Array.from(this.model.values());
     this.metric = keys[this.index];
     this.metricValue = vals[this.index];
   }

   // Model methods that update the UI
   public set(key: string, value: string){
      this.model.set(key, value);
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

      const keys = Array.from(this.model.keys());
      const vals = Array.from(this.model.values());

      console.log('0 - ' + keys[0] + ' = ' + vals[0]);

      if (direction === 'Up'){  
         if (this.model != null){
            this.index--;
            if (this.index < 0) {
               this.index = keys.length - 1;
            }
         }
      }else{
         if (this.model != null){
            this.index++;
            if (this.index >= keys.length) {
               this.index = 0;
            }
         }
      }
      this.metric = keys[this.index];
      this.metricValue = vals[this.index];
   }
}
