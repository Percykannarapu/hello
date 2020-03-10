/* tslint:disable:max-line-length */
import { FillPattern, RgbTuple } from './esri-types';

// these are the only palettes used in the application for now
export enum ColorPalette {
  BrightColors = '6 Bright Colors',
  SixDarkColors = '6 Dark Colors',
  CpqMaps = '20 Colors',
  BiVariateRedBlue3 = '6 Bivariate Red-Blue',
  Blue = 'Gradient - Blue',
  Red = 'Gradient - Red',
  Orange = 'Gradient - Orange',
  EsriPurple = 'Gradient - Purple',
  CrossHatching = '6 Cross Hatching'
}

enum AllColorPalettes {
  Random = 'Random',
  CrossHatching = '6 Cross Hatching',
  CpqMaps = '20 Colors',
  Lightyellow = '1 Light yellow',
  Lightblue = '1 Light blue',
  Lightgreen = '1 Light green',
  Lightred = '1 Light red',
  Twoblues = '2 Blue',
  Greenblue = '2 Green Blue',
  Twogreens = '2 Green',
  Twopeaches = '2 Peach',
  Tworeds = '2 Red',
  Greenyellow = '2 Green Yellow',
  Twoyellows = '2 Yellow',
  Yellowred = '2 Yellow Red',
  Bluegreenyellowred = '4 Blue,Green,Yellow,Red',
  Bivariatebluered = '4 Bivariate Blue-Red',
  Bivariategreenyellow = '4 Bivariate Green-Yellow',
  Bivariateredblue = '4 Bivariate Red-Blue',
  Bivariateyellowgreen = '4 Bivariate Yellow-Green',
  Fourblues = '4 Blue',
  Fourreds = '4 Red',
  Fourgreens = '4 Green',
  Fouroranges = '4 Orange',
  Advantagelighter = '4 Advantage-Lighter',
  Advantagedarker = '4 Advantage-Darker',
  Fourbrightcolors = '4 Bright Colors',
  Redyellowgreen = 'Red Yellow Green',
  Fourgreens2 = '3 Green',
  Fourblues2 = '3 Blue',
  Fourbrightcolors2 = '3 Bright Colors',
  Peach = '3 Peach',
  Fourreds2 = '3 Red',
  Bluegreenyellow = 'Blue Green Yellow',
  Redorangeyellow = 'Red Orange Yellow',
  Advantagelighter2 = '5 Advantage-Lighter',
  Advantagedarker2 = '5 Advantage-Darker',
  Bivariatebluered2 = '5 Bivariate Blue-Red',
  Bivariateredblue2 = '5 Bivariate Red-Blue',
  Bivariategreenyellow2 = '5 Bivariate Green-Yellow',
  Bivariateyellowgreen2 = '5 Bivariate Yellow-Green',
  Fivegreens = '5 Green',
  Fiveblues = '5 Blue',
  Fiveoranges = '5 Orange',
  Fivereds = '5 Red',
  Pastelshades = '5 Pastel Shades',
  Brightcolors2 = '5 Bright Colors',
  Advantagelighter3 = '6 Advantage-Lighter',
  Advantagedarker3 = '6 Advantage-Darker',
  Bivariatebluered3 = '6 Bivariate Blue-Red',
  BiVariateRedBlue3 = '6 Bivariate Red-Blue',
  Bivariategreenyellow3 = '6 Bivariate Green-Yellow',
  Bivariateyellowgreen3 = '6 Bivariate Yellow-Green',
  Green = '6 Green',
  Blue = 'Gradient - Blue',
  Orange = 'Gradient - Orange',
  Red = 'Gradient - Red',
  Pastelshades3 = '6 Pastel Shades',
  BrightColors = '6 Bright Colors',
  SixDarkColors = '6 Dark Colors',
  Valassisrange3color = 'Valassis Range - 3 color',
  Valassisrange4color = 'Valassis Range - 4 color',
  Valassisrank4color = 'Valassis Rank - 4 color',
  Mediaexpressthematic = 'Media Express thematic',
  Pastelshades4 = '20 Pastel Shades #1',
  Pastelshades5 = '20 Pastel Shades #2',
  Lightcolors1 = '20 Light Colors #1',
  Bluetored = '20 Blue to Red',
  Lightcolors2 = '20 Light Colors #2',
  Darkcolors = '20 Dark Colors',
  EsriPurple = 'Gradient - Purple',
}

