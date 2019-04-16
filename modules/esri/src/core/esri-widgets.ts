export class EsriWidgets {
  public static moduleNames: string[] = [
    'esri/widgets/LayerList',
    'esri/widgets/Expand',
    'esri/widgets/ColorSlider',
    'esri/widgets/Home',
    'esri/widgets/Search',
    'esri/widgets/Legend',
    'esri/widgets/ScaleBar',
    'esri/widgets/Locate',
    'esri/widgets/Compass',
    'esri/widgets/BasemapGallery',
    'esri/widgets/Print',
    'esri/widgets/Sketch/SketchViewModel',
    'esri/widgets/DistanceMeasurement2D',
  ];

  public LayerList: __esri.LayerListConstructor;
  public Expand: __esri.ExpandConstructor;
  public ColorSlider: __esri.ColorSliderConstructor;
  public Home: __esri.HomeConstructor;
  public Search: __esri.widgetsSearchConstructor;
  public Legend: __esri.LegendConstructor;
  public ScaleBar: __esri.ScaleBarConstructor;
  public Locate: __esri.LocateConstructor;
  public Compass: __esri.CompassConstructor;
  public BaseMapGallery: __esri.BasemapGalleryConstructor;
  public Print: __esri.PrintConstructor;
  public SketchViewModel: __esri.SketchViewModelConstructor;
  public DistanceMeasurement2D: __esri.DistanceMeasurement2DConstructor;

  constructor() {}

  public loadModules(modules: any[]) {
    // modules contains all of them, not just the widgets - need to pare it down a bit
    [ this.LayerList,
      this.Expand,
      this.ColorSlider,
      this.Home,
      this.Search,
      this.Legend,
      this.ScaleBar,
      this.Locate,
      this.Compass,
      this.BaseMapGallery,
      this.Print,
      this.SketchViewModel,
      this.DistanceMeasurement2D] = modules.slice(modules.length - EsriWidgets.moduleNames.length);
  }
}
