export enum MapSymbols  {
  STAR = 'm 16 4.588 l 2.833 8.719 h 9.167 l -7.416 5.387 2.832 8.719 -7.416 -5.39 -7.417 5.389 2.833 -8.719 -7.416 -5.386 h 9.167 l 2.833 -8.719 z'
}

export type RgbTuple = [number, number, number];
export type RgbaTuple = [number, number, number, number];
export namespace RgbTuple {
  export function withAlpha(rgb: RgbTuple, alpha: number) : RgbaTuple {
    return [rgb[0], rgb[1], rgb[2], alpha];
  }
  export function matches(rgba: RgbaTuple, other: RgbaTuple | RgbTuple, ignoreAlpha: boolean = true) : boolean {
    const coreMatch = other[0] === rgba[0] && other[1] === rgba[1] && other[2] === rgba[2];
    if (other.length === 3 || ignoreAlpha) return coreMatch;
    return coreMatch && other[3] === rgba[3];
  }
  export function duplicate<T extends RgbTuple | RgbaTuple>(rgb: T) : T {
    if (rgb == null) return null;
    return [...rgb] as T;
  }
}

export type AutoCastColor = __esri.Color | RgbTuple | RgbaTuple | string;
export type CrossHatchFillPattern = 'backward-diagonal' | 'cross' | 'diagonal-cross' | 'forward-diagonal' | 'horizontal' | 'vertical';
export type FillPattern = CrossHatchFillPattern | 'none' | 'solid';
export type LineStyle = 'dash' | 'dash-dot' | 'dot' | 'long-dash' | 'long-dash-dot' | 'long-dash-dot-dot' | 'none' | 'short-dash' | 'short-dash-dot' | 'short-dash-dot-dot' | 'short-dot' | 'solid';
export type MarkerStyles = 'circle' | 'cross' | 'diamond' | 'square' | 'triangle' | 'x' | 'path';
export const markerStyleValues: MarkerStyles[] = ['path', 'circle', 'diamond', 'square', 'triangle', 'cross', 'x'];
export const completeEsriFaces: string[] = [
  'Alegreya',
  'Arial',
  'Avenir Next LT Pro',
  'Avenir Next LT Pro Regular',
  'Josefin Slab',
  'Merriweather',
  'Noto Sans',
  'Noto Serif',
  'Playfair Display',
  'Ubuntu',
  'Ubuntu Mono',
];
export const esriFontFaces: string[] = [
  'Abril Fatface',
  'Alegreya',
  'Alegreya Sans',
  'Alegreya SC',
  'Amarante',
  'Amatic SC',
  'Arial',
  'Arial Unicode MS',
  'Atomic Age',
  'Audiowide',
  'Avenir Next LT Pro',
  'Avenir Next LT Pro Demi',
  'Avenir Next LT Pro Light',
  'Avenir Next LT Pro Medium',
  'Avenir Next LT Pro Regular',
  'Belleza',
  'Black Ops One',
  'Cabin Sketch',
  'Coming Soon',
  'Homemade Apple',
  'IM FELL DW Pica PRO',
  'Josefin Sans',
  'Josefin Sans Semibold',
  'Josefin Slab',
  'Josefin Slab Light',
  'Josefin Slab Semibold',
  'Josefin Slab Thin',
  'Just Another Hand',
  'Kranky',
  'Life Savers',
  'Loved By The King',
  'Merriweather',
  'Montserrat',
  'Montserrat Medium',
  'Montserrat Semibold',
  'Noto Sans',
  'Noto Serif',
  'Old Standard TT',
  'Orbitron',
  'Oregano',
  'Oswald',
  'Pacifico',
  'Palatino Linotype',
  'Playfair Display Black',
  'Playfair Display',
  'Playfair Display SC',
  'Redressed',
  'Risque',
  'Roboto Condensed',
  'Roboto Condensed Light',
  'Rye',
  'Special Elite',
  'Syncopate',
  'Tangerine',
  'Ubuntu',
  'Ubuntu Condensed',
  'Ubuntu Light',
  'Ubuntu Medium',
  'Ubuntu Mono',
  'UnifrakturCook',
  'Vast Shadow',
  'Walter Turncoat'
];
