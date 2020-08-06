import knex, {QueryBuilder} from 'knex'
import Model from '../model'
import Collection from '../collection'

export default (collection: Collection) => {
    const primary = collection.super().schemaSpecs().getPrimaryKey()
    const sql = collection.sql()
    const query = sql.table().query().first() as any

    const queryRunner = async (q: knex.QueryBuilder) => await sql.format().toModel(await q)

    const byPrimary = async (value: string | number): Promise<(Model | null)> => {
        return await queryRunner(query.where({[primary]: value}))
    }
    
    const lastBy = async (column: string | void): Promise<(Model | null)> => {
        return await queryRunner(query.orderBy(column || primary, 'desc'))
    }

    const custom = async (callback: (q: QueryBuilder) => QueryBuilder) => await queryRunner(callback(query as QueryBuilder))
    const where = async (...value: any) => await queryRunner(query.where(...value))
    const whereNot = async (...value: any) => await queryRunner(query.whereNot(...value))
    const whereIn = async (cols: any, values: any) => await queryRunner(query.whereIn(cols, values))
    const whereNotIn = async (col: string, values: any) => await queryRunner(query.whereNotIn(col, values))


    return { 
        byPrimary, lastBy,
        
        custom, where, whereNot, 
        whereIn, whereNotIn, 
        
        query: sql.table().query().first(), queryRunner
    }
}