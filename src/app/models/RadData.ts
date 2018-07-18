export class RadData {
    public radId: number;
    public category: string;
    public product: string;
    public source: number;
    public responseRate: number;
    public noOfCoupon: number;
    public avgTicket: number;
    public estCpm: number;
    public grossMargin: number;
}

export enum RADCategory {
    QSRPIZZA = 'QSR Pizza',
    AUTO_SERVICE = 'Auto Service/Parts',
    DISCOUNT_STORES = 'Discounts Stores',
    EDUCATION = 'Education',
    FINANCIAL_SERVICES = 'Financial Services',
    FULL_SERVICE_RESTAURANTS = 'Full Service Restaurants',
    HARDWARE_HOME_IMPROVEMENT = 'Hardware_Home Improvement Ctrs',
    HEALTH_AND_BEAUTY = 'Health and Beauty',
    HEALTHCARE = 'Healthcare',
    HEALTHCARE_OPTICAL = 'Healthcare_Optical',
    HOME_FURNISHING_MATTRESS = 'Home Furnishing_Mattress',
    HOME_SERVICES = 'Home Services',
    NON_PROFIT = 'Non-profit',
    PROFESSIONAL = 'Professional',
    QUICK_SERVICE_RESTAURANTS = 'Quick Service Restaurants',
    REMINDER = 'Reminder',
    RESEARCH = 'Research',
    RITUAL = 'Ritual',
    SPECIALTY_STORES = 'Specialty Stores',
    TELECOMMUNICATIONS = 'Telecommunications'
}

export enum RadProducts {
    CTRS_NP_MULTI_PAGE_INSERT = 'NP Multi page Insert',
    CTRS_SM_MULTI_PAGE_INSERT = 'SM Multi page Insert',
    FSI_COOP_OP = 'FSI Coop op',
    NP_INSERT = 'NP Insert',
    NP_MULTI_PAGE_INSERT = 'NP Multi page Insert',
    SM_COUPON_BOOKLET = 'SM Coupon Booklet',
    SM_INSERT = 'SM Insert',
    SM_MULTI_PAGE_INSERT = 'SM Multi page Insert',
    SM_POSTCARD = 'SM Postcard',
    SM_WRAP = 'SM Wrap',
    VPD = 'VDP'
}