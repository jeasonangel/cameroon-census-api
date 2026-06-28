import bcrypt from 'bcrypt';
import { pool, query } from '../db/pool.js';
import { config, RATE_LIMITS } from '../config/index.js';
import { generateApiKey, hashApiKey } from '../utils/apiKey.js';

// ============================================================
// 1. REGIONS (10 Regions of Cameroon)
// ============================================================
const REGIONS: Array<{
  code: string;
  name: string;
  population: number;
  area_km2: number;
  lat: number;
  lng: number;
}> = [
  { code: 'AD', name: 'Adamaoua',  population: 1_200_000, area_km2: 63701, lat: 6.5,  lng: 12.5 },
  { code: 'CE', name: 'Centre',    population: 4_800_000, area_km2: 68953, lat: 3.87, lng: 11.52 },
  { code: 'ES', name: 'East',      population: 2_300_000, area_km2: 109002, lat: 4.5, lng: 14.5 },
  { code: 'FN', name: 'Far North', population: 1_400_000, area_km2: 34263, lat: 10.6, lng: 14.3 },
  { code: 'LT', name: 'Littoral',  population: 3_800_000, area_km2: 20248, lat: 4.05, lng: 9.7 },
  { code: 'NO', name: 'North',     population: 2_900_000, area_km2: 66090, lat: 9.3,  lng: 13.4 },
  { code: 'NW', name: 'Northwest', population: 1_800_000, area_km2: 17300, lat: 6.0,  lng: 10.15 },
  { code: 'WS', name: 'West',      population: 3_200_000, area_km2: 13892, lat: 5.47, lng: 10.42 },
  { code: 'SW', name: 'Southwest', population: 1_600_000, area_km2: 25410, lat: 4.15, lng: 9.23 },
  { code: 'SO', name: 'South',     population: 2_500_000, area_km2: 47191, lat: 2.93, lng: 11.15 },
];

// ============================================================
// 2. DEPARTMENTS (58 Departments of Cameroon)
// ============================================================
const DEPARTMENTS: Array<{
  code: string;
  name: string;
  region_code: string;
  population: number;
  area_km2: number;
}> = [
  // Adamaoua (AD)
  { code: 'DJ', name: 'Djérem', region_code: 'AD', population: 180000, area_km2: 13133 },
  { code: 'FA', name: 'Faro-et-Déo', region_code: 'AD', population: 95000, area_km2: 7106 },
  { code: 'MB', name: 'Mayo-Banyo', region_code: 'AD', population: 120000, area_km2: 6115 },
  { code: 'MBE', name: 'Mbéré', region_code: 'AD', population: 280000, area_km2: 14323 },
  { code: 'VN', name: 'Vina', region_code: 'AD', population: 525000, area_km2: 16996 },
  
  // Centre (CE)
  { code: 'HK', name: 'Haute-Sanaga', region_code: 'CE', population: 145000, area_km2: 11515 },
  { code: 'LE', name: 'Lekié', region_code: 'CE', population: 354000, area_km2: 8239 },
  { code: 'MB', name: 'Mbam-et-Inoubou', region_code: 'CE', population: 234000, area_km2: 5200 },
  { code: 'ME', name: 'Mbam-et-Kim', region_code: 'CE', population: 134000, area_km2: 5480 },
  { code: 'MF', name: 'Mfoundi', region_code: 'CE', population: 1850000, area_km2: 297 },
  { code: 'MS', name: 'Méfou-et-Afamba', region_code: 'CE', population: 312000, area_km2: 4311 },
  { code: 'MY', name: 'Méfou-et-Akono', region_code: 'CE', population: 158000, area_km2: 2915 },
  { code: 'NY', name: 'Nyong-et-Kéllé', region_code: 'CE', population: 145000, area_km2: 6300 },
  { code: 'NS', name: 'Nyong-et-So\'o', region_code: 'CE', population: 178000, area_km2: 5825 },
  
  // East (ES)
  { code: 'BO', name: 'Boumba-et-Ngoko', region_code: 'ES', population: 95000, area_km2: 30389 },
  { code: 'HA', name: 'Haut-Nyong', region_code: 'ES', population: 250000, area_km2: 31200 },
  { code: 'KO', name: 'Kadey', region_code: 'ES', population: 340000, area_km2: 15586 },
  { code: 'LO', name: 'Lom-et-Djérem', region_code: 'ES', population: 265000, area_km2: 26345 },
  
  // Far North (FN)
  { code: 'DI', name: 'Diamaré', region_code: 'FN', population: 250000, area_km2: 4200 },
  { code: 'LO', name: 'Logone-et-Chari', region_code: 'FN', population: 380000, area_km2: 11400 },
  { code: 'MA', name: 'Mayo-Danay', region_code: 'FN', population: 250000, area_km2: 5328 },
  { code: 'MK', name: 'Mayo-Kani', region_code: 'FN', population: 320000, area_km2: 2326 },
  { code: 'MS', name: 'Mayo-Sava', region_code: 'FN', population: 120000, area_km2: 2736 },
  { code: 'MT', name: 'Mayo-Tsanaga', region_code: 'FN', population: 350000, area_km2: 4390 },
  
  // Littoral (LT)
  { code: 'MO', name: 'Moungo', region_code: 'LT', population: 720000, area_km2: 6360 },
  { code: 'NK', name: 'Nkam', region_code: 'LT', population: 160000, area_km2: 5800 },
  { code: 'WO', name: 'Wouri', region_code: 'LT', population: 2900000, area_km2: 1580 },
  { code: 'SA', name: 'Sanaga-Maritime', region_code: 'LT', population: 185000, area_km2: 10000 },
  
  // North (NO)
  { code: 'BE', name: 'Bénoué', region_code: 'NO', population: 850000, area_km2: 12970 },
  { code: 'FA', name: 'Faro', region_code: 'NO', population: 180000, area_km2: 3290 },
  { code: 'ML', name: 'Mayo-Louti', region_code: 'NO', population: 410000, area_km2: 4160 },
  { code: 'MR', name: 'Mayo-Rey', region_code: 'NO', population: 340000, area_km2: 12130 },
  
  // Northwest (NW)
  { code: 'BO', name: 'Boyo', region_code: 'NW', population: 180000, area_km2: 1590 },
  { code: 'BU', name: 'Bui', region_code: 'NW', population: 330000, area_km2: 2300 },
  { code: 'DO', name: 'Donga-Mantung', region_code: 'NW', population: 280000, area_km2: 4270 },
  { code: 'ME', name: 'Menchum', region_code: 'NW', population: 150000, area_km2: 1200 },
  { code: 'MEO', name: 'Mezam', region_code: 'NW', population: 450000, area_km2: 1760 },
  { code: 'MO', name: 'Momo', region_code: 'NW', population: 250000, area_km2: 2340 },
  { code: 'NG', name: 'Ngo-Ketunjia', region_code: 'NW', population: 160000, area_km2: 1700 },
  
  // West (WS)
  { code: 'BO', name: 'Bamboutos', region_code: 'WS', population: 280000, area_km2: 1160 },
  { code: 'HA', name: 'Haut-Nkam', region_code: 'WS', population: 280000, area_km2: 985 },
  { code: 'HO', name: 'Hauts-Plateaux', region_code: 'WS', population: 260000, area_km2: 1010 },
  { code: 'KO', name: 'Koung-Khi', region_code: 'WS', population: 220000, area_km2: 1510 },
  { code: 'ME', name: 'Ménoua', region_code: 'WS', population: 320000, area_km2: 1380 },
  { code: 'MI', name: 'Mifi', region_code: 'WS', population: 310000, area_km2: 400 },
  { code: 'ND', name: 'Ndé', region_code: 'WS', population: 150000, area_km2: 1520 },
  { code: 'NOU', name: 'Noun', region_code: 'WS', population: 330000, area_km2: 6750 },
  
  // Southwest (SW)
  { code: 'FA', name: 'Fako', region_code: 'SW', population: 480000, area_km2: 2090 },
  { code: 'KO', name: 'Koupé-Manengouba', region_code: 'SW', population: 160000, area_km2: 3260 },
  { code: 'LE', name: 'Lebialem', region_code: 'SW', population: 150000, area_km2: 699 },
  { code: 'MA', name: 'Manyu', region_code: 'SW', population: 180000, area_km2: 9524 },
  { code: 'ME', name: 'Meme', region_code: 'SW', population: 210000, area_km2: 3100 },
  { code: 'NI', name: 'Ndian', region_code: 'SW', population: 220000, area_km2: 2100 },
  
  // South (SO)
  { code: 'DJ', name: 'Dja-et-Lobo', region_code: 'SO', population: 380000, area_km2: 17850 },
  { code: 'MV', name: 'Mvila', region_code: 'SO', population: 350000, area_km2: 8760 },
  { code: 'OC', name: 'Océan', region_code: 'SO', population: 330000, area_km2: 12000 },
  { code: 'VL', name: 'Vallée-du-Ntem', region_code: 'SO', population: 140000, area_km2: 7830 },
];

