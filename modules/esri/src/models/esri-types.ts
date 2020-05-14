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
