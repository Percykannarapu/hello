import { AllCoordinates, isGeoCoordinates, isLocationCoordinates, isRequestCoordinates, UniversalCoordinates } from './models/coordinates';

export function chunkArray<T, U>(arr: T[] | U[], chunkSize: number) : (T[] | U[])[] {
  const groups: (T[] | U[])[] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    groups.push(arr.slice(i, i + chunkSize));
  }
  return groups;
}

export function isNumber(value: any) : boolean {
  return value != null && value != '' && !Number.isNaN(Number(value));
}

export function toUniversalCoordinates(coordinates: AllCoordinates) : UniversalCoordinates;
export function toUniversalCoordinates(coordinate: AllCoordinates[]) : UniversalCoordinates[];
export function toUniversalCoordinates(coordinates: AllCoordinates | AllCoordinates[]) : UniversalCoordinates | UniversalCoordinates[] {
  if (Array.isArray(coordinates)) {
    return coordinates.map(c => toUniversalCoordinates(c));
  } else if (isGeoCoordinates(coordinates)) {
    return { x: coordinates.xCoord, y: coordinates.yCoord };
  } else if (isLocationCoordinates(coordinates)) {
    return { x: coordinates.xcoord, y: coordinates.ycoord };
  } else if (isRequestCoordinates(coordinates)) {
    return { x: coordinates.longitude, y: coordinates.latitude };
  } else {
    return { x: coordinates.Longitude, y: coordinates.Latitude };
  }
}

export interface Statistics {
  mean: number;
  sum: number;
  min: number;
  max: number;
  variance: number;
  stdDeviation: number;
}

export function calculateStatistics(data: number[]) : Statistics {
  if (data == null || data.length === 0) return null;
  const result: Statistics = {
    mean: 0,
    sum: 0,
    min: Number.POSITIVE_INFINITY,
    max: Number.NEGATIVE_INFINITY,
    variance: 0,
    stdDeviation: 0
  };
  const dataLength = data.length;
  let sumOfSquares = 0;
  for (let i = 0; i < dataLength; ++i) {
    result.sum += data[i];
    sumOfSquares += (data[i] * data[i]);
    if (data[i] < result.min) result.min = data[i];
    if (data[i] > result.max) result.max = data[i];
  }
  result.mean = result.sum / dataLength;
  const squareOfSum = result.sum * result.sum;
  const averageOfSquare = squareOfSum / dataLength;
  const deviation = sumOfSquares - averageOfSquare;
  result.variance = deviation / (dataLength - 1);
  result.stdDeviation = Math.sqrt(result.variance);
  return result;
}
