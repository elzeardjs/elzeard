import knex, { Where, Having, QueryBuilder } from 'knex'
import { attachOnDuplicateUpdate } from '../extra-knex'
import _ from 'lodash'
attachOnDuplicateUpdate()
import Model from '../model'
import Collection from '../collection'
import config from '../config'


const fetchMethods = (collection: Collection) => {
    const sql = collection.sql()
    const query = sql.table().query()

    const byPrimary = async (value: string | number): Promise<(Model | null)> => {
        const primary = collection.joi().getPrimaryKey()
        if (!primary)
            throw new Error(`${sql.table().name()} nodes needs to have a primary key to perform primary()`)
        const result = await query.where({[primary]: value}).first()
        return await sql.format().toModel(result)
    }
    
    const lastBy = async (column: string | void): Promise<(Model | null)> => {
        if (!column){
            const primary = collection.joi().getPrimaryKey()
            if (!primary)
                throw new Error(`${sql.table().name()} needs to have a primary key to perform lastBy without column parameter`)
            column = primary
        }
        const result = await query.orderBy(column, 'desc').first()
        return await sql.format().toModel(result)
    }

    return { byPrimary, lastBy }
}

const pullMethods = (collection: Collection) => {
    const sql = collection.sql()
    const query = sql.table().query()

    const all = async () => {
        const result = await query
        return await sql.format().toModelList(result)
    }

    return { all }
}


const nodeMethods = (value: Model | Object, collection: Collection) => {
    const sql = collection.sql()
    const query = sql.table().query()
    
    const insert = async () => await update()
    const update = async () => {
        const d = value instanceof Model ? value.toPlainBack() : value as any;
        if (_.isEmpty(d))
            throw new Error(`Object can't be empty.`)
        return await (query.insert(d) as any).onDuplicateUpdate(d)
    }

    const remove = async () => {
        const d = value instanceof Model ? value.toPlainBack() : value as any;
        const primary = collection.joi().getPrimaryKey()
        if (!primary || !(primary in d))
            throw new Error("This Model needs to have a primary key to perform a node targeted delete action")
        return await query.where(primary, d[primary]).del()
    }

    return { insert, update, delete: remove }
}


const countMethods = (collection: Collection) => {
    const query = collection.sql().table().query().count(`* as count`)

    const filter = (rows: any): Number => !rows.length ? -1 : rows[0].count
    
    const all = async () => filter(await query)
    const custom = async (callback: (q: QueryBuilder) => QueryBuilder) => filter(await callback(query))
    const having = async (...value: any) => filter(await query.having(value[0], value[1], value[2]))
    const havingNot = async (...value: any) => filter(await query.having(value[0], value[1], value[2]))
    const where = async (value: Where) => filter(await query.where(value))
    const whereNot = async (value: Where) => filter(await query.whereNot(value))
    const whereIn = async (cols: any, values: any) => filter(await query.where(cols, values))
    const whereNotIn = async (col: string, values: any) => filter(await query.whereNotIn(col, values))

    return {
        all, custom, having, havingNot, query, 
        where, whereNot, whereIn, whereNotIn,
        parseRow: filter,
    }
}

const tableMethods = (collection: Collection) => {

    const query = () => SQLManager.mysql()(name())
    const name = () => collection.option().table()
    const create = async () => !(await isCreated()) && await collection.joi().engine().table(name())
    const drop = async () => await SQLManager.mysql().schema.dropTableIfExists(name())
    const isCreated = () => async () => await SQLManager.isTableCreated(name())

    return { create, drop, isCreated, name, query }
}

const formatMethods = (collection: Collection) => {

    const toModel = async (result: knex.Select) => !Model._isObject(result) ? null : await collection.newNode(result).populate()
    const toModelList = async (result: any[]) => {
        !Model._isArray(result) ? [] : await collection.set(result)
        await collection.populate()
    }
    return { toModel, toModelList }
}

class SQLManager {

    static isTableCreated = async (tableName: string) => await SQLManager.mysql().schema.hasTable(tableName)
    static mysql = () => knex({ client: 'mysql', connection: config.mysqlConfig() })

    private _c: Collection
    constructor(c: Collection){
        this._c = c
    }

    //internal
    private collection = (): Collection => this._c

    public query = () => this.table().query()

    public count = () => countMethods(this.collection())
    public fetch = () => fetchMethods(this.collection())
    public format = () => formatMethods(this.collection()) 
    public node = (value: Model | Object) => nodeMethods(value, this.collection())
    public table = () => tableMethods(this.collection())
    public pull = () => pullMethods(this.collection())

}

export default SQLManager