import Manager from './manager'
import Collection from '../collection'
import _ from 'lodash'
import { createTables, dropAllTables } from '../knex-tools'
import { MigrationManager } from 'joi-to-sql'
import config from '../config'

export default class CollectionsManager {

    private _m: Manager
    private _collections: any = {}

    constructor(m: Manager){
        this._m = m
    }

    public count = () => _.size(this.get())

    public get = () => this._collections
    public manager = () => this._m
    public reset = () => this._collections = {}
    public node = (key: string): Collection => this.get()[key]

    public add = (c: Collection) => {
        this._collections[c.super().option().table()] = c
        config.ecosystem().add({schema: (c.super().option().nodeModel() as any).schema, tableName: c.super().option().table()})
    }
    public exist = (key: string) => this.get()[key]

    public forEach = (callback: (c: Collection, key: string) => any) => {
        for (let key in this.get())
            callback(this.get()[key], key)
    }

    public dropAllTable = () => dropAllTables()
    public createAllTable = () => {
        try {
            createTables()
            this.forEach((c: Collection) => {
                if (MigrationManager.schema().lastFilename(c.super().option().table()) === null){
                    const ecoModel = c.super().schemaSpecs().ecosystemModel()
                    MigrationManager.schema().create(ecoModel)
                }
            })

        } catch (e){
            throw new Error(e)
        }
    }
    public verifyAll = () => {
        this.forEach((c: Collection) => {
            config.ecosystem().verify(c.super().schemaSpecs().ecosystemModel()).all()
        })
    }
}