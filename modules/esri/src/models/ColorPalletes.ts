/* tslint:disable:max-line-length */
export enum ColorPallete {
   Random = 'Random',
   Cpqmaps = 'Cpq Maps',
   Lightyellow = 'Light yellow',
   Lightblue = 'Light blue',
   Lightgreen = 'Light green',
   Lightred = 'Light red',
   Twoblues = 'Two blues',
   Greenblue = 'Green blue',
   Twogreens = 'Two greens',
   Twopeaches = 'Two peaches',
   Tworeds = 'Two reds',
   Greenyellow = 'Green yellow',
   Twoyellows = 'Two yellows',
   Yellowred = 'Yellow red',
   Bluegreenyellowred = 'Blue green yellow red',
   Bivariatebluered = 'Bi-variate blue red',
   Bivariategreenyellow = 'Bi-variate green yellow',
   Bivariateredblue = 'Bi-variate red blue',
   Bivariateyellowgreen = 'Bi-variate yellow green',
   Fourblues = 'Four blues',
   Fourreds = 'Four reds',
   Fourgreens = 'Four greens',
   Fouroranges = 'Four oranges',
   Advantagelighter = 'Advantage lighter',
   Advantagedarker = 'Advantage darker',
   Fourbrightcolors = 'Four bright colors',
   Redyellowgreen = 'Red yellow green',
   Fourgreens2 = 'Four greens 2',
   Fourblues2 = 'Four blues 2',
   Fourbrightcolors2 = 'Four bright colors 2',
   Peach = 'Peach',
   Fourreds2 = 'Four reds 2',
   Bluegreenyellow = 'Blue green yellow',
   Redorangeyellow = 'Red orange yellow',
   Advantagelighter2 = 'Advantage lighter 2',
   Advantagedarker2 = 'Advantage darker 2',
   Bivariatebluered2 = 'Bi-variate blue red 2',
   Bivariateredblue2 = 'Bi-variate red blue 2',
   Bivariategreenyellow2 = 'Bi-variate green yellow 2',
   Bivariateyellowgreen2 = 'Bi-variate yellow green 2',
   Fivegreens = 'Five greens',
   Fiveblues = 'Five blues',
   Fiveoranges = 'Five oranges',
   Fivereds = 'Five reds',
   Pastelshades = 'Pastel shades',
   Brightcolors2 = 'Bright colors 2',
   Advantagelighter3 = 'Advantage lighter 3',
   Advantagedarker3 = 'Advantage darker 3',
   Bivariatebluered3 = 'Bi-variate blue red 3',
   Bivariateredblue3 = 'Bi-variate red blue 3',
   Bivariategreenyellow3 = 'Bi-variate green yellow 3',
   Bivariateyellowgreen3 = 'Bi-variate yellow green 3',
   Green = 'Green',
   Blue = 'Blue',
   Orange = 'Orange',
   Red = 'Red',
   Pastelshades3 = 'Pastel shades 3',
   Brightcolors = 'Bright colors',
   Valassisrange3color = 'Valassis range 3 color',
   Valassisrange4color = 'Valassis range 4 color',
   Valassisrank4color = 'Valassis rank 4 color',
   Mediaexpressthematic = 'Media Express thematic',
   Pastelshades4 = 'Pastel shades 4',
   Pastelshades5 = 'Pastel shades 5',
   Lightcolors1 = 'Light colors 1',
   Bluetored = 'Blue to red',
   Lightcolors2 = 'Light colors 2',
   Darkcolors = 'Dark colors'
}