// ============================================================
// 3. INDICATORS (50+ Indicators)
// ============================================================
const INDICATORS = [
  // Demography
  { code: 'POP_TOT', name: 'Total Population', unit: 'people', category: 'Demography', description: 'Total resident population' },
  { code: 'POP_MALE', name: 'Male Population', unit: 'people', category: 'Demography', description: 'Male population' },
  { code: 'POP_FEMALE', name: 'Female Population', unit: 'people', category: 'Demography', description: 'Female population' },
  { code: 'POP_URBAN', name: 'Urban Population', unit: 'people', category: 'Demography', description: 'Population living in urban areas' },
  { code: 'POP_RURAL', name: 'Rural Population', unit: 'people', category: 'Demography', description: 'Population living in rural areas' },
  { code: 'POP_YOUNG', name: 'Young Population (0-14)', unit: 'people', category: 'Demography', description: 'Population aged 0-14 years' },
  { code: 'POP_ADULT', name: 'Adult Population (15-64)', unit: 'people', category: 'Demography', description: 'Population aged 15-64 years' },
  { code: 'POP_ELDERLY', name: 'Elderly Population (65+)', unit: 'people', category: 'Demography', description: 'Population aged 65 years and above' },
  { code: 'DENSITY', name: 'Population Density', unit: 'people/km²', category: 'Demography', description: 'Population per square kilometer' },
  { code: 'GROWTH_RATE', name: 'Population Growth Rate', unit: '%', category: 'Demography', description: 'Annual population growth rate' },
  
  // Education
  { code: 'LIT_RATE', name: 'Literacy Rate', unit: '%', category: 'Education', description: 'Adult literacy rate' },
  { code: 'LIT_MALE', name: 'Male Literacy Rate', unit: '%', category: 'Education', description: 'Male literacy rate' },
  { code: 'LIT_FEMALE', name: 'Female Literacy Rate', unit: '%', category: 'Education', description: 'Female literacy rate' },
  { code: 'SCHOOL_ENROLL', name: 'School Enrollment', unit: '%', category: 'Education', description: 'Gross school enrollment rate' },
  { code: 'SCHOOL_PRIMARY', name: 'Primary School Enrollment', unit: '%', category: 'Education', description: 'Primary school enrollment rate' },
  { code: 'SCHOOL_SECONDARY', name: 'Secondary School Enrollment', unit: '%', category: 'Education', description: 'Secondary school enrollment rate' },
  { code: 'NUMBER_SCHOOLS', name: 'Number of Schools', unit: 'facilities', category: 'Education', description: 'Total number of schools' },
  { code: 'PUPIL_TEACHER_RATIO', name: 'Pupil-Teacher Ratio', unit: 'ratio', category: 'Education', description: 'Average pupils per teacher' },
  
  // Health
  { code: 'INFANT_MORTALITY', name: 'Infant Mortality Rate', unit: 'per 1000', category: 'Health', description: 'Deaths under 1 year per 1000 live births' },
  { code: 'UNDER5_MORTALITY', name: 'Under-5 Mortality Rate', unit: 'per 1000', category: 'Health', description: 'Deaths under 5 years per 1000 live births' },
  { code: 'MATERNAL_MORTALITY', name: 'Maternal Mortality Ratio', unit: 'per 100000', category: 'Health', description: 'Maternal deaths per 100,000 live births' },
  { code: 'VACCINATION_RATE', name: 'Vaccination Coverage', unit: '%', category: 'Health', description: 'Children fully vaccinated' },
  { code: 'MALARIA_PREVALENCE', name: 'Malaria Prevalence', unit: '%', category: 'Health', description: 'Population with malaria infection' },
  { code: 'HIV_PREVALENCE', name: 'HIV Prevalence', unit: '%', category: 'Health', description: 'Population living with HIV' },
  { code: 'NUMBER_HOSPITALS', name: 'Number of Hospitals', unit: 'facilities', category: 'Health', description: 'Total hospitals and clinics' },
  { code: 'NUMBER_HEALTH_CENTERS', name: 'Health Centers', unit: 'facilities', category: 'Health', description: 'Primary health centers' },
  { code: 'DOCTOR_RATIO', name: 'Doctor-Population Ratio', unit: 'per 100000', category: 'Health', description: 'Doctors per 100,000 population' },
  
  // Housing & Infrastructure
  { code: 'WATER_ACCESS', name: 'Access to Clean Water', unit: '%', category: 'Housing', description: 'Households with clean water access' },
  { code: 'WATER_PIPED', name: 'Piped Water Access', unit: '%', category: 'Housing', description: 'Households with piped water' },
  { code: 'WATER_WELL', name: 'Well Water Access', unit: '%', category: 'Housing', description: 'Households using well water' },
  { code: 'ELECTRICITY_ACCESS', name: 'Access to Electricity', unit: '%', category: 'Housing', description: 'Households with electricity' },
  { code: 'SANITATION_BASIC', name: 'Basic Sanitation', unit: '%', category: 'Housing', description: 'Households with improved sanitation' },
  { code: 'SANITATION_UNIMPROVED', name: 'Unimproved Sanitation', unit: '%', category: 'Housing', description: 'Households without improved sanitation' },
  { code: 'HOUSING_MODERN', name: 'Modern Housing', unit: '%', category: 'Housing', description: 'Households in modern construction' },
  { code: 'INTERNET_ACCESS', name: 'Internet Access', unit: '%', category: 'Housing', description: 'Households with internet connection' },
  { code: 'MOBILE_PHONE_ACCESS', name: 'Mobile Phone Access', unit: '%', category: 'Housing', description: 'Households with mobile phone' },
  
  // Economy
  { code: 'EMPLOYMENT', name: 'Employment Rate', unit: '%', category: 'Economy', description: 'Working-age employment rate' },
  { code: 'UNEMPLOYMENT', name: 'Unemployment Rate', unit: '%', category: 'Economy', description: 'Labor force unemployment rate' },
  { code: 'YOUTH_UNEMPLOYMENT', name: 'Youth Unemployment', unit: '%', category: 'Economy', description: 'Youth aged 15-24 unemployment' },
  { code: 'AGRICULTURE_EMP', name: 'Agriculture Employment', unit: '%', category: 'Economy', description: 'Employment in agriculture' },
  { code: 'INDUSTRY_EMP', name: 'Industrial Employment', unit: '%', category: 'Economy', description: 'Employment in industry' },
  { code: 'SERVICES_EMP', name: 'Services Employment', unit: '%', category: 'Economy', description: 'Employment in services' },
  { code: 'POVERTY_RATE', name: 'Poverty Rate', unit: '%', category: 'Economy', description: 'Population below poverty line' },
  { code: 'EXTREME_POVERTY', name: 'Extreme Poverty Rate', unit: '%', category: 'Economy', description: 'Population in extreme poverty' },
  { code: 'AVG_INCOME', name: 'Average Monthly Income', unit: 'FCFA', category: 'Economy', description: 'Average household monthly income' },
  
  // Agriculture
  { code: 'CROP_AREA', name: 'Cultivated Area', unit: 'hectares', category: 'Agriculture', description: 'Total land under cultivation' },
  { code: 'MAIZE_PRODUCTION', name: 'Maize Production', unit: 'tons', category: 'Agriculture', description: 'Total maize production' },
  { code: 'CASSAVA_PRODUCTION', name: 'Cassava Production', unit: 'tons', category: 'Agriculture', description: 'Total cassava production' },
  { code: 'PLANTAIN_PRODUCTION', name: 'Plantain Production', unit: 'tons', category: 'Agriculture', description: 'Total plantain production' },
  { code: 'COCOA_PRODUCTION', name: 'Cocoa Production', unit: 'tons', category: 'Agriculture', description: 'Total cocoa production' },
  { code: 'COFFEE_PRODUCTION', name: 'Coffee Production', unit: 'tons', category: 'Agriculture', description: 'Total coffee production' },
  { code: 'LIVESTOCK_CATTLE', name: 'Cattle Population', unit: 'heads', category: 'Agriculture', description: 'Number of cattle' },
  { code: 'LIVESTOCK_GOATS', name: 'Goat Population', unit: 'heads', category: 'Agriculture', description: 'Number of goats' },
  { code: 'LIVESTOCK_SHEEP', name: 'Sheep Population', unit: 'heads', category: 'Agriculture', description: 'Number of sheep' },
  { code: 'LIVESTOCK_POULTRY', name: 'Poultry Population', unit: 'heads', category: 'Agriculture', description: 'Number of poultry' },
  { code: 'FOOD_INSECURE', name: 'Food Insecure Households', unit: '%', category: 'Agriculture', description: 'Households experiencing food insecurity' },
];

