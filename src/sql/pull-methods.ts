import knex, {QueryBuilder} from 'knex'
import Collection from '../collection'

export interface ICut {
    limit(limit: number): ICut,
    offset(offset: number): ICut,
    orderBy(columnName: string, order: 'asc' | 'desc' | undefined): ICut,
    run(): Promise<Collection>   
}

//Enable to fetch rows and set them in a new returned Collection
export default (collection: Collection) => {
    const sql = collection.sql()
    const queryRunner = async (q: knex.QueryBuilder) => await sql.format().pull(await q)
    let query = sql.table().query()

    const cut = (): ICut => {
        const limit = (limit: number) => {
            query = query.limit(limit)
            return cut()
        }
        const offset = (offset: number) => {
            query = query.offset(offset)
            return cut()
        }

        const orderBy = (columnName: string, order: 'asc' | 'desc' | undefined) => {
            query = query.orderBy(columnName, order)
            return cut()
        }

        const run = () => queryRunner(query)

        return {limit, offset, orderBy, run}
    }

    const where = (...value: any) => {
        query = (query as any).where(...value) as knex.QueryBuilder
        return cut()
    }

    const all = () => cut()

    const whereNot = (...value: any) => {
        query = (query as any).whereNot(...value) as knex.QueryBuilder
        return cut()
    }

    const custom = (callback: (q: QueryBuilder) => QueryBuilder) => queryRunner(callback(query as QueryBuilder))
    
    const whereIn = (cols: any, values: any) => {
        query = query.whereIn(cols, values)
        return cut()
    }

    const whereNotIn = (cols: any, values: any) => {
        query = query.whereNotIn(cols, values)
        return cut()
    }

    return {
        custom, 
        all,
        where, whereNot,
        whereIn, whereNotIn
    }
}