export function getColorPalette(palette: ColorPalette, reverse: boolean) : RgbTuple[] {
  const currentPalette = getAllColorPalettes(palette);
  const result = currentPalette == null ? null : [ ...currentPalette ];
  if (reverse && result != null) {
    result.reverse();
  }
  return result;
}

export function getFillPalette(palette: ColorPalette, reverse: boolean) : FillPattern[] {
  let result: FillPattern[] = [ ...solidOnlyPalette ];
  if (palette === ColorPalette.CrossHatching) {
    result = [ ...crossHatchPalette ];
  }
  if (reverse) {
    result.reverse();
  }
  return result;
}

function getAllColorPalettes(palette: string) : RgbTuple[] {
  switch (palette) {
    case AllColorPalettes.Random:
      return null; // Special case
    case AllColorPalettes.CrossHatching:
      return onlyBlack;
    case AllColorPalettes.CpqMaps:
      return cpqmaps;
    case AllColorPalettes.Lightyellow:
      return LightYellow;
    case AllColorPalettes.Lightblue:
      return LightBlue;
    case AllColorPalettes.Lightgreen:
      return LightGreen;
    case AllColorPalettes.Lightred:
      return LightRed;
    case AllColorPalettes.Twoblues:
      return TwoBlues;
    case AllColorPalettes.Greenblue:
      return GreenBlue;
    case AllColorPalettes.Twogreens:
      return TwoGreens;
    case AllColorPalettes.Twopeaches:
      return TwoPeaches;
    case AllColorPalettes.Tworeds:
      return TwoReds;
    case AllColorPalettes.Greenyellow:
      return GreenYellow;
    case AllColorPalettes.Twoyellows:
      return TwoYellows;
    case AllColorPalettes.Yellowred:
      return YellowRed;
    case AllColorPalettes.Bluegreenyellowred:
      return BlueGreenYellowRed;
    case AllColorPalettes.Bivariatebluered:
      return BivariateBlueRed;
    case AllColorPalettes.Bivariategreenyellow:
      return BivariateGreenYellow;
    case AllColorPalettes.Bivariateredblue:
      return BivariateRedBlue;
    case AllColorPalettes.Bivariateyellowgreen:
      return BivariateYellowGreen;
    case AllColorPalettes.Fourblues:
      return FourBlues;
    case AllColorPalettes.Fourreds:
      return FourReds;
    case AllColorPalettes.Fourgreens:
      return FourGreens;
    case AllColorPalettes.Fouroranges:
      return FourOranges;
    case AllColorPalettes.Advantagelighter:
      return AdvantageLighter;
    case AllColorPalettes.Advantagedarker:
      return AdvantageDarker;
    case AllColorPalettes.Fourbrightcolors:
      return FourBrightColors;
    case AllColorPalettes.Redyellowgreen:
      return RedYellowGreen;
    case AllColorPalettes.Fourgreens2:
      return FourdGreens;
    case AllColorPalettes.Fourblues2:
      return FourBlues2;
    case AllColorPalettes.Fourbrightcolors2:
      return FourBrightColors2;
    case AllColorPalettes.Peach:
      return Peach;
    case AllColorPalettes.Fourreds2:
      return FourReds2;
    case AllColorPalettes.Bluegreenyellow:
      return BlueGreenYellow;
    case AllColorPalettes.Redorangeyellow:
      return RedOrangeYellow;
    case AllColorPalettes.Advantagelighter2:
      return AdvantageLighter2;
    case AllColorPalettes.Advantagedarker2:
      return AdvantageDarker2;
    case AllColorPalettes.Bivariatebluered2:
      return BivariateBlueRed2;
    case AllColorPalettes.Bivariateredblue2:
      return BivariateRedBlue2;
    case AllColorPalettes.Bivariategreenyellow2:
      return BivariateGreenYellow2;
    case AllColorPalettes.Bivariateyellowgreen2:
      return BivariateYellowGreen2;
    case AllColorPalettes.Fivegreens:
      return FiveGreens;
    case AllColorPalettes.Fiveblues:
      return FiveBlues;
    case AllColorPalettes.Fiveoranges:
      return FiveOranges;
    case AllColorPalettes.Fivereds:
      return FiveReds;
    case AllColorPalettes.Pastelshades:
      return PastelShades;
    case AllColorPalettes.Brightcolors2:
      return BrightColors2;
    case AllColorPalettes.Advantagelighter3:
      return AdvantageLighter3;
    case AllColorPalettes.Advantagedarker3:
      return AdvantageDarker3;
    case AllColorPalettes.Bivariatebluered3:
      return BivariateBlueRed3;
    case AllColorPalettes.BiVariateRedBlue3:
      return BivariateRedBlue3;
    case AllColorPalettes.Bivariategreenyellow3:
      return BivariateGreenYellow3;
    case AllColorPalettes.Bivariateyellowgreen3:
      return BivariateYellowGreen3;
    case AllColorPalettes.Green:
      return Green;
    case AllColorPalettes.Blue:
      return Blue;
    case AllColorPalettes.Orange:
      return Orange;
    case AllColorPalettes.Red:
      return Red;
    case AllColorPalettes.Pastelshades3:
      return PastelShades3;
    case AllColorPalettes.BrightColors:
      return BrightColors;
    case AllColorPalettes.SixDarkColors:
      return SixDarkColors;
    case AllColorPalettes.Valassisrange3color:
      return ValassisRange3color;
    case AllColorPalettes.Valassisrange4color:
      return ValassisRange4color;
    case AllColorPalettes.Valassisrank4color:
      return ValassisRank4color;
    case AllColorPalettes.Mediaexpressthematic:
      return MediaExpressThematic;
    case AllColorPalettes.Pastelshades4:
      return PastelShades4;
    case AllColorPalettes.Pastelshades5:
      return PastelShades5;
    case AllColorPalettes.Lightcolors1:
      return LightColors1;
    case AllColorPalettes.Bluetored:
      return BluetoRed;
    case AllColorPalettes.Lightcolors2:
      return LightColors2;
    case AllColorPalettes.Darkcolors:
      return DarkColors;
    case AllColorPalettes.EsriPurple:
      return esriPurple;
    default:
      return null;
  }
}

