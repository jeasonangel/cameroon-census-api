-- ============================================================
-- ANALYTICS MATERIALIZED VIEWS FOR CAMEROON CENSUS DATA
-- ============================================================

-- ============================================================
-- 1. REGION SUMMARY VIEW
-- Pre-computes all key indicators for each region
-- ============================================================
DROP MATERIALIZED VIEW IF EXISTS region_summary CASCADE;

CREATE MATERIALIZED VIEW region_summary AS
SELECT 
    g.id AS geography_id,
    g.code,
    g.name,
    g.population AS total_population,
    g.area_km2,
    ROUND(g.population / g.area_km2, 1) AS density,
    
    -- Demography
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'POP_MALE') AND dv.year = 2024) AS male_population,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'POP_FEMALE') AND dv.year = 2024) AS female_population,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'POP_URBAN') AND dv.year = 2024) AS urban_population,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'POP_RURAL') AND dv.year = 2024) AS rural_population,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'POP_YOUNG') AND dv.year = 2024) AS young_population,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'POP_ADULT') AND dv.year = 2024) AS adult_population,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'POP_ELDERLY') AND dv.year = 2024) AS elderly_population,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'GROWTH_RATE') AND dv.year = 2024) AS growth_rate,
    
    -- Education
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'LIT_RATE') AND dv.year = 2024) AS literacy_rate,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'LIT_MALE') AND dv.year = 2024) AS male_literacy,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'LIT_FEMALE') AND dv.year = 2024) AS female_literacy,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'SCHOOL_ENROLL') AND dv.year = 2024) AS school_enrollment,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'SCHOOL_PRIMARY') AND dv.year = 2024) AS primary_enrollment,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'SCHOOL_SECONDARY') AND dv.year = 2024) AS secondary_enrollment,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'NUMBER_SCHOOLS') AND dv.year = 2024) AS number_schools,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'PUPIL_TEACHER_RATIO') AND dv.year = 2024) AS pupil_teacher_ratio,
    
    -- Health
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'INFANT_MORTALITY') AND dv.year = 2024) AS infant_mortality,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'UNDER5_MORTALITY') AND dv.year = 2024) AS under5_mortality,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'MATERNAL_MORTALITY') AND dv.year = 2024) AS maternal_mortality,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'VACCINATION_RATE') AND dv.year = 2024) AS vaccination_rate,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'MALARIA_PREVALENCE') AND dv.year = 2024) AS malaria_prevalence,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'HIV_PREVALENCE') AND dv.year = 2024) AS hiv_prevalence,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'NUMBER_HOSPITALS') AND dv.year = 2024) AS number_hospitals,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'NUMBER_HEALTH_CENTERS') AND dv.year = 2024) AS number_health_centers,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'DOCTOR_RATIO') AND dv.year = 2024) AS doctor_ratio,
    
    -- Housing & Infrastructure
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'WATER_ACCESS') AND dv.year = 2024) AS water_access,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'WATER_PIPED') AND dv.year = 2024) AS piped_water,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'WATER_WELL') AND dv.year = 2024) AS well_water,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'ELECTRICITY_ACCESS') AND dv.year = 2024) AS electricity_access,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'SANITATION_BASIC') AND dv.year = 2024) AS basic_sanitation,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'SANITATION_UNIMPROVED') AND dv.year = 2024) AS unimproved_sanitation,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'HOUSING_MODERN') AND dv.year = 2024) AS modern_housing,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'INTERNET_ACCESS') AND dv.year = 2024) AS internet_access,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'MOBILE_PHONE_ACCESS') AND dv.year = 2024) AS mobile_phone_access,
    
    -- Economy
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'EMPLOYMENT') AND dv.year = 2024) AS employment_rate,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'UNEMPLOYMENT') AND dv.year = 2024) AS unemployment_rate,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'YOUTH_UNEMPLOYMENT') AND dv.year = 2024) AS youth_unemployment,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'AGRICULTURE_EMP') AND dv.year = 2024) AS agriculture_employment,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'INDUSTRY_EMP') AND dv.year = 2024) AS industry_employment,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'SERVICES_EMP') AND dv.year = 2024) AS services_employment,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'POVERTY_RATE') AND dv.year = 2024) AS poverty_rate,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'EXTREME_POVERTY') AND dv.year = 2024) AS extreme_poverty,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'AVG_INCOME') AND dv.year = 2024) AS avg_income,
    
    -- Agriculture
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'CROP_AREA') AND dv.year = 2024) AS crop_area,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'MAIZE_PRODUCTION') AND dv.year = 2024) AS maize_production,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'CASSAVA_PRODUCTION') AND dv.year = 2024) AS cassava_production,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'LIVESTOCK_CATTLE') AND dv.year = 2024) AS cattle_population,
    (SELECT value FROM data_values dv WHERE dv.geography_id = g.id AND dv.indicator_id = (SELECT id FROM indicators WHERE code = 'FOOD_INSECURE') AND dv.year = 2024) AS food_insecure,
    
    -- Child counts (for reference)
    (SELECT COUNT(*) FROM spatial_geo WHERE parent_id = g.id AND level = 'department') AS department_count,
    
    CURRENT_TIMESTAMP AS last_refreshed
FROM spatial_geo g
WHERE g.level = 'region';

-- ============================================================
-- 2. DEPARTMENT RANKINGS VIEW
-- Pre-computes rankings for departments within each region
-- ============================================================
DROP MATERIALIZED VIEW IF EXISTS department_rankings CASCADE;

