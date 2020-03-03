export function isConvertibleToNumber(value: any) : value is number {
  return value != null && value !== '' && !Number.isNaN(Number(value));
}

export function isFiniteNumber(value: any) : boolean {
  return isNumber(value) && isFinite(value);
}

// Not strict positive
export function isPositive(value: any) : boolean {
  return isNumber(value) && value >= 0;
}

export function isInteger(value: any) : boolean {
  return isNumber(value) && (value % 1) === 0;
}

export function isUndefined(value: any) : value is undefined {
  return typeof value === 'undefined';
}

export function isNull(value: any) : value is null {
  return value === null;
}

export function isNil(value: any) : value is (null | undefined) {
  return value === null || typeof (value) === 'undefined';
}

export function isNumber(value: any) : value is number {
  return typeof value === 'number';
}

export function isString(value: any) : value is string {
  return typeof value === 'string';
}

export function isObject(value: any) : value is Object {
  return value !== null && typeof value === 'object';
}

export function isArray(value: any)  : value is [] {
  return Array.isArray(value);
}

export function isFunction(value: any) : value is Function {
  return typeof value === 'function';
}