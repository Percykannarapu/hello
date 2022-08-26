export function isConvertibleToNumber(value: any) : value is number {
  return !isEmpty(value) && isValidNumber(Number(value));
}

export function isConvertibleToInteger(value: any) : boolean {
  return isConvertibleToNumber(value) && isInteger(Number(value));
}

export function isPositive(value: any) : boolean {
  return isValidNumber(value) && value >= 0;
}

export function isInteger(value: any) : boolean {
  return isValidNumber(value) && Number.isSafeInteger(Number(value));
}

export function isUndefined(value: any) : value is undefined {
  return typeof value === 'undefined';
}

export function isNull(value: any) : value is null {
  return value === null;
}

/**
 * Checks if value is null or undefined
 */
export function isNil(value: any) : value is (null | undefined) {
  return isNull(value) || isUndefined(value);
}

/**
 * Checks if value is neither null nor undefined
 */
export function isNotNil<T>(value: null | undefined | T) : value is T {
  return !isNull(value) && !isUndefined(value);
}

/**
 * Checks if value is null, undefined, an empty string, or an empty array
 */
export function isEmpty(value: any) : value is (null | undefined | '' | []) {
  return isNil(value) || (isString(value) && value.trim().length === 0) || (isArray(value) && value.length === 0);
}

export function isNumber(value: any) : value is number {
  return typeof value === 'number';
}

/**
 * Checks if value is a non-null, non-undefined number that is also non-NaN and non-Infinite
 */
export function isValidNumber(value: any) : value is number {
  return isNotNil(value) && isNumber(value) && Number.isFinite(value);
}

export function isString(value: any) : value is string {
  return typeof value === 'string';
}

export function isObject(value: any) : value is Object {
  return value !== null && typeof value === 'object';
}

export function isArray<T = any>(value: any)  : value is T[] {
  return Array.isArray(value); // returns false for null & undefined as well
}

export function isFunction(value: any) : value is Function {
  return typeof value === 'function';
}

export function isDate(value: any) : value is Date {
  return value instanceof Date;
}

export function isNumberArray(value: any) : value is number[] {
  return !isNil(value) && isArray(value) && isValidNumber(value[0]);
}

export function isStringArray(value: any) : value is string[] {
  return !isNil(value) && isArray(value) && isString(value[0]);
}

export function isSymbol(value: any) : value is symbol {
  const type = typeof value;
  return type == 'symbol' || (type === 'object' && value != null && value.toString() === '[object Symbol]');
}
