import { Injectable } from '@angular/core';
import {EsriModules} from '../esri-modules/core/esri-modules.service';

@Injectable()
export class EsriLoaderWrapperService {
  public static esriLoader: EsriModules;

  constructor() {}
}
