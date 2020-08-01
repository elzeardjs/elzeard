import knex, {QueryBuilder} from 'knex'
import Collection from '../collection'

export default (collection: Collection) => {

    const sql = collection.sql()
    const queryRunner = async (q: knex.QueryBuilder) => await sql.format().pull(await q)
    const query = sql.table().query() as any

    const all = async () => await queryRunner(query)
    const custom = async (callback: (q: QueryBuilder) => QueryBuilder) => await queryRunner(callback(query as QueryBuilder))
    const where = async (...value: any) => await queryRunner(query.where(...value))
    const whereNot = async (...value: any) => await queryRunner(query.whereNot(...value))
    const whereIn = async (cols: any, values: any) => await queryRunner(query.whereIn(cols, values))
    const whereNotIn = async (col: string, values: any) => await queryRunner(query.whereNotIn(col, values))

    return { 
        all, custom, where,
        whereNot, whereIn, whereNotIn,
        queryRunner, query: sql.table().query()
    }
}