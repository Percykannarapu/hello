export enum MapSymbols  {
   STAR = 'M16 4.588l2.833 8.719H28l-7.416 5.387 2.832 8.719L16 22.023l-7.417 5.389 2.833-8.719L4 13.307h9.167L16 4.588z',
}

export type RgbTuple = [number, number, number];
export type RgbaTuple = [number, number, number, number];
export namespace RgbTuple {
  export function withAlpha(rgb: RgbTuple, alpha: number) : RgbaTuple {
    return [rgb[0], rgb[1], rgb[2], alpha];
  }
  export function matches(rgba: RgbaTuple, other: RgbaTuple | RgbTuple) : boolean {
    const coreMatch = other[0] === rgba[0] && other[1] === rgba[1] && other[2] === rgba[2];
    if (other.length === 3) return coreMatch;
    return coreMatch && other[3] === rgba[3];
  }
}

export type AutoCastColor = __esri.Color | RgbTuple | RgbaTuple | string;
export type FillPattern = 'backward-diagonal' | 'cross' | 'diagonal-cross' | 'forward-diagonal' | 'horizontal' | 'none' | 'solid' | 'vertical';
export type LineStyle = 'dash' | 'dash-dot' | 'dot' | 'long-dash' | 'long-dash-dot' | 'long-dash-dot-dot' | 'none' | 'short-dash' | 'short-dash-dot' | 'short-dash-dot-dot' | 'short-dot' | 'solid';

