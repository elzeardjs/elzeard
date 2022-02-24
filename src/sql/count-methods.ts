import knex, {QueryBuilder} from 'knex'
import Collection from '../collection'

/* 
    Perform COUNT SQL request on a specific collection
*/
export default (collection: Collection) => {
    const query = collection.sql().table().query().count(`* as count`) as any

    const queryRunner = async (q: knex.QueryBuilder): Promise<number> => {
        const rows = await q
        return !rows.length ? -1 : rows[0].count
    }
    
    const all = async () => queryRunner(query)
    const custom = async (callback: (q: QueryBuilder) => QueryBuilder) => await queryRunner(callback(query as QueryBuilder))
    const where = async (...value: any) => await queryRunner(query.where(...value))
    const whereNot = async (...value: any) => await queryRunner(query.whereNot(...value))
    const whereIn = async (cols: any, values: any) => await queryRunner(query.whereIn(cols, values))
    const whereNotIn = async (col: string, values: any) => await queryRunner(query.whereNotIn(col, values))

    return {
        all, custom, query: collection.sql().table().query().count(`* as count`), 
        where, whereNot, whereIn, whereNotIn,
        queryRunner,
    }
}
