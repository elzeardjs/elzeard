import knex, {QueryBuilder} from 'knex'
import Model from '../model'
import Collection from '../collection'
import { convertAllDateToISOString } from '../utils'

//Update rows in a specific collection
export default (value: Model | Object, collection: Collection) => {
    const sql = collection.sql()

    const queryRunner = async (q: knex.QueryBuilder): Promise<Number> => await q
    const data = () => convertAllDateToISOString(value instanceof Model ? value.to().plainUnpopulated() : value as any);
    const query = sql.table().query().update(data()) as any

    const all = async () => await queryRunner(query)
    const custom = async (callback: (q: QueryBuilder) => QueryBuilder) => await queryRunner(callback(query as QueryBuilder))
    const where = async (...value: any) => await queryRunner(query.where(...value))
    const whereNot = async (...value: any) => await queryRunner(query.whereNot(...value))
    const whereIn = async (cols: any, values: any) => await queryRunner(query.whereIn(cols, values))
    const whereNotIn = async (col: string, values: any) => await queryRunner(query.whereNotIn(col, values))

    return {
        all, custom, query: sql.table().query().update(data()),
        where, whereNot, whereIn, whereNotIn,
        queryRunner
    }
}