// ============================================================
// 4. DATA VALUES (Complete Data for All Regions)
// ============================================================
const DATA_VALUES: Record<string, Record<string, number>> = {
  // ... (keep your existing DATA_VALUES as is - they are already comprehensive)
  AD: { POP_TOT: 1_200_000, POP_MALE: 600_000, POP_FEMALE: 600_000, POP_URBAN: 360_000, POP_RURAL: 840_000, POP_YOUNG: 480_000, POP_ADULT: 660_000, POP_ELDERLY: 60_000, DENSITY: 18.8, GROWTH_RATE: 2.4, LIT_RATE: 55.0, LIT_MALE: 62.0, LIT_FEMALE: 48.0, SCHOOL_ENROLL: 70.0, SCHOOL_PRIMARY: 78.0, SCHOOL_SECONDARY: 45.0, NUMBER_SCHOOLS: 320, PUPIL_TEACHER_RATIO: 42, INFANT_MORTALITY: 85.0, UNDER5_MORTALITY: 120.0, MATERNAL_MORTALITY: 680, VACCINATION_RATE: 65.0, MALARIA_PREVALENCE: 18.5, HIV_PREVALENCE: 2.8, NUMBER_HOSPITALS: 8, NUMBER_HEALTH_CENTERS: 45, DOCTOR_RATIO: 2.5, WATER_ACCESS: 48.0, WATER_PIPED: 15.0, WATER_WELL: 55.0, ELECTRICITY_ACCESS: 25.0, SANITATION_BASIC: 30.0, SANITATION_UNIMPROVED: 70.0, HOUSING_MODERN: 22.0, INTERNET_ACCESS: 12.0, MOBILE_PHONE_ACCESS: 65.0, EMPLOYMENT: 60.0, UNEMPLOYMENT: 12.0, YOUTH_UNEMPLOYMENT: 18.0, AGRICULTURE_EMP: 72.0, INDUSTRY_EMP: 8.0, SERVICES_EMP: 20.0, POVERTY_RATE: 48.0, EXTREME_POVERTY: 22.0, AVG_INCOME: 45000, CROP_AREA: 85000, MAIZE_PRODUCTION: 32000, CASSAVA_PRODUCTION: 25000, PLANTAIN_PRODUCTION: 12000, COCOA_PRODUCTION: 500, COFFEE_PRODUCTION: 300, LIVESTOCK_CATTLE: 180000, LIVESTOCK_GOATS: 120000, LIVESTOCK_SHEEP: 85000, LIVESTOCK_POULTRY: 450000, FOOD_INSECURE: 28.0 },
  CE: { POP_TOT: 4_800_000, POP_MALE: 2_400_000, POP_FEMALE: 2_400_000, POP_URBAN: 3_200_000, POP_RURAL: 1_600_000, POP_YOUNG: 1_800_000, POP_ADULT: 2_700_000, POP_ELDERLY: 300_000, DENSITY: 69.6, GROWTH_RATE: 2.8, LIT_RATE: 85.2, LIT_MALE: 88.5, LIT_FEMALE: 81.9, SCHOOL_ENROLL: 92.5, SCHOOL_PRIMARY: 95.0, SCHOOL_SECONDARY: 78.0, NUMBER_SCHOOLS: 1200, PUPIL_TEACHER_RATIO: 35, INFANT_MORTALITY: 45.0, UNDER5_MORTALITY: 72.0, MATERNAL_MORTALITY: 420, VACCINATION_RATE: 78.5, MALARIA_PREVALENCE: 12.5, HIV_PREVALENCE: 3.2, NUMBER_HOSPITALS: 25, NUMBER_HEALTH_CENTERS: 180, DOCTOR_RATIO: 8.5, WATER_ACCESS: 71.4, WATER_PIPED: 35.0, WATER_WELL: 45.0, ELECTRICITY_ACCESS: 65.2, SANITATION_BASIC: 55.8, SANITATION_UNIMPROVED: 44.2, HOUSING_MODERN: 58.0, INTERNET_ACCESS: 45.0, MOBILE_PHONE_ACCESS: 88.0, EMPLOYMENT: 68.5, UNEMPLOYMENT: 12.3, YOUTH_UNEMPLOYMENT: 18.5, AGRICULTURE_EMP: 38.0, INDUSTRY_EMP: 18.0, SERVICES_EMP: 44.0, POVERTY_RATE: 38.5, EXTREME_POVERTY: 15.0, AVG_INCOME: 85000, CROP_AREA: 125000, MAIZE_PRODUCTION: 45000, CASSAVA_PRODUCTION: 32000, PLANTAIN_PRODUCTION: 25000, COCOA_PRODUCTION: 2000, COFFEE_PRODUCTION: 1500, LIVESTOCK_CATTLE: 120000, LIVESTOCK_GOATS: 80000, LIVESTOCK_SHEEP: 60000, LIVESTOCK_POULTRY: 650000, FOOD_INSECURE: 18.0 },
  ES: { POP_TOT: 2_300_000, POP_MALE: 1_150_000, POP_FEMALE: 1_150_000, POP_URBAN: 460_000, POP_RURAL: 1_840_000, POP_YOUNG: 920_000, POP_ADULT: 1_265_000, POP_ELDERLY: 115_000, DENSITY: 21.1, GROWTH_RATE: 2.6, LIT_RATE: 68.5, LIT_MALE: 74.2, LIT_FEMALE: 62.8, SCHOOL_ENROLL: 78.0, SCHOOL_PRIMARY: 85.0, SCHOOL_SECONDARY: 52.0, NUMBER_SCHOOLS: 350, PUPIL_TEACHER_RATIO: 40, INFANT_MORTALITY: 72.5, UNDER5_MORTALITY: 98.5, MATERNAL_MORTALITY: 580, VACCINATION_RATE: 68.5, MALARIA_PREVALENCE: 15.0, HIV_PREVALENCE: 2.8, NUMBER_HOSPITALS: 8, NUMBER_HEALTH_CENTERS: 50, DOCTOR_RATIO: 3.0, WATER_ACCESS: 50.3, WATER_PIPED: 18.0, WATER_WELL: 50.0, ELECTRICITY_ACCESS: 28.0, SANITATION_BASIC: 32.0, SANITATION_UNIMPROVED: 68.0, HOUSING_MODERN: 25.0, INTERNET_ACCESS: 15.0, MOBILE_PHONE_ACCESS: 55.0, EMPLOYMENT: 61.2, UNEMPLOYMENT: 14.0, YOUTH_UNEMPLOYMENT: 20.0, AGRICULTURE_EMP: 68.0, INDUSTRY_EMP: 10.0, SERVICES_EMP: 22.0, POVERTY_RATE: 52.5, EXTREME_POVERTY: 25.0, AVG_INCOME: 48000, CROP_AREA: 95000, MAIZE_PRODUCTION: 28000, CASSAVA_PRODUCTION: 22000, PLANTAIN_PRODUCTION: 15000, COCOA_PRODUCTION: 3000, COFFEE_PRODUCTION: 2000, LIVESTOCK_CATTLE: 90000, LIVESTOCK_GOATS: 60000, LIVESTOCK_SHEEP: 40000, LIVESTOCK_POULTRY: 350000, FOOD_INSECURE: 30.0 },
  FN: { POP_TOT: 1_400_000, POP_MALE: 700_000, POP_FEMALE: 700_000, POP_URBAN: 280_000, POP_RURAL: 1_120_000, POP_YOUNG: 560_000, POP_ADULT: 770_000, POP_ELDERLY: 70_000, DENSITY: 40.8, GROWTH_RATE: 3.0, LIT_RATE: 48.1, LIT_MALE: 55.5, LIT_FEMALE: 40.7, SCHOOL_ENROLL: 65.0, SCHOOL_PRIMARY: 72.0, SCHOOL_SECONDARY: 38.0, NUMBER_SCHOOLS: 280, PUPIL_TEACHER_RATIO: 45, INFANT_MORTALITY: 85.5, UNDER5_MORTALITY: 115.5, MATERNAL_MORTALITY: 720, VACCINATION_RATE: 58.5, MALARIA_PREVALENCE: 22.0, HIV_PREVALENCE: 1.8, NUMBER_HOSPITALS: 6, NUMBER_HEALTH_CENTERS: 35, DOCTOR_RATIO: 2.0, WATER_ACCESS: 38.5, WATER_PIPED: 10.0, WATER_WELL: 45.0, ELECTRICITY_ACCESS: 18.0, SANITATION_BASIC: 22.0, SANITATION_UNIMPROVED: 78.0, HOUSING_MODERN: 15.0, INTERNET_ACCESS: 8.0, MOBILE_PHONE_ACCESS: 45.0, EMPLOYMENT: 55.0, UNEMPLOYMENT: 16.0, YOUTH_UNEMPLOYMENT: 24.0, AGRICULTURE_EMP: 78.0, INDUSTRY_EMP: 5.0, SERVICES_EMP: 17.0, POVERTY_RATE: 62.5, EXTREME_POVERTY: 30.0, AVG_INCOME: 38000, CROP_AREA: 75000, MAIZE_PRODUCTION: 22000, CASSAVA_PRODUCTION: 18000, PLANTAIN_PRODUCTION: 8000, COCOA_PRODUCTION: 200, COFFEE_PRODUCTION: 100, LIVESTOCK_CATTLE: 150000, LIVESTOCK_GOATS: 100000, LIVESTOCK_SHEEP: 70000, LIVESTOCK_POULTRY: 300000, FOOD_INSECURE: 38.0 },
  LT: { POP_TOT: 3_800_000, POP_MALE: 1_900_000, POP_FEMALE: 1_900_000, POP_URBAN: 2_850_000, POP_RURAL: 950_000, POP_YOUNG: 1_400_000, POP_ADULT: 2_200_000, POP_ELDERLY: 200_000, DENSITY: 187.6, GROWTH_RATE: 3.2, LIT_RATE: 88.7, LIT_MALE: 91.2, LIT_FEMALE: 86.2, SCHOOL_ENROLL: 94.2, SCHOOL_PRIMARY: 97.0, SCHOOL_SECONDARY: 82.0, NUMBER_SCHOOLS: 950, PUPIL_TEACHER_RATIO: 32, INFANT_MORTALITY: 42.5, UNDER5_MORTALITY: 68.5, MATERNAL_MORTALITY: 380, VACCINATION_RATE: 82.5, MALARIA_PREVALENCE: 10.0, HIV_PREVALENCE: 3.8, NUMBER_HOSPITALS: 18, NUMBER_HEALTH_CENTERS: 150, DOCTOR_RATIO: 10.0, WATER_ACCESS: 77.8, WATER_PIPED: 42.0, WATER_WELL: 35.0, ELECTRICITY_ACCESS: 72.5, SANITATION_BASIC: 62.5, SANITATION_UNIMPROVED: 37.5, HOUSING_MODERN: 65.0, INTERNET_ACCESS: 50.0, MOBILE_PHONE_ACCESS: 92.0, EMPLOYMENT: 72.3, UNEMPLOYMENT: 8.5, YOUTH_UNEMPLOYMENT: 14.0, AGRICULTURE_EMP: 28.0, INDUSTRY_EMP: 25.0, SERVICES_EMP: 47.0, POVERTY_RATE: 32.5, EXTREME_POVERTY: 12.0, AVG_INCOME: 95000, CROP_AREA: 85000, MAIZE_PRODUCTION: 35000, CASSAVA_PRODUCTION: 28000, PLANTAIN_PRODUCTION: 22000, COCOA_PRODUCTION: 3500, COFFEE_PRODUCTION: 1000, LIVESTOCK_CATTLE: 80000, LIVESTOCK_GOATS: 50000, LIVESTOCK_SHEEP: 30000, LIVESTOCK_POULTRY: 500000, FOOD_INSECURE: 15.0 },
  NO: { POP_TOT: 2_900_000, POP_MALE: 1_450_000, POP_FEMALE: 1_450_000, POP_URBAN: 580_000, POP_RURAL: 2_320_000, POP_YOUNG: 1_160_000, POP_ADULT: 1_595_000, POP_ELDERLY: 145_000, DENSITY: 43.9, GROWTH_RATE: 2.8, LIT_RATE: 62.4, LIT_MALE: 68.5, LIT_FEMALE: 56.3, SCHOOL_ENROLL: 76.5, SCHOOL_PRIMARY: 82.0, SCHOOL_SECONDARY: 48.0, NUMBER_SCHOOLS: 320, PUPIL_TEACHER_RATIO: 42, INFANT_MORTALITY: 78.5, UNDER5_MORTALITY: 105.5, MATERNAL_MORTALITY: 620, VACCINATION_RATE: 65.5, MALARIA_PREVALENCE: 20.0, HIV_PREVALENCE: 2.2, NUMBER_HOSPITALS: 7, NUMBER_HEALTH_CENTERS: 40, DOCTOR_RATIO: 2.5, WATER_ACCESS: 42.3, WATER_PIPED: 12.0, WATER_WELL: 48.0, ELECTRICITY_ACCESS: 25.5, SANITATION_BASIC: 42.5, SANITATION_UNIMPROVED: 57.5, HOUSING_MODERN: 20.0, INTERNET_ACCESS: 10.0, MOBILE_PHONE_ACCESS: 55.0, EMPLOYMENT: 58.2, UNEMPLOYMENT: 14.5, YOUTH_UNEMPLOYMENT: 22.0, AGRICULTURE_EMP: 75.0, INDUSTRY_EMP: 8.0, SERVICES_EMP: 17.0, POVERTY_RATE: 58.5, EXTREME_POVERTY: 28.0, AVG_INCOME: 42000, CROP_AREA: 95000, MAIZE_PRODUCTION: 30000, CASSAVA_PRODUCTION: 24000, PLANTAIN_PRODUCTION: 14000, COCOA_PRODUCTION: 400, COFFEE_PRODUCTION: 200, LIVESTOCK_CATTLE: 160000, LIVESTOCK_GOATS: 110000, LIVESTOCK_SHEEP: 80000, LIVESTOCK_POULTRY: 400000, FOOD_INSECURE: 35.0 },
  NW: { POP_TOT: 1_800_000, POP_MALE: 900_000, POP_FEMALE: 900_000, POP_URBAN: 540_000, POP_RURAL: 1_260_000, POP_YOUNG: 720_000, POP_ADULT: 990_000, POP_ELDERLY: 90_000, DENSITY: 104.0, GROWTH_RATE: 2.5, LIT_RATE: 80.0, LIT_MALE: 84.0, LIT_FEMALE: 76.0, SCHOOL_ENROLL: 86.0, SCHOOL_PRIMARY: 90.0, SCHOOL_SECONDARY: 68.0, NUMBER_SCHOOLS: 380, PUPIL_TEACHER_RATIO: 38, INFANT_MORTALITY: 55.5, UNDER5_MORTALITY: 82.5, MATERNAL_MORTALITY: 480, VACCINATION_RATE: 72.5, MALARIA_PREVALENCE: 16.0, HIV_PREVALENCE: 2.5, NUMBER_HOSPITALS: 9, NUMBER_HEALTH_CENTERS: 55, DOCTOR_RATIO: 4.0, WATER_ACCESS: 60.0, WATER_PIPED: 22.0, WATER_WELL: 42.0, ELECTRICITY_ACCESS: 42.5, SANITATION_BASIC: 48.5, SANITATION_UNIMPROVED: 51.5, HOUSING_MODERN: 40.0, INTERNET_ACCESS: 25.0, MOBILE_PHONE_ACCESS: 75.0, EMPLOYMENT: 64.0, UNEMPLOYMENT: 11.5, YOUTH_UNEMPLOYMENT: 17.0, AGRICULTURE_EMP: 62.0, INDUSTRY_EMP: 12.0, SERVICES_EMP: 26.0, POVERTY_RATE: 48.5, EXTREME_POVERTY: 20.0, AVG_INCOME: 60000, CROP_AREA: 55000, MAIZE_PRODUCTION: 18000, CASSAVA_PRODUCTION: 15000, PLANTAIN_PRODUCTION: 12000, COCOA_PRODUCTION: 800, COFFEE_PRODUCTION: 1200, LIVESTOCK_CATTLE: 70000, LIVESTOCK_GOATS: 45000, LIVESTOCK_SHEEP: 30000, LIVESTOCK_POULTRY: 380000, FOOD_INSECURE: 22.0 },
  WS: { POP_TOT: 3_200_000, POP_MALE: 1_600_000, POP_FEMALE: 1_600_000, POP_URBAN: 960_000, POP_RURAL: 2_240_000, POP_YOUNG: 1_280_000, POP_ADULT: 1_760_000, POP_ELDERLY: 160_000, DENSITY: 230.3, GROWTH_RATE: 2.7, LIT_RATE: 78.4, LIT_MALE: 82.5, LIT_FEMALE: 74.3, SCHOOL_ENROLL: 88.5, SCHOOL_PRIMARY: 92.0, SCHOOL_SECONDARY: 72.0, NUMBER_SCHOOLS: 420, PUPIL_TEACHER_RATIO: 36, INFANT_MORTALITY: 52.5, UNDER5_MORTALITY: 78.5, MATERNAL_MORTALITY: 450, VACCINATION_RATE: 75.5, MALARIA_PREVALENCE: 14.0, HIV_PREVALENCE: 2.8, NUMBER_HOSPITALS: 10, NUMBER_HEALTH_CENTERS: 65, DOCTOR_RATIO: 5.0, WATER_ACCESS: 65.2, WATER_PIPED: 28.0, WATER_WELL: 40.0, ELECTRICITY_ACCESS: 48.5, SANITATION_BASIC: 52.5, SANITATION_UNIMPROVED: 47.5, HOUSING_MODERN: 45.0, INTERNET_ACCESS: 30.0, MOBILE_PHONE_ACCESS: 80.0, EMPLOYMENT: 65.8, UNEMPLOYMENT: 12.5, YOUTH_UNEMPLOYMENT: 18.0, AGRICULTURE_EMP: 58.0, INDUSTRY_EMP: 15.0, SERVICES_EMP: 27.0, POVERTY_RATE: 45.5, EXTREME_POVERTY: 18.0, AVG_INCOME: 65000, CROP_AREA: 68000, MAIZE_PRODUCTION: 22000, CASSAVA_PRODUCTION: 19000, PLANTAIN_PRODUCTION: 16000, COCOA_PRODUCTION: 2500, COFFEE_PRODUCTION: 1800, LIVESTOCK_CATTLE: 85000, LIVESTOCK_GOATS: 55000, LIVESTOCK_SHEEP: 38000, LIVESTOCK_POULTRY: 420000, FOOD_INSECURE: 20.0 },
  SW: { POP_TOT: 1_600_000, POP_MALE: 800_000, POP_FEMALE: 800_000, POP_URBAN: 480_000, POP_RURAL: 1_120_000, POP_YOUNG: 640_000, POP_ADULT: 880_000, POP_ELDERLY: 80_000, DENSITY: 63.0, GROWTH_RATE: 2.4, LIT_RATE: 82.5, LIT_MALE: 86.5, LIT_FEMALE: 78.5, SCHOOL_ENROLL: 89.0, SCHOOL_PRIMARY: 93.0, SCHOOL_SECONDARY: 70.0, NUMBER_SCHOOLS: 300, PUPIL_TEACHER_RATIO: 37, INFANT_MORTALITY: 48.5, UNDER5_MORTALITY: 72.5, MATERNAL_MORTALITY: 420, VACCINATION_RATE: 78.5, MALARIA_PREVALENCE: 15.0, HIV_PREVALENCE: 3.0, NUMBER_HOSPITALS: 8, NUMBER_HEALTH_CENTERS: 50, DOCTOR_RATIO: 4.5, WATER_ACCESS: 68.0, WATER_PIPED: 30.0, WATER_WELL: 38.0, ELECTRICITY_ACCESS: 52.5, SANITATION_BASIC: 56.5, SANITATION_UNIMPROVED: 43.5, HOUSING_MODERN: 48.0, INTERNET_ACCESS: 28.0, MOBILE_PHONE_ACCESS: 78.0, EMPLOYMENT: 66.5, UNEMPLOYMENT: 9.5, YOUTH_UNEMPLOYMENT: 15.0, AGRICULTURE_EMP: 55.0, INDUSTRY_EMP: 18.0, SERVICES_EMP: 27.0, POVERTY_RATE: 42.5, EXTREME_POVERTY: 16.0, AVG_INCOME: 70000, CROP_AREA: 48000, MAIZE_PRODUCTION: 15000, CASSAVA_PRODUCTION: 12000, PLANTAIN_PRODUCTION: 10000, COCOA_PRODUCTION: 3000, COFFEE_PRODUCTION: 800, LIVESTOCK_CATTLE: 60000, LIVESTOCK_GOATS: 38000, LIVESTOCK_SHEEP: 25000, LIVESTOCK_POULTRY: 300000, FOOD_INSECURE: 18.0 },
  SO: { POP_TOT: 2_500_000, POP_MALE: 1_250_000, POP_FEMALE: 1_250_000, POP_URBAN: 500_000, POP_RURAL: 2_000_000, POP_YOUNG: 1_000_000, POP_ADULT: 1_375_000, POP_ELDERLY: 125_000, DENSITY: 53.0, GROWTH_RATE: 2.6, LIT_RATE: 81.0, LIT_MALE: 85.0, LIT_FEMALE: 77.0, SCHOOL_ENROLL: 87.5, SCHOOL_PRIMARY: 91.0, SCHOOL_SECONDARY: 68.0, NUMBER_SCHOOLS: 350, PUPIL_TEACHER_RATIO: 38, INFANT_MORTALITY: 62.5, UNDER5_MORTALITY: 88.5, MATERNAL_MORTALITY: 520, VACCINATION_RATE: 70.5, MALARIA_PREVALENCE: 18.0, HIV_PREVALENCE: 2.5, NUMBER_HOSPITALS: 8, NUMBER_HEALTH_CENTERS: 48, DOCTOR_RATIO: 3.5, WATER_ACCESS: 66.5, WATER_PIPED: 25.0, WATER_WELL: 42.0, ELECTRICITY_ACCESS: 35.5, SANITATION_BASIC: 45.5, SANITATION_UNIMPROVED: 54.5, HOUSING_MODERN: 32.0, INTERNET_ACCESS: 20.0, MOBILE_PHONE_ACCESS: 68.0, EMPLOYMENT: 65.0, UNEMPLOYMENT: 13.5, YOUTH_UNEMPLOYMENT: 19.0, AGRICULTURE_EMP: 65.0, INDUSTRY_EMP: 12.0, SERVICES_EMP: 23.0, POVERTY_RATE: 55.5, EXTREME_POVERTY: 24.0, AVG_INCOME: 52000, CROP_AREA: 72000, MAIZE_PRODUCTION: 20000, CASSAVA_PRODUCTION: 16000, PLANTAIN_PRODUCTION: 13000, COCOA_PRODUCTION: 2000, COFFEE_PRODUCTION: 500, LIVESTOCK_CATTLE: 75000, LIVESTOCK_GOATS: 48000, LIVESTOCK_SHEEP: 32000, LIVESTOCK_POULTRY: 350000, FOOD_INSECURE: 25.0 },
};

