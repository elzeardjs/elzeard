import knex from 'knex'
import { attachOnDuplicateUpdate } from '../extra-knex'
import _ from 'lodash'
attachOnDuplicateUpdate()
import Model from '../model'
import { Engine } from 'joi-to-sql'
import Collection from '../collection'
import config from '../config'

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

    //joi-to-sql
    public tableName = () => this.collection().option().table()
    public schemaAnalyzed = () => this.engine().analyze()
    public engine = (): Engine => {
        const m = this.collection().option().nodeModel() as any
        return new Engine(m.schema, { mysqlConfig: config.mysqlConfig() })
    }
    public getPrimaryKey = () => this.schemaAnalyzed()?.primary_key
    public getForeignKeys = () => this.schemaAnalyzed()?.foreign_keys
    public getRefs = () => this.schemaAnalyzed()?.refs

    //sql
    public table = () => SQLManager.mysql()(this.tableName()) 
    public dropTable = async () => await SQLManager.mysql().schema.dropTableIfExists(this.tableName())
    public createTable = async () => !(await this.isTableCreated()) && await this.engine().table(this.tableName())
    public isTableCreated = async () => await SQLManager.isTableCreated(this.tableName())

    public countAll = async () => {
        const rows = await this.table().count('* as count')
        if (!rows.length)
            return -1
        return rows[0].count
    }
    public fetchPrimary = async (value: string | number): Promise<(Model | null)> => {
        const primary = this.getPrimaryKey()
        if (!primary)
            return null
            
        return this._treatUniqueRow(await this.table().where({[primary]: value}))
    }
    
    public fetchLastInsert = async () => {
        const primary = this.getPrimaryKey()
        if (!primary)
            throw new Error(`${this.tableName()} nodes needs to have a primary key to perform fetchLastInsert()`)
        return this._treatUniqueRow(await this.table().orderBy(primary, 'desc').limit(1))
    }

    public create = async (value: Model | Object) => this.update(value)

    public update = async (value: Model | Object) => {
        const d = value instanceof Model ? value.toPlain() : value as any;
        if (_.isEmpty(d))
            throw new Error(`Object can't be empty.`)

        const queryCasted = this.table().insert(d) as any
        return await queryCasted.onDuplicateUpdate(d)
    }

    private _treatUniqueRow = (rows: any[]) => {
        if (!rows.length)
            return null
        return this.collection().newNode(rows[0])
    }
}

export default SQLManager