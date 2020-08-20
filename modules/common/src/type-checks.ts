export function isConvertibleToNumber(value: any) : value is number {
  return !isEmpty(value) && isValidNumber(Number(value));
}

export function isConvertibleToInteger(value: any) : boolean {
  return isConvertibleToNumber(value) && isInteger(Number(value));
}

export function isFiniteNumber(value: any) : boolean {
  return isNumber(value) && isFinite(value);
}

export function isPositive(value: any) : boolean {
  return isValidNumber(value) && value >= 0;
}

export function isInteger(value: any) : boolean {
  return isValidNumber(value) && (value % 1) === 0;
}

export function isUndefined(value: any) : value is undefined {
  return typeof value === 'undefined';
}

export function isNull(value: any) : value is null {
  return value === null;
}

export function isNil(value: any) : value is (null | undefined) {
  return isNull(value) || isUndefined(value);
}

export function isEmpty(value: any) : value is (null | undefined | '') {
  return isNil(value) || (isString(value) && value.trim().length === 0);
}

export function isNumber(value: any) : value is number {
  return typeof value === 'number';
}

export function isValidNumber(value: any) : value is number {
  return isNumber(value) && !isNaN(value); // isNumber will fail on null, isNaN fails on undefined
}

export function isString(value: any) : value is string {
  return typeof value === 'string';
}

export function isObject(value: any) : value is Object {
  return value !== null && typeof value === 'object';
}

export function isArray(value: any)  : value is any[] {
  return Array.isArray(value);
}

export function isFunction(value: any) : value is Function {
  return typeof value === 'function';
}

export function isDate(value: any) : value is Date {
  return value instanceof Date;
}
