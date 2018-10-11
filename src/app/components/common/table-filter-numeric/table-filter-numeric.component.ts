import { Component, OnInit, Input, ViewChild, EventEmitter, Output } from '@angular/core';
import { roundTo } from '../../../val-modules/common/common.utils';
import { OverlayPanel } from 'primeng/primeng';

export interface RangeOperator {
   name: string;
   code: string;
}

export class FilterData {
   rangeOperator: RangeOperator;
   lowValue:      number;
   highValue:     number;
   minValue:      number;
   maxValue:      number;

   public static numericFilter (compareValue, filter, precision = null): boolean
   {
      let result: boolean = true;
      
      // Enforce precision if provided
      let value: number = (precision != null) ? roundTo(compareValue, precision): compareValue;

      switch (filter.rangeOperator.code) {
         case "between":
            result = value >= filter.lowValue && value <= filter.highValue;
            break;

         case ">=":
            result = value >= filter.lowValue;
            break;

         case "<=":
            result = value <= filter.lowValue;
            break;

         case ">":
            result = value >  filter.lowValue;
            break;

         case "<":
            result = value <  filter.lowValue;
            break;

         // Unknown operator, perform no filtering
         default:
            result = true;
            break;
      }
      //console.debug("numericFilter - compareValue: ", compareValue, ", filter: ", filter, " returning ", result);
      return result;   
   }   
}

@Component({
  selector: 'val-table-filter-numeric',
  templateUrl: './table-filter-numeric.component.html',
  styleUrls: ['./table-filter-numeric.component.css']
})
export class TableFilterNumericComponent implements OnInit {
   @Input()  fieldHeader: string;
   @Input()  fieldName: string;
   @Input()  minValue: number;
   @Input()  maxValue: number;
   @Output() filterApplied = new EventEmitter<FilterData>();

   public  rangeStr: string = "All";
   public  rangeLbl: string = "All";
   public  rangeOperators: RangeOperator[] = [{name: 'Between', code: 'between'}, {name: '>=', code: '>='}, {name: '<=', code: '<='}, {name: '>', code: '>'}, {name: '<', code: '<'}];
   public  filterData: FilterData = { rangeOperator: this.rangeOperators[0], lowValue: this.minValue, highValue: this.maxValue, minValue: this.minValue, maxValue: this.maxValue };

   // -------------------------------------------------------------------------
   // Lifecycle Methods
   // -------------------------------------------------------------------------

   constructor() { }

   ngOnInit() {
      // this.filterData.lowValue = this.minValue;
      // this.filterData.highValue = this.maxValue;
      if (this.fieldHeader == null)
         this.fieldHeader = this.fieldName;
   }

   // -------------------------------------------------------------------------
   // Utility Methods
   // -------------------------------------------------------------------------
   private updateAndValidate() {
      // Default low/high if null
      if (this.filterData.lowValue == null)
         this.filterData.lowValue = this.minValue;
      
      if (this.filterData.highValue == null)
         this.filterData.highValue = this.maxValue;

      // Update min/max values (Just to carry them with the event)
      this.filterData.minValue = this.minValue;
      this.filterData.maxValue = this.maxValue;

      // Enforce range boundaries
      if (this.filterData.lowValue == null || this.filterData.lowValue < this.filterData.minValue)
         this.filterData.lowValue = this.filterData.minValue;
      else
         if (this.filterData.lowValue > this.filterData.maxValue)
            this.filterData.lowValue = this.filterData.maxValue;
      
      if (this.filterData.highValue == null || this.filterData.highValue > this.filterData.maxValue)
         this.filterData.highValue = this.filterData.maxValue;
      else
         if (this.filterData.highValue < this.filterData.minValue)
            this.filterData.highValue = this.filterData.minValue;

      //console.debug("onChange - filterData: rangeOperator: ", this.filterData.rangeOperator.code, ", lowValue: ", this.filterData.lowValue, ", highValue: ", this.filterData.highValue, ", minValue: ", this.filterData.minValue, ", maxValue: ", this.filterData.maxValue);
      this.setFilterStr();
   }

   private setFilterStr() {
      // All rangeStrs are set the same except for between
      if (this.filterData.rangeOperator.code === "between")
      {
         if (this.filterData.lowValue === this.filterData.minValue && this.filterData.highValue === this.filterData.maxValue)
            this.rangeStr = "All";
         else
            this.rangeStr = this.filterData.rangeOperator.name + " " + this.filterData.lowValue + " and " + this.filterData.highValue;
      }
      else
         this.rangeStr = this.filterData.rangeOperator.name + " " + this.filterData.lowValue;

      this.rangeLbl = (this.rangeStr === "All") ? "All" : this.filterData.rangeOperator.name;
   }

   public clearFilter(filterName: string = "") {
      // Clear out either an individual filter or all of them
      if (filterName === "" || filterName === "all" || filterName === "rangeOperator")
         this.filterData.rangeOperator = this.rangeOperators[0];

      if (filterName === "" || filterName === "all" || filterName === "min")
         this.filterData.lowValue = this.filterData.minValue;

      if (filterName === "" || filterName === "all" || filterName === "max")
         this.filterData.highValue = this.filterData.maxValue;

      // Update everything
      this.onChange('rangeOperator', null);
   }

   // -------------------------------------------------------------------------
   // Event Handler Methods
   // -------------------------------------------------------------------------
   onShow() {
      this.updateAndValidate();
   }

   onChange(fieldName: string, event: Event)
   {
      this.updateAndValidate();

      // Emit the changed filter event
      this.filterApplied.emit(this.filterData);
   }

  onClick(filterOP: OverlayPanel, event: any, filterTarget: any) : void {
     event.stopPropagation();
     filterOP.show(event, filterTarget);
  }
}
