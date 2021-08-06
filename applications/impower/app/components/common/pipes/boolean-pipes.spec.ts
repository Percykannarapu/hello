import { AnyToBoolPipe } from './boolean-pipes';

describe('AnyToBoolPipe', () => {
  it('create an instance', () => {
    const pipe = new AnyToBoolPipe();
    expect(pipe).toBeTruthy();
  });
  it('returns null for null input', () => {
    const pipe = new AnyToBoolPipe();
    const transformedValue = pipe.transform(null);
    expect(transformedValue).toBeNull();
  });
  it('converts Y to true', () => {
    const pipe = new AnyToBoolPipe();
    const transformedValue = pipe.transform('Y');
    expect(transformedValue).toBeTrue();
  });
  it('converts 1 to true', () => {
    const pipe = new AnyToBoolPipe();
    const transformedValue = pipe.transform(1);
    expect(transformedValue).toBeTrue();
  });
  it('converts T to true', () => {
    const pipe = new AnyToBoolPipe();
    const transformedValue = pipe.transform('T');
    expect(transformedValue).toBeTrue();
  });
  it('converts "true" to true', () => {
    const pipe = new AnyToBoolPipe();
    const transformedValue = pipe.transform('true');
    expect(transformedValue).toBeTrue();
  });
  it('converts other values to false', () => {
    const pipe = new AnyToBoolPipe();
    const otherValues = ['N', 0, 'F', 'false', 'foo'];
    const transformedValues = otherValues.map(ov => pipe.transform(ov));
    expect(transformedValues).toEqual(otherValues.map(() => false));
  });
});
