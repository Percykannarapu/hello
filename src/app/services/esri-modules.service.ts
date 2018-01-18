import {Injectable} from '@angular/core';
import {EsriLoaderWrapperService} from './esri-loader-wrapper.service';

@Injectable()
export class EsriModules {
  private static names: string[] = [
    'esri/widgets/LayerList',
    'esri/widgets/Expand',
    'esri/support/Action',
    'esri/core/Collection'
  ];

  public static LayerList;
  public static Expand;
  public static Action;
  public static Collection;

  public deferredLoad: Promise<any>;
  private m_ready: boolean = false;

  constructor(){}

  private cacheModules(modules: any[]) : void {
    // modules array index must line up with names array index
    EsriModules.LayerList = modules[0];
    EsriModules.Expand = modules[1];
    EsriModules.Action = modules[2];
    EsriModules.Collection = modules[3];

    this.m_ready = true;
  }

  public ready() : boolean {
    if (!this.m_ready) {
      this.deferredLoad = EsriLoaderWrapperService.esriLoader
        .loadModules(EsriModules.names)
        .then(m => this.cacheModules(m));
    }
    return this.m_ready;
  }
}
