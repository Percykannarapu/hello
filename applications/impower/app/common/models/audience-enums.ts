export enum OnlineSourceTypes {
  InMarket = 'In-Market',
  Interest = 'Interest',
  VLH = 'VLH',
  Pixel = 'Pixel'
}

export const OnlineSourceNames = {
  [OnlineSourceTypes.InMarket]: 'in_market',
  [OnlineSourceTypes.Interest]: 'interest',
  [OnlineSourceTypes.VLH]: 'vlh',
  [OnlineSourceTypes.Pixel]: 'pixel'
};
