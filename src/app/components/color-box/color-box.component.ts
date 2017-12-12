import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'val-color-box',
  templateUrl: './color-box.component.html',
})
export class ColorBoxComponent implements OnInit, OnDestroy
{
   @Input() boxStyle:   string = 'colorbox-1';
   @Input() popupStyle: string = 'green-panel';
   @Input() popupWidth: string = '40%';
   @Input() icon:       string;
   @Input() model:      Map<string, string>;

   index: number = 0;
   metric: string = null;
   metricValue: string;

   popupWidthStr: string = '{\'width\':\'40%\'}';

   constructor() { }

   ngOnInit()
   {
      this.popupWidthStr = '{\'width\':\'' + this.popupWidth + '\'}';
      const keys = Array.from(this.model.keys());
      const vals = Array.from(this.model.values());

      this.index = 0;
      this.metric = keys[this.index];
      this.metricValue = vals[this.index];
   }

   ngOnDestroy()
   {
   }
 
   onClick(direction: string)
   {
      if (this.model == null) {
         console.log('model is null'); 
      }

      const keys = Array.from(this.model.keys());
      const vals = Array.from(this.model.values());

      console.log('0 - ' + keys[0] + ' = ' + vals[0]);

      if (direction === 'Up')
      {  
         if (this.model != null)
         {
            this.index--;
            if (this.index < 0) {
               this.index = keys.length - 1;
            }
         }
      }
      else
      {
         if (this.model != null)
         {
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
