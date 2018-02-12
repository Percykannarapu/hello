import {EsriModules} from '../esri-modules/core/esri-modules.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

export enum SmartMappingTheme {
  HighToLow = 'high-to-low',
  AboveAndBelow = 'above-and-below',
  CenteredOn = 'centered-on',
  Extremes = 'extremes'
}

export class LayerState {

  private newRendererReady: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private showNewRenderer: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private originalRenderer: __esri.Renderer;
  private newRenderer: __esri.Renderer;
  private originalOpacity: number;
  private newOpacity: number;
  private colorSlider: __esri.ColorSlider;

  constructor(private layer: __esri.FeatureLayer, private baseMap: __esri.Basemap, private demoFieldName: string, private theme: SmartMappingTheme, private sliderId: string){
    // assumption is that this layer is in a pristine state, i.e. the renderer is still the default
    this.originalRenderer = this.layer.renderer;
    this.originalOpacity = this.layer.opacity;
    this.newOpacity = 0.65;

    this.newRendererReady.subscribe((isReady) => {
      if (isReady) {
        this.onRendererReady();
      }
    });
    this.showNewRenderer.subscribe(v => this.onShowNewRenderer(v));
  }

  toggleSmartView() : void {
    this.showNewRenderer.next(!this.showNewRenderer.getValue());
  }

  setNewDemoField(newFieldName: string) : void {
    this.demoFieldName = newFieldName;
    this.newRendererReady.next(false);
    this.generateRenderer();
  }

  setNewTheme(newTheme: SmartMappingTheme) : void {
    this.theme = newTheme;
    this.newRendererReady.next(false);
    this.generateRenderer();
  }

  setNewOpacity(newOpacity: number) : void {
    this.newOpacity = newOpacity;
    this.layer.opacity = newOpacity;
  }

  setNewBaseMap(newBaseMap: __esri.Basemap) : void {
    this.baseMap = newBaseMap;
    this.newRendererReady.next(false);
    this.generateRenderer();
  }

  private onRendererReady() {
    if (this.showNewRenderer.getValue()) {
      this.layer.renderer = this.newRenderer;
      this.layer.opacity = this.newOpacity;
    }
  }

  private onShowNewRenderer(show: boolean) {
    if (!show) {
      this.layer.renderer = this.originalRenderer;
      this.layer.opacity = this.originalOpacity;
    } else {
      if (this.newRenderer == null) {
        this.generateRenderer();
      } else {
        this.layer.renderer = this.newRenderer;
        this.layer.opacity = this.newOpacity;
      }
    }
  }

  private generateRenderer() : void {
    if (this.demoFieldName == null || this.theme == null) return;
    const colorParams = {
      layer: this.layer,
      basemap: this.baseMap,
      field: this.demoFieldName,
      theme: this.theme
    };
    EsriModules.colorRendererCreator.createContinuousRenderer(colorParams)
      .then( (response) => {
        this.newRenderer = response.renderer;
        const histogramParams = {
          layer: colorParams.layer,
          field: colorParams.field,
          numBins: 30
        };
        this.createHistogram(response, histogramParams);
      })
      .otherwise(err => {
        console.log('there was an error generating a smart renderer: ', err);
      });
  }

  private createHistogram(result: __esri.ContinuousRendererResult, params: __esri.histogramHistogramParams) {
    EsriModules.histogram(params).then(histogram => {
      const isH2L = (this.theme === SmartMappingTheme.HighToLow);
      const sliderParams: __esri.ColorSliderProperties = {
        numHandles: (isH2L ? 2 : 3),
        syncedHandles: (!isH2L),
        statistics: result.statistics,
        visualVariable: result.visualVariable,
        histogram: histogram,
        minValue: result.statistics.min,
        maxValue: result.statistics.max
      };
      if (this.colorSlider == null) {
        this.createNewColorSlider(sliderParams);
      } else {
        this.colorSlider.set(sliderParams);
      }
      this.newRendererReady.next(true);
    });
  }

  private createNewColorSlider(params: __esri.ColorSliderProperties) {
    params.container = this.sliderId;
    this.colorSlider = new EsriModules.widgets.ColorSlider(params);
    // when the user slides the handle(s), update the renderer
    // with the updated color visual variable object
    this.colorSlider.on('data-change', () => {
      const renderer = (<__esri.ClassBreaksRenderer>this.layer.renderer).clone();
      renderer.visualVariables = [EsriModules.lang.clone(this.colorSlider.visualVariable)];
      this.newRenderer = renderer;
      this.newRendererReady.next(true);
    });
  }
}
