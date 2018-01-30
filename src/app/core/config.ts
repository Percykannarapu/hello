
export let CONFIG = {
    baseUrls: {
      valServiceBase:   'https://servicesdev.valassislab.com/services/',
      config:           'commands/config',
      resetDb:          'commands/resetDb',
      geofootprintGeos: 'api/geofootprintGeos.json',
      esriApi:          'https://js.arcgis.com/4.3/'
    }
};

export class VariablesConfig
{
   public static maxBufferRadius: Number = 50;
}
