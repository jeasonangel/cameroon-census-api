import { Request, Response, NextFunction } from 'express';
import { query } from '../db/pool';
import { BadRequest } from '../utils/errors';

export const analyticsController = {
    // GET /api/v1/analytics/regions
    async getAllRegions(req: Request, res: Response, next: NextFunction) {
        try {
            const { rows } = await query(`
                SELECT 
                    code,
                    name,
                    total_population,
                    area_km2,
                    density,
                    water_access,
                    literacy_rate,
                    school_enrollment,
                    employment_rate,
                    poverty_rate,
                    infant_mortality,
                    department_count
                FROM region_summary
                ORDER BY total_population DESC
            `);
            
            res.json({ 
                data: {
                    total: rows.length,
                    regions: rows
                }
            });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/v1/analytics/regions/:code
    async getRegionByCode(req: Request, res: Response, next: NextFunction) {
        try {
            const { code } = req.params;
            
            const { rows } = await query(`
                SELECT * FROM region_summary WHERE code = $1
            `, [code]);
            
            if (rows.length === 0) {
                throw BadRequest(`Region "${code}" not found`);
            }
            
            res.json({ data: rows[0] });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/v1/analytics/regions/rank/water
    async getRegionsRankedByWater(req: Request, res: Response, next: NextFunction) {
        try {
            const { order = 'desc' } = req.query;
            
            const { rows } = await query(`
                SELECT 
                    code,
                    name,
                    water_access,
                    total_population
                FROM region_summary
                WHERE water_access IS NOT NULL
                ORDER BY water_access ${order === 'desc' ? 'DESC' : 'ASC'}
            `);
            
            res.json({ 
                data: {
                    total: rows.length,
                    best: rows.length > 0 ? rows[0] : null,
                    worst: rows.length > 0 ? rows[rows.length - 1] : null,
                    regions: rows
                }
            });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/v1/analytics/departments/rank
    async getDepartmentRankings(req: Request, res: Response, next: NextFunction) {
        try {
            const { region, indicator = 'water_access', order = 'desc', limit = 20 } = req.query;

            console.log('📊 getDepartmentRankings called:', { region, indicator, order, limit });

            // Map indicator to column name
            const indicatorMap: Record<string, string> = {
                'water_access': 'water_access',
                'literacy': 'literacy_rate',
                'school': 'school_enrollment',
                'employment': 'employment_rate',
                'poverty': 'poverty_rate',
                'population': 'population_total'
            };

            const indCol = indicatorMap[indicator as string] || 'water_access';

            // Build query
            let sql = `
                SELECT 
                    code,
                    name,
                    region_name,
                    population,
                    ${indCol} AS value
                FROM department_rankings
            `;

            const params: any[] = [];
            
            if (region) {
                sql += ` WHERE region_code = $1`;
                params.push(region);
            }

            sql += ` ORDER BY ${indCol} ${order === 'desc' ? 'DESC' : 'ASC'}`;
            
            const limitNum = parseInt(limit as string, 10);
            if (limitNum > 0) {
                sql += ` LIMIT $${params.length + 1}`;
                params.push(limitNum);
            }

            console.log('📊 SQL:', sql);
            console.log('📊 Params:', params);

            const { rows } = await query(sql, params);

            console.log(`✅ Found ${rows.length} departments`);

            // Add rank manually
            const rankedRows = rows.map((row, index) => ({
                ...row,
                rank: index + 1
            }));

            res.json({
                data: {
                    indicator: indicator,
                    total: rankedRows.length,
                    best: rankedRows.length > 0 ? rankedRows[0] : null,
                    worst: rankedRows.length > 0 ? rankedRows[rankedRows.length - 1] : null,
                    departments: rankedRows
                }
            });
        } catch (err) {
            console.error('❌ Error in getDepartmentRankings:', err);
            next(err);
        }
    },

    // GET /api/v1/analytics/compare/regions
    async compareRegions(req: Request, res: Response, next: NextFunction) {
        try {
            const { code1, code2 } = req.query;
            
            if (!code1 || !code2) {
                throw BadRequest('code1 and code2 are required');
            }
            
            const { rows } = await query(`
                SELECT 
                    code,
                    name,
                    total_population,
                    literacy_rate,
                    school_enrollment,
                    water_access,
                    employment_rate,
                    poverty_rate
                FROM region_summary
                WHERE code IN ($1, $2)
            `, [code1, code2]);
            
            if (rows.length < 2) {
                throw BadRequest('One or both regions not found');
            }
            
            const region1 = rows.find(r => r.code === code1);
            const region2 = rows.find(r => r.code === code2);
            
            const indicators = ['total_population', 'literacy_rate', 'school_enrollment', 'water_access', 'employment_rate', 'poverty_rate'];
            
            const differences = indicators.map(ind => {
                const v1 = region1?.[ind] || 0;
                const v2 = region2?.[ind] || 0;
                return {
                    indicator: ind,
                    region1_value: v1,
                    region2_value: v2,
                    difference: v1 - v2,
                    percent_difference: v2 !== 0 ? Math.round(((v1 - v2) / v2) * 1000) / 10 : null,
                    better: v1 > v2 ? region1?.name : region2?.name
                };
            });
            
            res.json({ 
                data: {
                    region1: region1,
                    region2: region2,
                    differences: differences
                }
            });
        } catch (err) {
            next(err);
        }
    },

    // GET /api/v1/analytics/best-worst
    async getBestWorst(req: Request, res: Response, next: NextFunction) {
        try {
            const { indicator = 'water_access', level = 'region' } = req.query;
            
            const table = level === 'department' ? 'department_rankings' : 'region_summary';
            
            // Get best (highest value)
            const { rows: best } = await query(`
                SELECT code, name, ${indicator} AS value
                FROM ${table}
                WHERE ${indicator} IS NOT NULL
                ORDER BY ${indicator} DESC
                LIMIT 1
            `);
            
            // Get worst (lowest value)
            const { rows: worst } = await query(`
                SELECT code, name, ${indicator} AS value
                FROM ${table}
                WHERE ${indicator} IS NOT NULL
                ORDER BY ${indicator} ASC
                LIMIT 1
            `);
            
            res.json({ 
                data: {
                    indicator: indicator,
                    level: level,
                    best: best[0] || null,
                    worst: worst[0] || null
                }
            });
        } catch (err) {
            next(err);
        }
    }
};