// ============================================================
// 5. HISTORICAL DATA (2005 - Previous Census)
// ============================================================
const HISTORICAL_DATA: Record<string, Record<string, number>> = {
  CE: { POP_TOT: 3_098_044, LIT_RATE: 72.5, WATER_ACCESS: 58.7 },
  LT: { POP_TOT: 2_510_263, LIT_RATE: 75.2, WATER_ACCESS: 65.4 },
  WS: { POP_TOT: 2_172_687, LIT_RATE: 68.5, WATER_ACCESS: 55.2 },
  NO: { POP_TOT: 1_987_523, LIT_RATE: 55.2, WATER_ACCESS: 38.5 },
  AD: { POP_TOT: 884_289, LIT_RATE: 47.8, WATER_ACCESS: 38.2 },
  ES: { POP_TOT: 1_500_000, LIT_RATE: 58.5, WATER_ACCESS: 42.3 },
  FN: { POP_TOT: 950_000, LIT_RATE: 40.2, WATER_ACCESS: 32.5 },
  NW: { POP_TOT: 1_200_000, LIT_RATE: 72.0, WATER_ACCESS: 52.5 },
  SW: { POP_TOT: 1_100_000, LIT_RATE: 75.0, WATER_ACCESS: 58.0 },
  SO: { POP_TOT: 1_800_000, LIT_RATE: 72.5, WATER_ACCESS: 55.5 },
};

