export class EsriWidgets {
  public static moduleNames: string[] = [
    'esri/widgets/LayerList',
    'esri/widgets/Expand',
    'esri/widgets/Home',
    'esri/widgets/Search',
    'esri/widgets/Legend',
    'esri/widgets/ScaleBar',
    'esri/widgets/Locate',
    'esri/widgets/BasemapGallery',
    'esri/widgets/Print',
    'esri/widgets/Sketch/SketchViewModel',
    'esri/widgets/DistanceMeasurement2D',
    'esri/widgets/BasemapGallery/support/LocalBasemapsSource'
  ];

  public LayerList: __esri.LayerListConstructor;
  public Expand: __esri.ExpandConstructor;
  public Home: __esri.HomeConstructor;
  public Search: __esri.widgetsSearchConstructor;
  public Legend: __esri.LegendConstructor;
  public ScaleBar: __esri.ScaleBarConstructor;
  public Locate: __esri.LocateConstructor;
  public BaseMapGallery: __esri.BasemapGalleryConstructor;
  public Print: __esri.PrintConstructor;
  public SketchViewModel: __esri.SketchViewModelConstructor;
  public DistanceMeasurement2D: __esri.DistanceMeasurement2DConstructor;
  public LocalBasemapsSource: __esri.LocalBasemapsSourceConstructor;

  constructor() {}

  public loadModules(modules: any[]) {
    // modules contains all of them, not just the widgets - need to pare it down a bit
    [ this.LayerList,
      this.Expand,
      this.Home,
      this.Search,
      this.Legend,
      this.ScaleBar,
      this.Locate,
      this.BaseMapGallery,
      this.Print,
      this.SketchViewModel,
      this.DistanceMeasurement2D,
      this.LocalBasemapsSource] = modules.slice(modules.length - EsriWidgets.moduleNames.length);
  }
}