const crossHatchPalette: FillPattern[] = ['backward-diagonal', 'forward-diagonal', 'vertical', 'horizontal', 'diagonal-cross', 'cross'];
const solidOnlyPalette: FillPattern[] = ['solid'];

const onlyBlack: RgbTuple[] = [[0, 0, 0]];
const LightYellow: RgbTuple[] = [[255, 255, 150]];
const LightBlue: RgbTuple[] = [[100, 255, 255]];
const LightGreen: RgbTuple[] = [[150, 255, 150]];
const LightRed: RgbTuple[] = [[255, 175, 175]];
const TwoBlues: RgbTuple[] = [[50, 255, 255], [165, 240, 255]];
const GreenBlue: RgbTuple[] = [[165, 255, 200], [185, 235, 255]];
const TwoGreens: RgbTuple[] = [[90, 230, 150], [200, 255, 200]];
const TwoPeaches: RgbTuple[] = [[255, 215, 120], [255, 230, 185]];
const TwoReds: RgbTuple[] = [[255, 150, 150], [255, 200, 200]];
const GreenYellow: RgbTuple[] = [[185, 255, 195], [255, 255, 185]];
const TwoYellows: RgbTuple[] = [[255, 255, 120], [255, 255, 175]];
const YellowRed: RgbTuple[] = [[255, 255, 160], [255, 195, 200]];
const BlueGreenYellowRed: RgbTuple[] = [[150, 225, 255], [200, 255, 215], [255, 255, 175], [255, 190, 200]];
const BivariateBlueRed: RgbTuple[] = [[125, 175, 255], [180, 240, 255], [255, 210, 215], [255, 165, 175]];
const BivariateGreenYellow: RgbTuple[] = [[110, 220, 110], [150, 255, 150], [255, 255, 200], [255, 255, 150]];
const BivariateRedBlue: RgbTuple[] = [[255, 165, 175], [255, 210, 215], [180, 240, 255], [125, 175, 255]];
const BivariateYellowGreen: RgbTuple[] = [[255, 255, 150], [255, 255, 200], [150, 255, 150], [110, 220, 110]];
const FourBlues: RgbTuple[] = [[0, 150, 255], [100, 200, 255], [0, 255, 255], [150, 255, 255]];
const FourReds: RgbTuple[] = [[255, 85, 100], [255, 130, 130], [255, 150, 150], [255, 190, 190]];
const FourGreens: RgbTuple[] = [[0, 175, 50], [50, 225, 50], [150, 255, 100], [200, 255, 150]];
const FourOranges: RgbTuple[] = [[255, 185, 0], [255, 210, 110], [255, 200, 150], [255, 225, 200]];
const AdvantageLighter: RgbTuple[] = [[170, 250, 255], [170, 255, 181], [250, 255, 170], [255, 200, 200]];
const AdvantageDarker: RgbTuple[] = [[130, 130, 255], [125, 255, 130], [250, 255, 132], [255, 130, 130]];
const FourBrightColors: RgbTuple[] = [[255, 255, 0], [0, 150, 255], [0, 255, 0], [255, 125, 255]];
const RedYellowGreen: RgbTuple[] = [[255, 185, 185], [255, 255, 175], [190, 255, 190]];
const FourdGreens: RgbTuple[] = [[90, 255, 150], [180, 255, 190], [220, 255, 195]];
const FourBlues2: RgbTuple[] = [[100, 200, 255], [140, 240, 255], [190, 255, 255]];
const FourBrightColors2: RgbTuple[] = [[255, 255, 0], [50, 200, 255], [255, 125, 220]];
const Peach: RgbTuple[] = [[255, 210, 60], [255, 225, 150], [255, 230, 200]];
const FourReds2: RgbTuple[] = [[255, 125, 125], [255, 175, 175], [255, 210, 210]];
const BlueGreenYellow: RgbTuple[] = [[130, 230, 255], [160, 255, 170], [255, 255, 175]];
const RedOrangeYellow: RgbTuple[] = [[255, 170, 170], [255, 210, 150], [255, 250, 150]];
const AdvantageLighter2: RgbTuple[] = [[172, 252, 255], [170, 255, 180], [255, 255, 185], [255, 200, 150], [255, 200, 200]];
const AdvantageDarker2: RgbTuple[] = [[100, 150, 255], [125, 255, 125], [250, 255, 130], [255, 210, 50], [255, 130, 120]];
const BivariateBlueRed2: RgbTuple[] = [[125, 175, 255], [180, 240, 255], [255, 210, 215], [255, 165, 175], [255, 105, 135]];
const BivariateRedBlue2: RgbTuple[] = [[255, 165, 175], [255, 210, 215], [180, 240, 255], [125, 175, 255], [0, 125, 225]];
const BivariateGreenYellow2: RgbTuple[] = [[110, 220, 110], [150, 255, 150], [255, 255, 200], [255, 255, 150], [255, 255, 0]];
const BivariateYellowGreen2: RgbTuple[] = [[255, 255, 150], [255, 255, 200], [150, 255, 150], [110, 220, 110], [50, 175, 50]];
const FiveGreens: RgbTuple[] = [[0, 175, 50], [50, 225, 50], [150, 255, 100], [200, 255, 150], [200, 255, 200]];
const FiveBlues: RgbTuple[] = [[0, 150, 255], [100, 200, 255], [0, 255, 255], [150, 255, 255], [200, 255, 255]];
const FiveOranges: RgbTuple[] = [[255, 185, 0], [255, 210, 110], [255, 200, 150], [255, 225, 200], [255, 240, 200]];
const FiveReds: RgbTuple[] = [[255, 85, 100], [255, 130, 130], [255, 150, 150], [255, 190, 190], [255, 230, 230]];
const PastelShades: RgbTuple[] = [[255, 190, 230], [155, 215, 255], [255, 255, 150], [255, 210, 170], [200, 255, 175]];
const BrightColors2: RgbTuple[] = [[255, 255, 0], [255, 125, 255], [0, 150, 255], [0, 255, 0], [255, 190, 50]];
const AdvantageLighter3: RgbTuple[] = [[185, 215, 255], [172, 252, 255], [170, 255, 180], [255, 255, 185], [255, 200, 150], [255, 200, 200]];
const AdvantageDarker3: RgbTuple[] = [[200, 125, 255], [100, 150, 255], [125, 255, 125], [250, 255, 130], [255, 210, 50], [255, 130, 120]];
const BivariateBlueRed3: RgbTuple[] = [[0, 125, 225], [125, 175, 255], [180, 240, 255], [255, 210, 215], [255, 165, 175], [255, 105, 135]];
const BivariateRedBlue3: RgbTuple[] = [[0, 125, 225], [125, 175, 255], [180, 240, 255], [255, 210, 215], [255, 165, 175], [255, 105, 135]];
// const BivariateRedBlue3: RgbTuple[] = [[255, 105, 135], [255, 165, 175], [255, 210, 215], [180, 240, 255], [125, 175, 255], [0, 125, 225]];
const BivariateGreenYellow3: RgbTuple[] = [[50, 175, 50], [110, 220, 110], [150, 255, 150], [255, 255, 200], [255, 255, 150], [255, 255, 0]];
const BivariateYellowGreen3: RgbTuple[] = [[255, 255, 0], [255, 255, 150], [255, 255, 200], [150, 255, 150], [110, 220, 110], [50, 175, 50]];
const Green: RgbTuple[] = [[0, 110, 50], [0, 175, 50], [50, 225, 50], [150, 255, 100], [200, 255, 150], [200, 255, 200]];
const Blue: RgbTuple[] = [[200, 255, 255], [150, 255, 255], [0, 255, 255], [100, 200, 255], [0, 150, 255], [0, 75, 255]];
const Orange: RgbTuple[] = [[255, 240, 200], [255, 225, 200], [255, 200, 150], [255, 210, 110], [255, 185, 0], [255, 165, 50]];
const Red: RgbTuple[] = [[255, 230, 230], [255, 190, 190], [255, 150, 150], [255, 130, 130], [255, 85, 100], [255, 50, 50]];
const PastelShades3: RgbTuple[] = [[255, 190, 230], [155, 215, 255], [200, 255, 175], [255, 210, 170], [255, 255, 150], [200, 200, 255]];
const BrightColors: RgbTuple[] = [[255, 255, 0], [255, 125, 225], [0, 150, 255], [0, 255, 0], [200, 75, 220], [255, 190, 50]];
const ValassisRange3color: RgbTuple[] = [[254, 242, 102], [255, 176, 16], [237, 23, 31]];
const ValassisRange4color: RgbTuple[] = [[255, 255, 208], [254, 242, 102], [255, 176, 16], [237, 23, 31]];
const ValassisRank4color: RgbTuple[] = [[84, 116, 169], [158, 189, 13], [255, 176, 16], [237, 23, 31]];
const MediaExpressThematic: RgbTuple[] = [[180, 39, 55], [248, 115, 7], [158, 189, 13], [84, 116, 169], [255, 176, 16], [153, 102, 153], [64, 128, 128], [160, 39, 75], [105, 209, 231], [81, 115, 71], [254, 242, 102], [190, 215, 141], [208, 224, 255]];
const PastelShades4: RgbTuple[] = [[255, 190, 232], [156, 218, 255], [202, 255, 177], [255, 204, 201], [198, 196, 255], [184, 255, 255], [175, 198, 164], [245, 243, 161], [255, 155, 157], [77, 219, 255], [255, 251, 199], [171, 255, 229], [247, 214, 255], [255, 226, 214], [255, 207, 114], [177, 186, 255], [255, 185, 203], [112, 255, 202], [245, 255, 211], [196, 226, 255]];
const PastelShades5: RgbTuple[] = [[255, 190, 232], [202, 255, 177], [156, 218, 255], [255, 181, 173], [189, 182, 255], [184, 255, 255], [170, 198, 154], [245, 244, 131], [255, 119, 134], [77, 219, 255], [244, 187, 255], [197, 255, 222], [166, 200, 255], [255, 220, 139], [207, 209, 255], [181, 255, 251], [128, 185, 133], [255, 255, 179], [237, 94, 97], [121, 189, 223]];
const LightColors1: RgbTuple[] = [[0, 255, 255], [202, 255, 177], [156, 218, 255], [255, 181, 173], [189, 182, 255], [128, 255, 255], [170, 198, 154], [245, 244, 131], [255, 119, 134], [77, 219, 255], [255, 187, 255], [227, 255, 232], [87, 103, 255], [255, 220, 139], [205, 209, 255], [0, 128, 128], [128, 185, 133], [255, 255, 179], [237, 94, 97], [121, 189, 223]];
const BluetoRed: RgbTuple[] = [[0, 0, 255], [0, 51, 255], [0, 101, 255], [0, 153, 255], [0, 204, 255], [0, 255, 255], [0, 255, 204], [0, 255, 153], [0, 255, 102], [0, 255, 51], [0, 255, 0], [51, 255, 0], [153, 255, 0], [204, 255, 0], [255, 255, 0], [255, 204, 0], [255, 153, 0], [255, 102, 0], [255, 51, 0], [255, 0, 0]];
const LightColors2: RgbTuple[] = [[128, 255, 75], [255, 215, 185], [246, 255, 187], [196, 255, 176], [179, 255, 231], [202, 207, 255], [244, 208, 255], [255, 191, 196], [229, 255, 96], [75, 198, 255], [195, 196, 255], [85, 255, 176], [251, 255, 125], [255, 171, 131], [255, 215, 112], [255, 192, 228], [255, 247, 157], [198, 255, 251], [255, 228, 60], [255, 143, 136]];
const DarkColors: RgbTuple[] = [[235, 131, 235], [169, 209, 175], [173, 158, 208], [253, 254, 171], [234, 145, 157], [127, 245, 247], [255, 203, 223], [245, 180, 151], [177, 218, 220], [128, 135, 254], [187, 255, 207], [217, 178, 234], [255, 125, 133], [249, 255, 121], [94, 205, 214], [255, 224, 215], [213, 255, 167], [215, 175, 255], [255, 227, 160], [255, 132, 170]];
const cpqmaps: RgbTuple[] = [[108, 139, 202], [211, 114, 149], [255, 255, 102], [134, 188, 182], [255, 167, 79], [170, 113, 213], [250, 191, 210], [160, 205, 232], [242, 142, 43], [89, 161, 79], [157, 118, 96], [92, 154, 254], [241, 206, 99], [140, 209, 125], [255, 157, 154], [186, 176, 172], [73, 152, 148], [212, 166, 200], [225, 87, 89], [182, 153, 45]];
const esriPurple: RgbTuple[] = [[255, 252, 212], [231, 174, 157], [206, 96, 101], [136, 49, 79], [66, 2, 57]];
const SixDarkColors: RgbTuple[] = [[114, 175, 216], [165, 219, 85], [241, 159, 39], [218, 49, 69], [200, 125, 255], [250, 255, 130]];