// ============================================================
// 6. SAMPLE DISTRICTS & VILLAGES (For testing geography hierarchy)
// ============================================================
const DISTRICTS: Array<{ code: string; name: string; department_code: string }> = [
  { code: 'Y1', name: 'Yaoundé 1er', department_code: 'MF' },
  { code: 'Y2', name: 'Yaoundé 2e', department_code: 'MF' },
  { code: 'Y3', name: 'Yaoundé 3e', department_code: 'MF' },
  { code: 'Y4', name: 'Yaoundé 4e', department_code: 'MF' },
  { code: 'Y5', name: 'Yaoundé 5e', department_code: 'MF' },
  { code: 'Y6', name: 'Yaoundé 6e', department_code: 'MF' },
  { code: 'D1', name: 'Douala 1er', department_code: 'WO' },
  { code: 'D2', name: 'Douala 2e', department_code: 'WO' },
  { code: 'D3', name: 'Douala 3e', department_code: 'WO' },
  { code: 'D4', name: 'Douala 4e', department_code: 'WO' },
  { code: 'D5', name: 'Douala 5e', department_code: 'WO' },
];

const VILLAGES: Array<{ name: string; district_code: string }> = [
  { name: 'Mvog-Mbi', district_code: 'Y1' },
  { name: 'Mvog-Meli', district_code: 'Y1' },
  { name: 'Etoa-Meki', district_code: 'Y1' },
  { name: 'Mokolo', district_code: 'Y2' },
  { name: 'Messa', district_code: 'Y2' },
  { name: 'Bastos', district_code: 'Y2' },
  { name: 'Bonanjo', district_code: 'D1' },
  { name: 'Bali', district_code: 'D1' },
  { name: 'Logbessou', district_code: 'D3' },
  { name: 'Yassa', district_code: 'D3' },
  { name: 'Makepe', district_code: 'D3' },
];