CREATE MATERIALIZED VIEW department_rankings AS
WITH dept_data AS (
    SELECT 
        g.id,
        g.code,
        g.name,
        g.population,
        g.area_km2,
        g.parent_id,
        r.code AS region_code,
        r.name AS region_name,
        -- Get indicator values as JSON
        jsonb_object_agg(
            i.code, 
            jsonb_build_object('value', dv.value, 'year', dv.year)
        ) FILTER (WHERE i.code IS NOT NULL) AS indicators
    FROM spatial_geo g
    JOIN spatial_geo r ON r.id = g.parent_id
    LEFT JOIN data_values dv ON dv.geography_id = g.id AND dv.year = 2024
    LEFT JOIN indicators i ON i.id = dv.indicator_id
    WHERE g.level = 'department'
    GROUP BY g.id, g.code, g.name, g.population, g.area_km2, g.parent_id, r.code, r.name
)
SELECT 
    id,
    code,
    name,
    population,
    area_km2,
    parent_id,
    region_code,
    region_name,
    indicators,
    -- Demography indicators with ranks
    (indicators->'POP_TOT'->>'value')::float AS population_total,
    RANK() OVER (PARTITION BY region_code ORDER BY (indicators->'POP_TOT'->>'value')::float DESC NULLS LAST) AS population_rank,
    
    -- Education indicators with ranks
    (indicators->'LIT_RATE'->>'value')::float AS literacy_rate,
    RANK() OVER (PARTITION BY region_code ORDER BY (indicators->'LIT_RATE'->>'value')::float DESC NULLS LAST) AS literacy_rank,
    (indicators->'SCHOOL_ENROLL'->>'value')::float AS school_enrollment,
    RANK() OVER (PARTITION BY region_code ORDER BY (indicators->'SCHOOL_ENROLL'->>'value')::float DESC NULLS LAST) AS school_rank,
    (indicators->'NUMBER_SCHOOLS'->>'value')::float AS number_schools,
    RANK() OVER (PARTITION BY region_code ORDER BY (indicators->'NUMBER_SCHOOLS'->>'value')::float DESC NULLS LAST) AS schools_rank,
    
    -- Health indicators with ranks
    (indicators->'INFANT_MORTALITY'->>'value')::float AS infant_mortality,
    RANK() OVER (PARTITION BY region_code ORDER BY (indicators->'INFANT_MORTALITY'->>'value')::float ASC NULLS LAST) AS health_rank,
    (indicators->'VACCINATION_RATE'->>'value')::float AS vaccination_rate,
    RANK() OVER (PARTITION BY region_code ORDER BY (indicators->'VACCINATION_RATE'->>'value')::float DESC NULLS LAST) AS vaccination_rank,
    (indicators->'NUMBER_HOSPITALS'->>'value')::float AS number_hospitals,
    RANK() OVER (PARTITION BY region_code ORDER BY (indicators->'NUMBER_HOSPITALS'->>'value')::float DESC NULLS LAST) AS hospitals_rank,
    
    -- Infrastructure indicators with ranks
    (indicators->'WATER_ACCESS'->>'value')::float AS water_access,
    RANK() OVER (PARTITION BY region_code ORDER BY (indicators->'WATER_ACCESS'->>'value')::float DESC NULLS LAST) AS water_rank,
    (indicators->'ELECTRICITY_ACCESS'->>'value')::float AS electricity_access,
    RANK() OVER (PARTITION BY region_code ORDER BY (indicators->'ELECTRICITY_ACCESS'->>'value')::float DESC NULLS LAST) AS electricity_rank,
    (indicators->'SANITATION_BASIC'->>'value')::float AS basic_sanitation,
    RANK() OVER (PARTITION BY region_code ORDER BY (indicators->'SANITATION_BASIC'->>'value')::float DESC NULLS LAST) AS sanitation_rank,
    
    -- Economy indicators with ranks
    (indicators->'EMPLOYMENT'->>'value')::float AS employment_rate,
    RANK() OVER (PARTITION BY region_code ORDER BY (indicators->'EMPLOYMENT'->>'value')::float DESC NULLS LAST) AS employment_rank,
    (indicators->'POVERTY_RATE'->>'value')::float AS poverty_rate,
    RANK() OVER (PARTITION BY region_code ORDER BY (indicators->'POVERTY_RATE'->>'value')::float ASC NULLS LAST) AS poverty_rank,
    (indicators->'AVG_INCOME'->>'value')::float AS avg_income,
    RANK() OVER (PARTITION BY region_code ORDER BY (indicators->'AVG_INCOME'->>'value')::float DESC NULLS LAST) AS income_rank,
    
    CURRENT_TIMESTAMP AS last_refreshed
FROM dept_data;

-- ============================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================================

-- Region summary indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_region_summary_code ON region_summary(code);
CREATE INDEX IF NOT EXISTS idx_region_summary_population ON region_summary(total_population DESC);
CREATE INDEX IF NOT EXISTS idx_region_summary_water ON region_summary(water_access DESC);
CREATE INDEX IF NOT EXISTS idx_region_summary_literacy ON region_summary(literacy_rate DESC);
CREATE INDEX IF NOT EXISTS idx_region_summary_employment ON region_summary(employment_rate DESC);
CREATE INDEX IF NOT EXISTS idx_region_summary_poverty ON region_summary(poverty_rate DESC);

-- Department rankings indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_dept_rankings_code ON department_rankings(code);
CREATE INDEX IF NOT EXISTS idx_dept_rankings_region ON department_rankings(region_code);
CREATE INDEX IF NOT EXISTS idx_dept_rankings_water ON department_rankings(region_code, water_rank);
CREATE INDEX IF NOT EXISTS idx_dept_rankings_literacy ON department_rankings(region_code, literacy_rank);
CREATE INDEX IF NOT EXISTS idx_dept_rankings_population ON department_rankings(region_code, population_rank);