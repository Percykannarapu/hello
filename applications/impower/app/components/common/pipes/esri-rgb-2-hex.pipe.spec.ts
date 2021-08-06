import { EsriRgb2HexPipe } from './esri-rgb-2-hex.pipe';

describe('EsriRgb2HexPipe', () => {
  it('create an instance', () => {
    const pipe = new EsriRgb2HexPipe();
    expect(pipe).toBeTruthy();
  });
  it('formats rgb values properly', () => {
    const pipe = new EsriRgb2HexPipe();
    const transformedValue = pipe.transform([42, 127, 200]);
    expect(transformedValue).toBe('rgb(42,127,200)');
  });
  it('formats rgba values properly', () => {
    const pipe = new EsriRgb2HexPipe();
    const transformedValue = pipe.transform([42, 127, 200, 0.5]);
    expect(transformedValue).toBe('rgb(42,127,200,0.5)');
  });
});