// ============================================================
// 7. MAIN SEED FUNCTION
// ============================================================
async function seed() {
  console.log('🌍 Seeding Cameroon Census Data...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // --- 7.1 Create unique constraint for data_values (if not exists) ---
    console.log('\n🔒 Ensuring unique constraint on data_values...');
    try {
      await query(`
        ALTER TABLE data_values 
        DROP CONSTRAINT IF EXISTS unique_data_value
      `);
      await query(`
        ALTER TABLE data_values 
        ADD CONSTRAINT unique_data_value 
        UNIQUE (geography_id, indicator_id, year, gender, age_group)
      `);
      console.log('  ✅ Unique constraint added');
    } catch (err) {
      console.warn('  ⚠️ Could not add unique constraint (may already exist)');
    }

    // --- 7.2 Insert Indicators ---
    console.log('\n📊 Seeding indicators...');
    for (const ind of INDICATORS) {
      await query(
        `INSERT INTO indicators (code, name, description, unit, category, source, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE)
         ON CONFLICT (code) DO UPDATE SET 
           name = EXCLUDED.name, 
           description = EXCLUDED.description,
           unit = EXCLUDED.unit, 
           category = EXCLUDED.category`,
        [ind.code, ind.name, ind.description, ind.unit, ind.category, 'Fictitious Census 2024']
      );
    }
    console.log(`  ✅ ${INDICATORS.length} indicators seeded`);

    // --- 7.3 Insert Regions ---
    console.log('\n🗺️ Seeding regions...');
    for (const r of REGIONS) {
      await query(
        `INSERT INTO spatial_geo (code, name, level, population, area_km2, latitude, longitude, geom)
         VALUES ($1, $2, 'region', $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326))
         ON CONFLICT (code) DO UPDATE SET
           name = EXCLUDED.name, 
           population = EXCLUDED.population,
           area_km2 = EXCLUDED.area_km2, 
           latitude = EXCLUDED.latitude,
           longitude = EXCLUDED.longitude, 
           geom = EXCLUDED.geom`,
        [r.code, r.name, r.population, r.area_km2, r.lat, r.lng, r.lng, r.lat]
      );
    }
    console.log(`  ✅ ${REGIONS.length} regions seeded`);

    // --- 7.4 Insert Departments ---
    console.log('\n🏛️ Seeding departments...');
    for (const d of DEPARTMENTS) {
      const region = await query<{ id: number }>(
        `SELECT id FROM spatial_geo WHERE code = $1 AND level = 'region'`,
        [d.region_code]
      );
      if (region.rowCount === 0) {
        console.warn(`  ⚠️ Region ${d.region_code} not found for department ${d.code}`);
        continue;
      }
      await query(
        `INSERT INTO spatial_geo (code, name, level, parent_id, population, area_km2)
         VALUES ($1, $2, 'department', $3, $4, $5)
         ON CONFLICT (code) DO UPDATE SET
           name = EXCLUDED.name,
           parent_id = EXCLUDED.parent_id,
           population = EXCLUDED.population,
           area_km2 = EXCLUDED.area_km2`,
        [d.code, d.name, region.rows[0].id, d.population, d.area_km2]
      );
    }
    console.log(`  ✅ ${DEPARTMENTS.length} departments seeded`);

    // --- 7.5 Insert Districts ---
    console.log('\n🏘️ Seeding districts...');
    for (const d of DISTRICTS) {
      const dept = await query<{ id: number }>(
        `SELECT id FROM spatial_geo WHERE code = $1 AND level = 'department'`,
        [d.department_code]
      );
      if (dept.rowCount === 0) {
        console.warn(`  ⚠️ Department ${d.department_code} not found for district ${d.code}`);
        continue;
      }
      await query(
        `INSERT INTO spatial_geo (code, name, level, parent_id)
         VALUES ($1, $2, 'district', $3)
         ON CONFLICT (code) DO UPDATE SET
           name = EXCLUDED.name,
           parent_id = EXCLUDED.parent_id`,
        [d.code, d.name, dept.rows[0].id]
      );
    }
    console.log(`  ✅ ${DISTRICTS.length} districts seeded`);

    // --- 7.6 Insert Villages ---
    console.log('\n🏡 Seeding villages...');
    for (const v of VILLAGES) {
      const district = await query<{ id: number }>(
        `SELECT id FROM spatial_geo WHERE code = $1 AND level = 'district'`,
        [v.district_code]
      );
      if (district.rowCount === 0) {
        console.warn(`  ⚠️ District ${v.district_code} not found for village ${v.name}`);
        continue;
      }
      await query(
        `INSERT INTO spatial_geo (name, level, parent_id)
         VALUES ($1, 'village', $2)`,
        [v.name, district.rows[0].id]
      );
    }
    console.log(`  ✅ ${VILLAGES.length} villages seeded`);

    // --- 7.7 Insert Data Values ---
    console.log('\n📈 Seeding data values...');
    let dataCount = 0;
    for (const [regionCode, values] of Object.entries(DATA_VALUES)) {
      const geo = await query<{ id: number }>(
        `SELECT id FROM spatial_geo WHERE code = $1 AND level = 'region'`,
        [regionCode]
      );
      if (!geo.rowCount) {
        console.warn(`  ⚠️ Region ${regionCode} not found`);
        continue;
      }
      for (const [indCode, value] of Object.entries(values)) {
        const ind = await query<{ id: number }>(
          `SELECT id FROM indicators WHERE code = $1`,
          [indCode]
        );
        if (!ind.rowCount) continue;
        await query(
          `INSERT INTO data_values (geography_id, indicator_id, year, value, gender, age_group, source)
           VALUES ($1, $2, $3, $4, 'all', 'all', 'Fictitious Census 2024')
           ON CONFLICT (geography_id, indicator_id, year, gender, age_group)
           DO UPDATE SET value = EXCLUDED.value, last_updated = now()`,
          [geo.rows[0].id, ind.rows[0].id, 2024, value]
        );
        dataCount++;
      }
    }
    console.log(`  ✅ ${dataCount} data values seeded for 2024`);

    // --- 7.8 Insert Historical Data (2005) ---
    console.log('\n📜 Seeding historical data (2005)...');
    let historicalCount = 0;
    for (const [regionCode, values] of Object.entries(HISTORICAL_DATA)) {
      const geo = await query<{ id: number }>(
        `SELECT id FROM spatial_geo WHERE code = $1 AND level = 'region'`,
        [regionCode]
      );
      if (!geo.rowCount) continue;
      for (const [indCode, value] of Object.entries(values)) {
        const ind = await query<{ id: number }>(
          `SELECT id FROM indicators WHERE code = $1`,
          [indCode]
        );
        if (!ind.rowCount) continue;
        await query(
          `INSERT INTO data_values (geography_id, indicator_id, year, value, gender, age_group, source)
           VALUES ($1, $2, $3, $4, 'all', 'all', 'RGPH-3 2005')
           ON CONFLICT (geography_id, indicator_id, year, gender, age_group)
           DO UPDATE SET value = EXCLUDED.value, last_updated = now()`,
          [geo.rows[0].id, ind.rows[0].id, 2005, value]
        );
        historicalCount++;
      }
    }
    console.log(`  ✅ ${historicalCount} historical data values seeded for 2005`);

    // --- 7.9 Create Admin User ---
    console.log('\n👤 Seeding admin user...');
    const existing = await query(`SELECT id FROM users WHERE email = $1`, [config.adminEmail]);
    let adminId: number;
    if (existing.rowCount === 0) {
      const hash = await bcrypt.hash(config.adminPassword, config.bcryptSaltRounds);
      const { rows } = await query(
        `INSERT INTO users (email, password_hash, full_name, user_type, monthly_limit, is_active, is_verified, is_unlimited)
         VALUES ($1, $2, 'Census Admin', 'ADMIN', $3, TRUE, TRUE, TRUE) RETURNING id`,
        [config.adminEmail, hash, RATE_LIMITS.ADMIN === -1 ? 0 : RATE_LIMITS.ADMIN]
      );
      adminId = rows[0].id;

      const { raw, prefix } = generateApiKey();
      const keyHash = await hashApiKey(raw);
      await query(
        `INSERT INTO api_keys (user_id, name, key_hash, key_prefix) VALUES ($1, 'bootstrap', $2, $3)`,
        [adminId, keyHash, prefix]
      );
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔑 ADMIN CREDENTIALS (Save these):');
      console.log(`   Email:    ${config.adminEmail}`);
      console.log(`   Password: ${config.adminPassword}`);
      console.log(`   API Key:  ${raw}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      adminId = existing.rows[0].id;
      console.log(`  ✅ Admin already exists (${config.adminEmail})`);
    }

    // --- 7.10 Create Test Users ---
    console.log('\n👤 Seeding test users...');
    const testUsers = [
      { email: 'developer@ngo.cm', full_name: 'Test Developer', user_type: 'NGO_DEVELOPER' },
      { email: 'analyst@ngo.cm', full_name: 'Test Analyst', user_type: 'NGO_DATA_ANALYST' },
      { email: 'researcher@uni.cm', full_name: 'Test Researcher', user_type: 'RESEARCHER' },
      { email: 'journalist@media.cm', full_name: 'Test Journalist', user_type: 'JOURNALIST' },
    ];
    
    for (const tu of testUsers) {
      const existingUser = await query(`SELECT id FROM users WHERE email = $1`, [tu.email]);
      if (existingUser.rowCount === 0) {
        const hash = await bcrypt.hash('test123', config.bcryptSaltRounds);
        const limit = RATE_LIMITS[tu.user_type as keyof typeof RATE_LIMITS] || 15000;
        await query(
          `INSERT INTO users (email, password_hash, full_name, user_type, monthly_limit, is_active, is_verified)
           VALUES ($1, $2, $3, $4, $5, TRUE, TRUE)`,
          [tu.email, hash, tu.full_name, tu.user_type, limit]
        );
        console.log(`  ✅ Test user created: ${tu.email} (password: test123)`);
      } else {
        console.log(`  ⚠️ Test user already exists: ${tu.email}`);
      }
    }

    // --- 7.11 Refresh Analytics Views ---
    console.log('\n🔄 Refreshing analytics views...');
    try {
      await query('REFRESH MATERIALIZED VIEW CONCURRENTLY region_summary');
      await query('REFRESH MATERIALIZED VIEW CONCURRENTLY department_rankings');
      console.log('  ✅ Analytics views refreshed');
    } catch (err) {
      console.warn('  ⚠️ Could not refresh views (views may not exist yet)');
    }

    // --- 7.12 Summary ---
    console.log('\n🎉 Seed completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SUMMARY:');
    console.log(`   - ${INDICATORS.length} indicators`);
    console.log(`   - ${REGIONS.length} regions`);
    console.log(`   - ${DEPARTMENTS.length} departments`);
    console.log(`   - ${DISTRICTS.length} districts`);
    console.log(`   - ${VILLAGES.length} villages`);
    console.log(`   - ${dataCount} data values (2024)`);
    console.log(`   - ${historicalCount} historical values (2005)`);
    console.log(`   - ${testUsers.length + 1} users created (admin + ${testUsers.length} test users)`);
    console.log('\n📝 Test User Credentials:');
    console.log('   developer@ngo.cm / test123');
    console.log('   analyst@ngo.cm / test123');
    console.log('   researcher@uni.cm / test123');
    console.log('   journalist@media.cm / test123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (err) {
    console.error('❌ Seed error:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

// Run seed
seed().catch((err) => {
  console.error(err);
  process.exit(1);
});