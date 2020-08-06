import Manager from './manager'
import Collection from '../collection'
import size from 'lodash/size'
import { TableEngine } from 'joixsql'
import config from '../config'

export default class CollectionsManager {

    private _m: Manager
    private _collections: any = {}

    constructor(m: Manager){
        this._m = m
    }

    public count = () => size(this.get())

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

    public dropAllTable = () => TableEngine.dropAllFromEcosystem()

    public verifyAll = () => {
        this.forEach((c: Collection) => {
            config.ecosystem().verify(c.super().schemaSpecs().ecosystemModel()).all()
        })
    }
}