export class TradeAreaUIModel {
  tradeArea?: number;
  isShowing: boolean;
  isValid?: boolean;

  constructor(private maxRadius: number){}

  get layerName() : string {
    if (this.tradeArea != null) {
      return `${this.tradeArea} Mile Trade Area`;
    }
  }

  get tradeAreaInKm() : number {
    return this.tradeArea / 0.62137;
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
