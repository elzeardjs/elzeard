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
    
    const last = async (): Promise<(Model | null)> => {
        const primary = collection.joi().getPrimaryKey()
        if (!primary)
            throw new Error(`${sql.table().name()} nodes needs to have a primary key to perform last()`)
        const result = await query.orderBy(primary, 'desc').first()
        return await sql.format().toModel(result)
    }

    return { byPrimary, last }
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

    return { insert, update }
}


const countMethods = (collection: Collection) => {
    const query = collection.sql().table().query().count(`* as count`)
    const filter = (rows: any): Number => {
        if (!rows.length)
            return -1
        return rows[0].count
    }

    const all = async () => filter(await query)
    const where = async (value: Where) => filter(await query.where(value))
    const whereNot = async (value: Where) => filter(await query.whereNot(value))
    const having = async (...value: any) => filter(await query.having(value[0], value[1], value[2]))
    const havingNot = async (...value: any) => filter(await query.having(value[0], value[1], value[2]))

    const custom = async (callback: (q: QueryBuilder) => QueryBuilder) => {
        return filter(await callback(query))
    }

    return { 
        all,
        custom,
        having,
        havingNot,
        parseRow: filter,
        query,
        where,
        whereNot
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

    const toModel = async (result: knex.Select) => {
        if (!Model._isObject(result))
            return null
        return await collection.newNode(result).turnToFront()
    }

    return { toModel }
}

class SQLManager {

    static isTableCreated = async (tableName: string) => await SQLManager.mysql().schema.hasTable(tableName)
    static mysql = () => {
        const k = knex({ client: 'mysql', connection: config.mysqlConfig() })
        return k
    }

    private _c: Collection
    constructor(c: Collection){
        this._c = c
    }

    //internal
    private collection = (): Collection => this._c

    public table = () => tableMethods(this.collection())
    public count = () => countMethods(this.collection())
    public fetch = () => fetchMethods(this.collection())
    public node = (value: Model | Object) => nodeMethods(value, this.collection())
    public format = () => formatMethods(this.collection()) 
}

export default SQLManager