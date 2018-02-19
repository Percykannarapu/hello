import { EsriModules } from '../esri-modules/core/esri-modules.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { DemographicVariable } from '../services/top-var.service';

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
  private originalOpacity: number;

  private newRenderer: __esri.Renderer;
  private newOpacity: number;
  private newBaseMap: __esri.Basemap;
  private newTopVar: DemographicVariable;
  private newVarActualFieldName: string;
  private newTheme: SmartMappingTheme;

  private colorSlider: __esri.ColorSlider;

  constructor(private layer: __esri.FeatureLayer, private baseMap$: Observable<__esri.Basemap>,
              private selectedTopVar$: Observable<DemographicVariable>, private selectedTheme$: Observable<SmartMappingTheme>,
              private newOpacity$: Observable<number>, private colorSliderId: string){
    // assumption is that this layer is in a pristine state, i.e. the renderer is still the default
    this.originalRenderer = this.layer.renderer;
    this.originalOpacity = this.layer.opacity;
    this.initSubscriptions();
  }

  toggleSmartView() : void {
    this.showNewRenderer.next(!this.showNewRenderer.getValue());
  }

  customShadingVisible() : boolean {
    return this.showNewRenderer.getValue();
  }

  private initSubscriptions() : void {
    this.newRendererReady.subscribe((isReady) => {
      if (isReady) {
        this.onRendererReady();
      }
    });
    this.showNewRenderer.subscribe(v => this.onShowNewRenderer(v));

    this.baseMap$.subscribe(m => {
      this.newBaseMap = m;
      this.regenerateRenderer();
    });
    this.selectedTopVar$.subscribe(v => {
      this.newTopVar = v;
      this.findNewFieldName();
      this.regenerateRenderer();
    });
    this.selectedTheme$.subscribe(t => {
      this.newTheme = t;
      this.regenerateRenderer();
    });
    this.newOpacity$.subscribe(o => {
      this.newOpacity = o;
      if (this.showNewRenderer.getValue()) {
        this.layer.opacity = o / 100;
      }
    });
  }

  private regenerateRenderer() : void {
    this.newRendererReady.next(false);
    this.generateRenderer();
  }

  private onRendererReady() : void {
    if (this.showNewRenderer.getValue()) {
      this.layer.renderer = this.newRenderer;
      this.layer.opacity = this.newOpacity / 100;
    }
  }

  private onShowNewRenderer(show: boolean) : void {
    if (!show) {
      this.layer.renderer = this.originalRenderer;
      this.layer.opacity = this.originalOpacity;
    } else {
      if (this.newRenderer == null) {
        this.generateRenderer();
      } else {
        this.layer.renderer = this.newRenderer;
        this.layer.opacity = this.newOpacity / 100;
      }
    }
  }

  private findNewFieldName() {
    if (this.newTopVar == null) {
      this.newVarActualFieldName = null;
      return;
    }
    const values = this.layer.fields.filter(f => f.name.toUpperCase() === this.newTopVar.fieldName.toUpperCase());
    if (values.length > 0) {
      this.newVarActualFieldName = values[0].name;
    } else {
      //field not found
      this.newVarActualFieldName = null;
      console.error(`Field '${this.newTopVar.fieldName}' (${this.newTopVar.label}) was not found in the layer set.`);
      // TODO: throw error?
    }
  }

  private generateRenderer() : void {
    if (this.newTopVar == null || this.newVarActualFieldName == null) return;
    console.log('Generating new renderer');
    const colorParams = {
      layer: this.layer,
      basemap: this.newBaseMap,
      field: this.newVarActualFieldName,
      theme: this.newTheme
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

  private createHistogram(result: __esri.ContinuousRendererResult, params: __esri.histogramHistogramParams) : void {
    EsriModules.histogram(params).then(histogram => {
      const isH2L = (this.newTheme === SmartMappingTheme.HighToLow);
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

  private createNewColorSlider(params: __esri.ColorSliderProperties) : void {
    params.container = this.colorSliderId;
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
