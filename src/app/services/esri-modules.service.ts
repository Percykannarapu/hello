import {Injectable} from '@angular/core';
import {EsriLoaderWrapperService} from './esri-loader-wrapper.service';

@Injectable()
export class EsriModules {
  private static names: string[] = [
    'esri/widgets/LayerList',
    'esri/widgets/Expand',
    'esri/support/Action',
    'esri/core/Collection',
    'esri/renderers/smartMapping/creators/color',
    'esri/renderers/smartMapping/statistics/histogram',
    'esri/widgets/ColorSlider',
    'esri/core/lang',
  ];

  public static LayerList: typeof __esri.LayerList;
  public static Expand: typeof __esri.Expand;
  public static Action: typeof __esri.Action;
  public static Collection: __esri.Constructor<__esri.Collection>;
  public static colorRendererCreator: typeof __esri.color;
  public static histogram: typeof __esri.histogram;
  public static ColorSlider: typeof __esri.ColorSlider;
  public static lang: typeof __esri.lang;

  public deferredLoad: Promise<any>;
  private m_ready: boolean = false;

  constructor(){}

  private cacheModules(modules: any[]) : void {
    // modules array index must line up with names array index
    EsriModules.LayerList = modules[0];
    EsriModules.Expand = modules[1];
    EsriModules.Action = modules[2];
    EsriModules.Collection = modules[3];
    EsriModules.colorRendererCreator = modules[4];
    EsriModules.histogram = modules[5];
    EsriModules.ColorSlider = modules[6];
    EsriModules.lang = modules[7];

    this.m_ready = true;
  }

  public ready() : boolean {
    if (!this.m_ready) {
      this.deferredLoad = EsriLoaderWrapperService.esriLoader
                            .loadModules(EsriModules.names);
      this.deferredLoad.then(m => this.cacheModules(m));
    }
    return this.m_ready;
  }
}