export function getColorPallete(pallete: ColorPallete) : number[][] {
   switch (pallete) {
      case ColorPallete.Random:
         return null; // Special case
      case ColorPallete.Cpqmaps:
         return cpqmaps;
      case ColorPallete.Lightyellow:
         return LightYellow;
      case ColorPallete.Lightblue:
         return LightBlue;
      case ColorPallete.Lightgreen:
         return LightGreen;
      case ColorPallete.Lightred:
         return LightRed;
      case ColorPallete.Twoblues:
         return TwoBlues;
      case ColorPallete.Greenblue:
         return GreenBlue;
      case ColorPallete.Twogreens:
         return TwoGreens;
      case ColorPallete.Twopeaches:
         return TwoPeaches;
      case ColorPallete.Tworeds:
         return TwoReds;
      case ColorPallete.Greenyellow:
         return GreenYellow;
      case ColorPallete.Twoyellows:
         return TwoYellows;
      case ColorPallete.Yellowred:
         return YellowRed;
      case ColorPallete.Bluegreenyellowred:
         return BlueGreenYellowRed;
      case ColorPallete.Bivariatebluered:
         return BivariateBlueRed;
      case ColorPallete.Bivariategreenyellow:
         return BivariateGreenYellow;
      case ColorPallete.Bivariateredblue:
         return BivariateRedBlue;
      case ColorPallete.Bivariateyellowgreen:
         return BivariateYellowGreen;
      case ColorPallete.Fourblues:
         return FourBlues;
      case ColorPallete.Fourreds:
         return FourReds;
      case ColorPallete.Fourgreens:
         return FourGreens;
      case ColorPallete.Fouroranges:
         return FourOranges;
      case ColorPallete.Advantagelighter:
         return AdvantageLighter;
      case ColorPallete.Advantagedarker:
         return AdvantageDarker;
      case ColorPallete.Fourbrightcolors:
         return FourBrightColors;
      case ColorPallete.Redyellowgreen:
         return RedYellowGreen;
      case ColorPallete.Fourgreens2:
         return FourdGreens;
      case ColorPallete.Fourblues2:
         return FourBlues2;
      case ColorPallete.Fourbrightcolors2:
         return FourBrightColors2;
      case ColorPallete.Peach:
         return Peach;
      case ColorPallete.Fourreds2:
         return FourReds2;
      case ColorPallete.Bluegreenyellow:
         return BlueGreenYellow;
      case ColorPallete.Redorangeyellow:
         return RedOrangeYellow;
      case ColorPallete.Advantagelighter2:
         return AdvantageLighter2;
      case ColorPallete.Advantagedarker2:
         return AdvantageDarker2;
      case ColorPallete.Bivariatebluered2:
         return BivariateBlueRed2;
      case ColorPallete.Bivariateredblue2:
         return BivariateRedBlue2;
      case ColorPallete.Bivariategreenyellow2:
         return BivariateGreenYellow2;
      case ColorPallete.Bivariateyellowgreen2:
         return BivariateYellowGreen2;
      case ColorPallete.Fivegreens:
         return FiveGreens;
      case ColorPallete.Fiveblues:
         return FiveBlues;
      case ColorPallete.Fiveoranges:
         return FiveOranges;
      case ColorPallete.Fivereds:
         return FiveReds;
      case ColorPallete.Pastelshades:
         return PastelShades;
      case ColorPallete.Brightcolors2:
         return BrightColors2;
      case ColorPallete.Advantagelighter3:
         return AdvantageLighter3;
      case ColorPallete.Advantagedarker3:
         return AdvantageDarker3;
      case ColorPallete.Bivariatebluered3:
         return BivariateBlueRed3;
      case ColorPallete.Bivariateredblue3:
         return BivariateRedBlue3;
      case ColorPallete.Bivariategreenyellow3:
         return BivariateGreenYellow3;
      case ColorPallete.Bivariateyellowgreen3:
         return BivariateYellowGreen3;
      case ColorPallete.Green:
         return Green;
      case ColorPallete.Blue:
         return Blue;
      case ColorPallete.Orange:
         return Orange;
      case ColorPallete.Red:
         return Red;
      case ColorPallete.Pastelshades3:
         return PastelShades3;
      case ColorPallete.Brightcolors:
         return BrightColors;
      case ColorPallete.Valassisrange3color:
         return ValassisRange3color;
      case ColorPallete.Valassisrange4color:
         return ValassisRange4color;
      case ColorPallete.Valassisrank4color:
         return ValassisRank4color;
      case ColorPallete.Mediaexpressthematic:
         return MediaExpressThematic;
      case ColorPallete.Pastelshades4:
         return PastelShades4;
      case ColorPallete.Pastelshades5:
         return PastelShades5;
      case ColorPallete.Lightcolors1:
         return LightColors1;
      case ColorPallete.Bluetored:
         return BluetoRed;
      case ColorPallete.Lightcolors2:
         return LightColors2;
      case ColorPallete.Darkcolors:
         return DarkColors;
   }
}

