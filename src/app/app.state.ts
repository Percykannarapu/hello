import { ImpRadLookupService } from './val-modules/targeting/services/ImpRadLookup.service';
import { ImpRadLookup } from './val-modules/targeting/models/ImpRadLookup';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class AppState
{
   // URL to access the ArcGIS Portal
   public static portalUrl: string = 'https://vallomimpor1vm.val.vlss.local/arcgis';

   // URL to access the ArcGIS Server
   public static serverUrl: string = 'https://vallomimpor1vm.val.vlss.local/arcgis-server';

   // ID for the DMA Boundaries layer
   public static dmaBoundariesLayerId: string = '9205b77cd8c74773aefad268b6705543';

   // Name for the DMA Boundaries layer
   public static dmaBoundariesLayerName: string = 'DMA_Boundaries';

   // ID for the Zip Top Vars layer
   public static zipTopVarsLayerId: string = '5742f3faba51493ab29f9e78bc5598d4';

   // Name for the Zip Top Vars layer
   public static zipTopVarsLayerName: string = 'ZIP_Top_Vars';

   // ID for the Zip Centroids FL layer
   public static zipCentroidsFlLayerId: string = '38b352fed65640beb0c246b82a24c881';

   // Name for the Zip Centroids FL layer
   public static zipCentroidsFlLayerName: string = 'ZIP_Centroids_FL';

   // ID for the ATZ Top Vars layer
   public static atzTopVarsLayerId: string = 'd3bf2b2a2a0a46f5bf10e8c6270767da';

   // Name for the ATZ Top Vars layer
   public static atzTopVarsLayerName: string = 'ATZ_Top_Vars';

   // ID for the ATZ Centroids layer
   public static atzCentroidsLayerId: string = '6053fb9b971245a6a61c3c20a2495732';

   // Name for the ATZ Centroids layer
   public static atzCentroidsLayerName: string = 'ATZ_Centroids';

   // ID for the DIG ATZ Top Vars layer
   public static digAtzTopVarsLayerId: string = '2393d7bb2ac547c4a6bfa3d16f8febaa';

   // Name for the DIG ATZ Top Vars layer
   public static digAtzTopVarsLayerName: string = 'DIG_ATZ_Top_Vars';

   // ID for the DIG ATZ Centroids layer
   public static digAtzCentroidsLayerId: string = '2acb6088bfbb4be1abd502ea3b20ecf6';

   // Name for the DIG ATZ Centroids layer
   public static digAtzCentroidsLayerName: string = 'DIG_ATZ_Centroids';

   // ID for the Wrap Top Vars layer
   public static wrapTopVarsLayerId: string = '09e5cdab538b43a4a6bd9a0d54b682a7';

   // Name for the Wrap Top Vars layer
   public static wrapTopVarsLayerName: string = 'WRAP_Top_Vars';

   // ID for the VT layer
   public static vtLayerId: string = '837f4f8be375464a8971c56a0856198e';

   // TODO: do we need a name for the VT layer?

   // ID for the Source layer
   public static sourceLayerId: string = '5a99095bc95b45a7a830c9e25a389712';

   // TODO: do we need a name for the Source layer?
}