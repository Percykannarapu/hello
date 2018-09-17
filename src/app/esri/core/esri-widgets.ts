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
    'esri/widgets/Sketch/SketchViewModel'
  ];

  public LayerList: typeof __esri.LayerList;
  public Expand: typeof __esri.Expand;
  public ColorSlider: typeof __esri.ColorSlider;
  public Home: typeof __esri.Home;
  public Search: typeof __esri.widgetsSearch;
  public Legend: typeof __esri.Legend;
  public ScaleBar: typeof __esri.ScaleBar;
  public Locate: typeof __esri.Locate;
  public Compass: typeof __esri.Compass;
  public BaseMapGallery: typeof __esri.BasemapGallery;
  public Print: typeof __esri.Print;
  public SketchViewModel: typeof __esri.SketchViewModel;

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
      this.SketchViewModel] = modules.slice(modules.length - EsriWidgets.moduleNames.length);
  }
}
