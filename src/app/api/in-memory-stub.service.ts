import { InMemoryDbService } from 'angular-in-memory-web-api';

export class InMemoryStubService implements InMemoryDbService {
   /**
    * Stubs data for in memory database services.
    **/
   createDb() {
       console.log('creating in memory service...');
       const amSites = [
         {
            id:             0,
            rank:           1,
            pk:             11442193,
            fk_profile:     396936,
            xcoord:         -83.647572,
            ycoord:         42.230529,
            site_type:      1,
            site_id:        '11442193',
            name:           'Taco Bell',
            owner:          '',
            franchisee:     'T',
            address:        '2351 ELLSWORTH RD',
            cross_street:   '',
            city:           'YPSILANTI',
            state:          'MI',
            zip:            '48197',
            ta_source:      1,
            xml_location:   '<siteloc loctype="0"/>',
            xml_tradearea:  '<tadefs><talist key="1" geotype="-1" include=""/><talist key="2" geotype="-1" include=""/><talist key="3" geotype="-1" include=""/><talist key="4" geotype="-1" include=""/></tadefs>',
            create_type:    1,
            grouping:       ''
         },
         {
            id:             1,
            rank:           1,
            pk:             11442143,
            fk_profile:     396936,
            xcoord:         -83.597181,
            ycoord:         42.238105,
            site_type:      1,
            site_id:        '11442143',
            name:           'Taco Bell',
            owner:          '',
            franchisee:     'T',
            address:        '210 ECORSE RD',
            cross_street:   '',
            city:           'YPSILANTI',
            state:          'MI',
            zip:            '48198',
            ta_source:      1,
            xml_location:   '<siteloc loctype="0"/>',
            xml_tradearea:  '<tadefs><talist key="1" geotype="-1" include=""/><talist key="2" geotype="-1" include=""/><talist key="3" geotype="-1" include=""/><talist key="4" geotype="-1" include=""/></tadefs>',
            create_type:    1,
            grouping:       ''
         },
         {
            id:             2,
            rank:           1,
            pk:             5034821,
            fk_profile:     235871,
            xcoord:         -83.435303,
            ycoord:         42.440899,
            site_type:      1,
            site_id:        '5034821',
            name:           'Taco Bell',
            owner:          '',
            franchisee:     'T',
            address:        '21090 HAGGERTY RD',
            cross_street:   '',
            city:           'NOVI',
            state:          'MI',
            zip:            '48375',
            ta_source:      1,
            xml_location:   '<siteloc loctype="0"/>',
            xml_tradearea:  '<tadefs><talist key="1" geotype="-1" include=""/><talist key="2" geotype="-1" include=""/><talist key="3" geotype="-1" include=""/><talist key="4" geotype="-1" include=""/></tadefs>',
            create_type:    1,
            grouping:       ''
         },
         {
            id:             3,
            rank:           1,
            pk:             5749479,
            fk_profile:     260784,
            xcoord:         -83.434998,
            ycoord:         42.441368,
            site_type:      1,
            site_id:        '5749479',
            name:           'Taco Bell',
            owner:          '',
            franchisee:     'T',
            address:        '21090 HAGGERTY RD',
            cross_street:   '',
            city:           'NOVI',
            state:          'MI',
            zip:            '48375',
            ta_source:      1,
            xml_location:   '<siteloc loctype="0"/>',
            xml_tradearea:  '<tadefs><talist key="1" geotype="-1" include=""/><talist key="2" geotype="-1" include=""/><talist key="3" geotype="-1" include=""/><talist key="4" geotype="-1" include=""/></tadefs>',
            create_type:    1,
            grouping:       ''
         },
         {
            id:             4,
            rank:           1,
            pk:             9311003,
            fk_profile:     349633,
            xcoord:         -83.285853,
            ycoord:         42.108274,
            site_type:      1,
            site_id:        '9311003',
            name:           'Taco Bell',
            owner:          '',
            franchisee:     'T',
            address:        '27067 TELEGRAPH RD',
            cross_street:   '',
            city:           'FLAT ROCK',
            state:          'MI',
            zip:            '48134',
            ta_source:      1,
            xml_location:   '<siteloc loctype="0"/>',
            xml_tradearea:  '<tadefs><talist key="1" geotype="-1" include=""/><talist key="2" geotype="-1" include=""/><talist key="3" geotype="-1" include=""/><talist key="4" geotype="-1" include=""/></tadefs>',
            create_type:    1,
            grouping:       ''
         },
         {
            id:             5,
            rank:           1,
            pk:             9311070,
            fk_profile:     349633,
            xcoord:         -83.267769,
            ycoord:         42.197632,
            site_type:      1,
            site_id:        '9311070',
            name:           'Taco Bell',
            owner:          '',
            franchisee:     'T',
            address:        '14839 TELEGRAPH RD',
            cross_street:   '',
            city:           'TAYLOR',
            state:          'MI',
            zip:            '48180',
            ta_source:      1,
            xml_location:   '<siteloc loctype="0"/>',
            xml_tradearea:  '<tadefs><talist key="1" geotype="-1" include=""/><talist key="2" geotype="-1" include=""/><talist key="3" geotype="-1" include=""/><talist key="4" geotype="-1" include=""/></tadefs>',
            create_type:    1,
            grouping:       ''
         },
         {
            id:             6,
            rank:           1,
            pk:             9278733,
            fk_profile:     349574,
            xcoord:         -83.226292,
            ycoord:         42.143483,
            site_type:      1,
            site_id:        '9278733',
            name:           'Taco Bell',
            owner:          '',
            franchisee:     'T',
            address:        '22670 ALLEN RD',
            cross_street:   '',
            city:           'WOODHAVEN',
            state:          'MI',
            zip:            '48183',
            ta_source:      1,
            xml_location:   '<siteloc loctype="0"/>',
            xml_tradearea:  '<tadefs><talist key="1" geotype="-1" include=""/><talist key="2" geotype="-1" include=""/><talist key="3" geotype="-1" include=""/><talist key="4" geotype="-1" include=""/></tadefs>',
            create_type:    1,
            grouping:       ''
         },
         {
            id:             7,
            rank:           1,
            pk:             9279124,
            fk_profile:     349574,
            xcoord:         -83.189244,
            ycoord:         42.17182,
            site_type:      1,
            site_id:        '9279124',
            name:           'Taco Bell',
            owner:          '',
            franchisee:     'T',
            address:        '18718 FORT ST',
            cross_street:   '',
            city:           'RIVERVIEW',
            state:          'MI',
            zip:            '48193',
            ta_source:      1,
            xml_location:   '<siteloc loctype="0"/>',
            xml_tradearea:  '<tadefs><talist key="1" geotype="-1" include=""/><talist key="2" geotype="-1" include=""/><talist key="3" geotype="-1" include=""/><talist key="4" geotype="-1" include=""/></tadefs>',
            create_type:    1,
            grouping:       ''
         },
        ];

      const geofootprintGeos = [
      {
         id:              0,
         gg_id:           7359400,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48185B1',
         geo_sort_order:  1,
         hhc:             2115,
         distance:        .39
      },
      {
         id:              1,
         gg_id:           7359401,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48185C1',
         geo_sort_order:  2,
         hhc:             2314,
         distance:        .86
      },
      {
         id:              2,
         gg_id:           7359402,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48185F1',
         geo_sort_order:  3,
         hhc:             6521,
         distance:        1.08
      },
      {
         id:              3,
         gg_id:           7359403,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48151',
         geo_sort_order:  4,
         hhc:             0,
         distance:        1.43
      },
      {
         id:              4,
         gg_id:           7359404,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48153',
         geo_sort_order:  5,
         hhc:             0,
         distance:        1.43
      },
      {
         id:              5,
         gg_id:           7359405,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48150D1',
         geo_sort_order:  6,
         hhc:             2727,
         distance:        1.51
      },
      {
         id:              6,
         gg_id:           7359406,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48185J1',
         geo_sort_order:  7,
         hhc:             3540,
         distance:        1.64
      },
      {
         id:              7,
         gg_id:           7359407,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48150C1',
         geo_sort_order:  8,
         hhc:             4276,
         distance:        1.73
      },
      {
         id:              8,
         gg_id:           7359408,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48135C1',
         geo_sort_order:  9,
         hhc:             3535,
         distance:        2.03
      },
      {
         id:              9,
         gg_id:           7359409,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48185G1',
         geo_sort_order:  10,
         hhc:             4288,
         distance:        2.17
      },
      {
         id:              10,
         gg_id:           7359410,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48185D1',
         geo_sort_order:  11,
         hhc:             5449,
         distance:        2.59
      },
      {
         id:              11,
         gg_id:           7359411,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48135B1',
         geo_sort_order:  12,
         hhc:             2929,
         distance:        2.68
      },
      {
         id:              12,
         gg_id:           7359412,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48187F1',
         geo_sort_order:  13,
         hhc:             2345,
         distance:        2.83
      },
      {
         id:              13,
         gg_id:           7359413,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48150B1',
         geo_sort_order:  14,
         hhc:             4293,
         distance:        3.01
      },
      {
         id:              14,
         gg_id:           7359414,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48136',
         geo_sort_order:  15,
         hhc:             0,
         distance:        3.06
      },
      {
         id:              15,
         gg_id:           7359415,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48186C1',
         geo_sort_order:  16,
         hhc:             4086,
         distance:        3.12
      },
      {
         id:              16,
         gg_id:           7359416,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48186B1',
         geo_sort_order:  17,
         hhc:             3327,
         distance:        3.28
      },
      {
         id:              17,
         gg_id:           7359417,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48135D1',
         geo_sort_order:  18,
         hhc:             4800,
         distance:        3.49
      },
      {
         id:              18,
         gg_id:           7359418,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48170G1',
         geo_sort_order:  19,
         hhc:             3347,
         distance:        3.55
      },
      {
         id:              19,
         gg_id:           7359419,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48154D1',
         geo_sort_order:  20,
         hhc:             4134,
         distance:        3.6
      },
      {
         id:              20,
         gg_id:           7359420,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48187B1',
         geo_sort_order:  21,
         hhc:             4016,
         distance:        3.67
      },
      {
         id:              21,
         gg_id:           7359421,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48186D1',
         geo_sort_order:  22,
         hhc:             4483,
         distance:        3.69
      },
      {
         id:              22,
         gg_id:           7359422,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48154B1',
         geo_sort_order:  23,
         hhc:             3766,
         distance:        3.72
      },
      {
         id:              23,
         gg_id:           7359423,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48154F1',
         geo_sort_order:  24,
         hhc:             4132,
         distance:        3.94
      },
      {
         id:              24,
         gg_id:           7359424,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48127F1',
         geo_sort_order:  25,
         hhc:             4105,
         distance:        4.28
      },
      {
         id:              25,
         gg_id:           7359425,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48141B1',
         geo_sort_order:  26,
         hhc:             2700,
         distance:        4.32
      },
      {
         id:              26,
         gg_id:           7359426,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48187J1',
         geo_sort_order:  27,
         hhc:             4200,
         distance:        4.34
      },
      {
         id:              27,
         gg_id:           7359427,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48170D1',
         geo_sort_order:  28,
         hhc:             3045,
         distance:        4.38
      },
      {
         id:              28,
         gg_id:           7359428,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48186F1',
         geo_sort_order:  29,
         hhc:             2597,
         distance:        4.46
      },
      {
         id:              29,
         gg_id:           7359429,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48184C1',
         geo_sort_order:  30,
         hhc:             3565,
         distance:        4.66
      },
      {
         id:              30,
         gg_id:           7359430,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48154C1',
         geo_sort_order:  31,
         hhc:             3128,
         distance:        4.75
      },
      {
         id:              31,
         gg_id:           7359431,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48127D1',
         geo_sort_order:  32,
         hhc:             2446,
         distance:        4.84
      },
      {
         id:              32,
         gg_id:           7359432,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48239B1',
         geo_sort_order:  33,
         hhc:             4186,
         distance:        4.88
      },
      {
         id:              33,
         gg_id:           7359433,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48187D1',
         geo_sort_order:  34,
         hhc:             3090,
         distance:        4.9
      },
      {
         id:              34,
         gg_id:           7359434,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48188C1',
         geo_sort_order:  35,
         hhc:             3854,
         distance:        4.92
      },
      {
         id:              35,
         gg_id:           7359435,
         fk_cgm_id:       39912,
         fk_profile:      477599,
         fk_site:         11986684,
         fk_trade_area:   1,
         geocode:         '48141D1',
         geo_sort_order:  36,
         hhc:             4475,
         distance:        4.96
      },
     ];
     return { geofootprintGeos, amSites };
  }
}
