import { ImpGeofootprintTradeArea } from '../../val-modules/targeting/models/ImpGeofootprintTradeArea';

export class TradeAreaUIModel {
  tradeArea?: number;
  isShowing: boolean;
  isValid?: boolean;

  validationMessage: string;

  constructor(private maxRadius: number) {
    this.validationMessage = `Trade area must be > 0 and <= ${this.maxRadius} miles`;
  }

  get layerName() : string {
    if (this.tradeArea != null) {
      return `${this.tradeArea} Mile Trade Area`;
    }
  }

  get tradeAreaInKm() : number {
    return this.tradeArea / 0.62137;
  }

  applyDatastoreInstance(data: ImpGeofootprintTradeArea) : void {
    if (data != null) {
      this.tradeArea = data.taRadius;
      this.isShowing = data.isActive;
      this.isValid = true;
    }
  }

  validate(input: string) : void {
    console.log('Model Validate event value: ', input);
    if (input == null || input === '' || Number.isNaN(Number(input))) {
      this.tradeArea = null;
      this.isValid = null;
      this.isShowing = false;
    } else {
      this.tradeArea = Number(input);
      this.isValid = this.tradeArea > 0 && this.tradeArea <= this.maxRadius;
      this.isShowing = this.isValid;
    }
  }
}
