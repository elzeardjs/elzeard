import Manager from './manager'
import Collection from '../collection'
import _ from 'lodash'
import { createTables, dropAllTables } from '../knex-tools'

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

    public add = (c: Collection) => this._collections[c.option().table()] = c
    public exist = (key: string) => this.get()[key]

    public forEach = (callback: (c: Collection, key: string) => any) => {
        for (let key in this.get())
            callback(this.get()[key], key)
    }

    public dropAllTable = async () => await dropAllTables()
    public createAllTable = async () => await createTables()
}