const LightYellow: number[][] = [[255, 255, 150]];
const LightBlue: number[][] = [[100, 255, 255]];
const LightGreen: number[][] = [[150, 255, 150]];
const LightRed: number[][] = [[255, 175, 175]];
const TwoBlues: number[][] = [[50, 255, 255], [165, 240, 255]];
const GreenBlue: number[][] = [[165, 255, 200], [185, 235, 255]];
const TwoGreens: number[][] = [[90, 230, 150], [200, 255, 200]];
const TwoPeaches: number[][] = [[255, 215, 120], [255, 230, 185]];
const TwoReds: number[][] = [[255, 150, 150], [255, 200, 200]];
const GreenYellow: number[][] = [[185, 255, 195], [255, 255, 185]];
const TwoYellows: number[][] = [[255, 255, 120], [255, 255, 175]];
const YellowRed: number[][] = [[255, 255, 160], [255, 195, 200]];
const BlueGreenYellowRed: number[][] = [[150, 225, 255], [200, 255, 215], [255, 255, 175], [255, 190, 200]];
const BivariateBlueRed: number[][] = [[125, 175, 255], [180, 240, 255], [255, 210, 215], [255, 165, 175]];
const BivariateGreenYellow: number[][] = [[110, 220, 110], [150, 255, 150], [255, 255, 200], [255, 255, 150]];
const BivariateRedBlue: number[][] = [[255, 165, 175], [255, 210, 215], [180, 240, 255], [125, 175, 255]];
const BivariateYellowGreen: number[][] = [[255, 255, 150], [255, 255, 200], [150, 255, 150], [110, 220, 110]];
const FourBlues: number[][] = [[0, 150, 255], [100, 200, 255], [0, 255, 255], [150, 255, 255]];
const FourReds: number[][] = [[255, 85, 100], [255, 130, 130], [255, 150, 150], [255, 190, 190]];
const FourGreens: number[][] = [[0, 175, 50], [50, 225, 50], [150, 255, 100], [200, 255, 150]];
const FourOranges: number[][] = [[255, 185, 0], [255, 210, 110], [255, 200, 150], [255, 225, 200]];
const AdvantageLighter: number[][] = [[170, 250, 255], [170, 255, 181], [250, 255, 170], [255, 200, 200]];
const AdvantageDarker: number[][] = [[130, 130, 255], [125, 255, 130], [250, 255, 132], [255, 130, 130]];
const FourBrightColors: number[][] = [[255, 255, 0], [0, 150, 255], [0, 255, 0], [255, 125, 255]];
const RedYellowGreen: number[][] = [[255, 185, 185], [255, 255, 175], [190, 255, 190]];
const FourdGreens: number[][] = [[90, 255, 150], [180, 255, 190], [220, 255, 195]];
const FourBlues2: number[][] = [[100, 200, 255], [140, 240, 255], [190, 255, 255]];
const FourBrightColors2: number[][] = [[255, 255, 0], [50, 200, 255], [255, 125, 220]];
const Peach: number[][] = [[255, 210, 60], [255, 225, 150], [255, 230, 200]];
const FourReds2: number[][] = [[255, 125, 125], [255, 175, 175], [255, 210, 210]];
const BlueGreenYellow: number[][] = [[130, 230, 255], [160, 255, 170], [255, 255, 175]];
const RedOrangeYellow: number[][] = [[255, 170, 170], [255, 210, 150], [255, 250, 150]];
const AdvantageLighter2: number[][] = [[172, 252, 255], [170, 255, 180], [255, 255, 185], [255, 200, 150], [255, 200, 200]];
const AdvantageDarker2: number[][] = [[100, 150, 255], [125, 255, 125], [250, 255, 130], [255, 210, 50], [255, 130, 120]];
const BivariateBlueRed2: number[][] = [[125, 175, 255], [180, 240, 255], [255, 210, 215], [255, 165, 175], [255, 105, 135]];
const BivariateRedBlue2: number[][] = [[255, 165, 175], [255, 210, 215], [180, 240, 255], [125, 175, 255], [0, 125, 225]];
const BivariateGreenYellow2: number[][] = [[110, 220, 110], [150, 255, 150], [255, 255, 200], [255, 255, 150], [255, 255, 0]];
const BivariateYellowGreen2: number[][] = [[255, 255, 150], [255, 255, 200], [150, 255, 150], [110, 220, 110], [50, 175, 50]];
const FiveGreens: number[][] = [[0, 175, 50], [50, 225, 50], [150, 255, 100], [200, 255, 150], [200, 255, 200]];
const FiveBlues: number[][] = [[0, 150, 255], [100, 200, 255], [0, 255, 255], [150, 255, 255], [200, 255, 255]];
const FiveOranges: number[][] = [[255, 185, 0], [255, 210, 110], [255, 200, 150], [255, 225, 200], [255, 240, 200]];
const FiveReds: number[][] = [[255, 85, 100], [255, 130, 130], [255, 150, 150], [255, 190, 190], [255, 230, 230]];
const PastelShades: number[][] = [[255, 190, 230], [155, 215, 255], [255, 255, 150], [255, 210, 170], [200, 255, 175]];
const BrightColors2: number[][] = [[255, 255, 0], [255, 125, 255], [0, 150, 255], [0, 255, 0], [255, 190, 50]];
const AdvantageLighter3: number[][] = [[185, 215, 255], [172, 252, 255], [170, 255, 180], [255, 255, 185], [255, 200, 150], [255, 200, 200]];
const AdvantageDarker3: number[][] = [[200, 125, 255], [100, 150, 255], [125, 255, 125], [250, 255, 130], [255, 210, 50], [255, 130, 120]];
const BivariateBlueRed3: number[][] = [[0, 125, 225], [125, 175, 255], [180, 240, 255], [255, 210, 215], [255, 165, 175], [255, 105, 135]];
const BivariateRedBlue3: number[][] = [[255, 105, 135], [255, 165, 175], [255, 210, 215], [180, 240, 255], [125, 175, 255], [0, 125, 225]];
const BivariateGreenYellow3: number[][] = [[50, 175, 50], [110, 220, 110], [150, 255, 150], [255, 255, 200], [255, 255, 150], [255, 255, 0]];
const BivariateYellowGreen3: number[][] = [[255, 255, 0], [255, 255, 150], [255, 255, 200], [150, 255, 150], [110, 220, 110], [50, 175, 50]];
const Green: number[][] = [[0, 110, 50], [0, 175, 50], [50, 225, 50], [150, 255, 100], [200, 255, 150], [200, 255, 200]];
const Blue: number[][] = [[0, 75, 255], [0, 150, 255], [100, 200, 255], [0, 255, 255], [150, 255, 255], [200, 255, 255]];
const Orange: number[][] = [[255, 165, 50], [255, 185, 0], [255, 210, 110], [255, 200, 150], [255, 225, 200], [255, 240, 200]];
const Red: number[][] = [[255, 50, 50], [255, 85, 100], [255, 130, 130], [255, 150, 150], [255, 190, 190], [255, 230, 230]];
const PastelShades3: number[][] = [[255, 190, 230], [155, 215, 255], [200, 255, 175], [255, 210, 170], [255, 255, 150], [200, 200, 255]];
const BrightColors: number[][] = [[255, 255, 0], [255, 125, 225], [0, 150, 255], [0, 255, 0], [200, 75, 220], [255, 190, 50]];
const ValassisRange3color: number[][] = [[254, 242, 102], [255, 176, 16], [237, 23, 31]];
const ValassisRange4color: number[][] = [[255, 255, 208], [254, 242, 102], [255, 176, 16], [237, 23, 31]];
const ValassisRank4color: number[][] = [[84, 116, 169], [158, 189, 13], [255, 176, 16], [237, 23, 31]];
const MediaExpressThematic: number[][] = [[180, 39, 55], [248, 115, 7], [158, 189, 13], [84, 116, 169], [255, 176, 16], [153, 102, 153], [64, 128, 128], [160, 39, 75], [105, 209, 231], [81, 115, 71], [254, 242, 102], [190, 215, 141], [208, 224, 255]];
const PastelShades4: number[][] = [[255, 190, 232], [156, 218, 255], [202, 255, 177], [255, 204, 201], [198, 196, 255], [184, 255, 255], [175, 198, 164], [245, 243, 161], [255, 155, 157], [77, 219, 255], [255, 251, 199], [171, 255, 229], [247, 214, 255], [255, 226, 214], [255, 207, 114], [177, 186, 255], [255, 185, 203], [112, 255, 202], [245, 255, 211], [196, 226, 255]];
const PastelShades5: number[][] = [[255, 190, 232], [202, 255, 177], [156, 218, 255], [255, 181, 173], [189, 182, 255], [184, 255, 255], [170, 198, 154], [245, 244, 131], [255, 119, 134], [77, 219, 255], [244, 187, 255], [197, 255, 222], [166, 200, 255], [255, 220, 139], [207, 209, 255], [181, 255, 251], [128, 185, 133], [255, 255, 179], [237, 94, 97], [121, 189, 223]];
const LightColors1: number[][] = [[0, 255, 255], [202, 255, 177], [156, 218, 255], [255, 181, 173], [189, 182, 255], [128, 255, 255], [170, 198, 154], [245, 244, 131], [255, 119, 134], [77, 219, 255], [255, 187, 255], [227, 255, 232], [87, 103, 255], [255, 220, 139], [205, 209, 255], [0, 128, 128], [128, 185, 133], [255, 255, 179], [237, 94, 97], [121, 189, 223]];
const BluetoRed: number[][] = [[0, 0, 255], [0, 51, 255], [0, 101, 255], [0, 153, 255], [0, 204, 255], [0, 255, 255], [0, 255, 204], [0, 255, 153], [0, 255, 102], [0, 255, 51], [0, 255, 0], [51, 255, 0], [153, 255, 0], [204, 255, 0], [255, 255, 0], [255, 204, 0], [255, 153, 0], [255, 102, 0], [255, 51, 0], [255, 0, 0]];
const LightColors2: number[][] = [[128, 255, 75], [255, 215, 185], [246, 255, 187], [196, 255, 176], [179, 255, 231], [202, 207, 255], [244, 208, 255], [255, 191, 196], [229, 255, 96], [75, 198, 255], [195, 196, 255], [85, 255, 176], [251, 255, 125], [255, 171, 131], [255, 215, 112], [255, 192, 228], [255, 247, 157], [198, 255, 251], [255, 228, 60], [255, 143, 136]];
const DarkColors: number[][] = [[235, 131, 235], [169, 209, 175], [173, 158, 208], [253, 254, 171], [234, 145, 157], [127, 245, 247], [255, 203, 223], [245, 180, 151], [177, 218, 220], [128, 135, 254], [187, 255, 207], [217, 178, 234], [255, 125, 133], [249, 255, 121], [94, 205, 214], [255, 224, 215], [213, 255, 167], [215, 175, 255], [255, 227, 160], [255, 132, 170]];
const cpqmaps: number[][] = [[108, 139, 202], [211, 114, 149], [255, 255, 102], [134, 188, 182], [255, 167, 79], [170, 113, 213], [250, 191, 210], [160, 205, 232], [242, 142, 43], [89, 161, 79], [157, 118, 96], [92, 154, 254], [241, 206, 99], [140, 209, 125], [255, 157, 154], [186, 176, 172], [73, 152, 148], [212, 166, 200], [225, 87, 89], [182, 153, 45]];
