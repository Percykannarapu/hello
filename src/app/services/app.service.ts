// Added nallana: US6087  
import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { RestResponse } from '../Models/RestResponse';
import { EsriLoaderWrapperService } from './esri-loader-wrapper.service';
import { MapService } from './map.service';

@Injectable()
export class AppService {
    private static mapView: __esri.MapView;
    //public categoryList = './assets/demo/searchData/categories.json'; 
    public categoryList = [
        { category: 52, sic: '5211-14', name: 'ROOFING MATERIALS' },
        { category: 52, sic: '5211-15', name: 'SHINGLES & SHAKES' },
        { category: 52, sic: '5211-16', name: 'SCREENS-DOOR & WINDOW' },
        { category: 73, sic: '7342-08', name: 'SPRAYING-INSECT CONTROL' },
        { category: 73, sic: '7342-09', name: 'SMOKE ODOR COUNTERACTING' },
        { category: 73, sic: '7342-10', name: 'BEE REMOVAL' },
        { category: 75, sic: '7539-36', name: 'STEERING SYSTEMS & EQUIPMENT-REPAIRING' },
        { category: 75, sic: '7539-38', name: 'WHEEL SUSPENSION SYSTEMS' },
        { category: 75, sic: '7539-39', name: 'TRUCK AIR CONDITIONING EQUIP-REPAIRING' },
        { category: 80, sic: '8099-33', name: 'AIDS INFORMATION & TESTING' },
        { category: 80, sic: '8099-34', name: 'INSURANCE-MEDICAL EXAMINATIONS' },
        { category: 80, sic: '8099-35', name: 'BED WETTING CONTROL SYSTEMS' },
        { category: 80, sic: '8099-36', name: 'HEALTH EDUCATION' },
        { category: 54, sic: '5461-05', name: 'DOUGHNUTS' },
        { category: 54, sic: '5461-06', name: 'CAKE DECORATING' },
        { category: 54, sic: '5461-07', name: 'COOKIES & CRACKERS' },
        { category: 54, sic: '5461-08', name: 'PRETZELS-RETAIL' },
        { category: 55, sic: '5511-04', name: 'FOUR WHEEL DRIVE VEHICLES' },
        { category: 55, sic: '5511-05', name: 'TRUCK-DEALERS' },
        { category: 56, sic: '5611-16', name: 'UNDERWEAR-RETAIL' },
        { category: 56, sic: '5621-01', name: 'WOMENS APPAREL-RETAIL' },
        { category: 56, sic: '5621-03', name: 'MATERNITY APPAREL' },
        { category: 56, sic: '5621-04', name: 'BRIDAL SHOPS' },
        { category: 56, sic: '5621-05', name: 'BOUTIQUE ITEMS-RETAIL' },
        { category: 56, sic: '5621-08', name: 'MATERNITY SUPPORTS' },
        { category: 56, sic: '5621-10', name: 'WOMENS EXCHANGES' },
        { category: 56, sic: '5632-01', name: 'FUR-DESIGNERS' },
        { category: 56, sic: '5632-02', name: 'FUR BUSINESS-RETAIL' },
        { category: 56, sic: '5632-04', name: 'CORSETS GIRDLES & BRASSIERES' },
        { category: 56, sic: '5632-05', name: 'BRASSIERES' },
        { category: 56, sic: '5632-06', name: 'HOSIERY-RETAIL' },
        { category: 56, sic: '5632-07', name: 'HANDBAGS' },
        { category: 56, sic: '5632-08', name: 'KNIT GOODS-RETAIL' },
        { category: 56, sic: '5632-09', name: 'MILLINERY-RETAIL' },
        { category: 56, sic: '5632-10', name: 'LINGERIE' },
        { category: 56, sic: '5632-11', name: 'WOMENS SPECIALTY SHOPS' },
        { category: 56, sic: '5632-12', name: 'COSTUME JEWELRY' },
        { category: 56, sic: '5632-13', name: 'RHINESTONES-RETAIL' },
        { category: 56, sic: '5632-14', name: 'CHAINS-JEWELRY ORNAMENTAL' },
        { category: 56, sic: '5632-15', name: 'ACCESSORIES-FASHION' },
        { category: 56, sic: '5641-01', name: 'BABY ACCESSORIES' },
        { category: 56, sic: '5641-02', name: 'GIRLS APPAREL' },
        { category: 56, sic: '5641-03', name: 'CHILDRENS & INFANTS WEAR-RETAIL' },
        { category: 56, sic: '5641-04', name: 'INFANTS WEAR' },
        { category: 56, sic: '5641-14', name: 'UNDERWEAR-CHILDRENS' },
        { category: 56, sic: '5641-15', name: 'BABY ACCESSORIES-RENTAL' },
        { category: 57, sic: '5712-05', name: 'TABLE TOPS' },
        { category: 57, sic: '5712-06', name: 'WATER BEDS' },
        { category: 57, sic: '5712-07', name: 'FURNITURE-WICKER' },
        { category: 57, sic: '5712-08', name: 'APARTMENT FURNISHINGS' },
        { category: 72, sic: '7251-03', name: 'SHOE SHINING' },
        { category: 72, sic: '7251-04', name: 'SHOE DYERS' },
        { category: 82, sic: '8299-04', name: 'PERSONAL DEVELOPMENT SCHOOLS' },
        { category: 82, sic: '8299-05', name: 'VOCATIONAL GUIDANCE' },
        { category: 82, sic: '8299-06', name: 'PUBLIC SPEAKING INSTRUCTION' },
        { category: 82, sic: '8299-07', name: 'PHOTOGRAPHY SCHOOLS' },
        { category: 82, sic: '8299-08', name: 'READING IMPROVEMENT INSTRUCTION' },
        { category: 82, sic: '8299-09', name: 'TUTORING' },
        { category: 82, sic: '8299-10', name: 'FIRST AID INSTRUCTION' },
        { category: 82, sic: '8299-11', name: 'MANAGEMENT TRAINING' },
        { category: 82, sic: '8299-12', name: 'LANGUAGE SCHOOLS' },
        { category: 82, sic: '8299-13', name: 'MODELING SCHOOLS' },
        { category: 82, sic: '8299-14', name: 'MASSAGE SCHOOLS' },
        { category: 82, sic: '8299-15', name: 'MUSIC INSTRUCTION-VOCAL' },
        { category: 82, sic: '8299-16', name: 'MOTIVATIONAL & SELF IMPROVEMENT TRAINING' },
        { category: 82, sic: '8299-17', name: 'AIRCRAFT SCHOOLS' },
        { category: 82, sic: '8299-18', name: 'MUSIC INSTRUCTION-INSTRUMENTAL' },
        { category: 82, sic: '8299-19', name: 'ART INSTRUCTION & SCHOOLS' },
        { category: 82, sic: '8299-20', name: 'AIRLINE TRAINING SCHOOLS' },
        { category: 82, sic: '8299-21', name: 'CERAMICS-INSTRUCTION' },
        { category: 82, sic: '8299-22', name: 'BATON TWIRLING INSTRUCTION' },
        { category: 82, sic: '8299-23', name: 'CRAFT-INSTRUCTION' },
        { category: 82, sic: '8299-24', name: 'SCHOOLS-COOKING' },
        { category: 82, sic: '8299-25', name: 'DRAMATIC INSTRUCTION' },
        { category: 82, sic: '8299-26', name: 'EDUCATIONAL COOPERATIVE ORGANIZATIONS' },
        { category: 82, sic: '8299-27', name: 'DRIVING PROFICIENCY TEST SERVICE' },
        { category: 82, sic: '8299-28', name: 'KNITTING INSTRUCTION' },
        { category: 82, sic: '8299-29', name: 'EDUCATIONAL SERVICE-BUSINESS' },
        { category: 82, sic: '8299-30', name: 'PROGRAMMED INSTRUCTION' },
        { category: 82, sic: '8299-31', name: 'TRAINING PROGRAMS & SERVICES' },
        { category: 82, sic: '8299-32', name: 'LANGUAGE TRAINING AIDS' },
        { category: 82, sic: '8299-33', name: 'MATHEMATICIANS' },
        { category: 82, sic: '8299-34', name: 'PIANO-INSTRUCTIONS' },
        { category: 82, sic: '8299-35', name: 'SCHOOLS-TRAVEL AGENTS' },
        { category: 82, sic: '8299-37', name: 'ACADEMIC CAREER COORDINATION' },
        { category: 82, sic: '8299-38', name: 'MUSIC WORKSHOPS' },
        { category: 82, sic: '8299-39', name: 'SPEAKING-VOICE IMPROVEMENT' },
        { category: 82, sic: '8299-40', name: 'SCHOOLS-COLLEGE BOARD PREPARATION' },
        { category: 82, sic: '8299-42', name: 'STUDENT EXCHANGE PROGRAMS' },
        { category: 82, sic: '8299-43', name: 'FLIGHT AIRCRAFT INSTRUCTION' },
        { category: 82, sic: '8299-44', name: 'SCHOOLS WITH SPECIAL VOCATIONAL EDUC' },
        { category: 82, sic: '8299-45', name: 'SCHOOLS-ACROBATIC' },
        { category: 82, sic: '8299-46', name: 'SCHOOLS-FASHION' },
        { category: 82, sic: '8299-47', name: 'SAFETY CHILD EDUCATION' },
        { category: 82, sic: '8299-48', name: 'ASBESTOS TRAINING SERVICE' },
        { category: 82, sic: '8299-49', name: 'ASTROLOGY SCHOOLS' },
        { category: 82, sic: '8299-50', name: 'BACKPACKING & MOUNTAINEERING SCHOOLS' },
        { category: 82, sic: '8299-51', name: 'BAR REVIEW COURSES' },
        { category: 82, sic: '8299-52', name: 'CITIZENSHIP INSTRUCTION' },
        { category: 82, sic: '8299-53', name: 'CIVIL SERVICE SCHOOLS' },
        { category: 82, sic: '8299-54', name: 'FOREIGN EXCHANGE STUDENTS ORGANIZATIONS' },
        { category: 82, sic: '8299-55', name: 'JUGGLING INSTRUCTION' },
        { category: 82, sic: '8299-56', name: 'POTTERY INSTRUCTION' },
        { category: 82, sic: '8299-57', name: 'TAILORING INSTRUCTION' },
        { category: 82, sic: '8299-58', name: 'PROGRAM SERVICE-EDUCATIONAL' },
        { category: 82, sic: '8299-59', name: 'PERSONALITY DEVELOPMENT' },
        { category: 82, sic: '8299-61', name: 'CARDIOPULMONARY RESUSCITATION INFO/SVCS' },
        { category: 82, sic: '8299-62', name: 'CASINO GAMBLING INSTRUCTION' },
        { category: 82, sic: '8299-65', name: 'NEURO-LINGUISTIC PROGRAMMING' },
        { category: 82, sic: '8299-66', name: 'MEMORY TRAINING IMPROVEMENTS' },
        { category: 82, sic: '8299-67', name: 'MOTORCYCLE INSTRUCTION' },
        { category: 82, sic: '8299-68', name: 'WOOD-TECHNOLOGISTS' },
        { category: 82, sic: '8299-69', name: 'TIME MANAGEMENT TRAINING' },
        { category: 82, sic: '8299-70', name: 'ETIQUETTE SCHOOLS' },
        { category: 82, sic: '8299-71', name: 'EMPLOYEES EDUCATIONAL SYSTEMS' },
        { category: 82, sic: '8299-72', name: 'EDUCATION CENTERS' },
        { category: 82, sic: '8299-73', name: 'TRAFFIC VIOLATORS SERVICE' },
        { category: 82, sic: '8299-74', name: 'TELEPHONE TRAINING' },
        { category: 82, sic: '8299-75', name: 'SPORTS-TUTORING' },
        { category: 82, sic: '8299-77', name: 'SCHOOLS-PERFORMING ARTS' },
        { category: 82, sic: '8299-78', name: 'SPACE EDUCATION PROGRAMS' },
        { category: 82, sic: '8299-79', name: 'MUSIC SCHOOLS' },
        { category: 82, sic: '8299-80', name: 'CIRCUS TRAINING AND INSTRUCTION' },
        { category: 82, sic: '8299-99', name: 'SCHOOLS & EDUCATIONAL SERVICES NEC' }


    ]

    /* saveTargetingProfile(targetingprofile : TargetingProfile){
         
                 console.log("fired GeoFootPrint saveTarhetingProfile Service "+JSON.stringify(targetingprofile,null,4));
                
                 return this.http.post("http://servicesdev.valassislab.com/services/v1/targeting/base/targetingprofile/save", targetingprofile).map(res => res.json() as RestResponse);
         
             } */
    private readonly searchbusiness = 'https://servicesdev.valassislab.com/services/v1/targeting/base/targetingsearch/search';


    constructor(private http: Http, private mapService: MapService) { }
    //load values from the json 
    // public getList(): Observable<any> {
    //     return this.http.get(`${this.categoryList}`)
    //         .map((resp: Response) => resp.json());
    // }

    //use the getbusiness method to get the data from the service
    public getBusinesses(paramObj): Observable<any> {

        console.log("Fired getbusiness");
        return this.http.post(`${this.searchbusiness}`, paramObj)
            .map((resp: Response) => resp.json() as RestResponse);

    }

    // businessSearch(paramObj){
    //     console.log("Fired business Search Api")
    //     return this.http.post("https://servicesdev.valassislab.com/services/v1/targeting/base/targetingsearch/search",paramObj).map(res => res.json() as RestResponse);
    // }


}