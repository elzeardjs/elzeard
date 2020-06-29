import Manager from './manager'
import Collection from '../collection'
import SQLManager from '../collection/sql'
import _ from 'lodash'
import { IForeign } from 'joi-to-sql'

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

    public dropAllTable = async () => {
        for (let key in this.get()){
            const c = this.node(key)
            await c.sql().table().drop()
        }
    }

    public createAllTable = async () => {
        const toArrayTableRef = (list: IForeign[]) => {
            const ret: string[] = []
            list.forEach((e) => ret.push(e.table_reference))
            return ret
        }
        let toCreate: Collection[] = []
        for (let key in this.get()){
            const c = this.node(key)
            if (c.joi().getForeignKeys().length == 0){
                try {
                    await c.sql().table().create()
                } catch (e){
                    throw new Error(e)
                }
            } else {
                toCreate.push(this.node(key))
            } 
        }
        for (let i = 0; i < toCreate.length; i++){
            const c = toCreate[i]
            const listKeys = toArrayTableRef(c.joi().getForeignKeys())
            let count = 0
            for (const key of listKeys){
                await SQLManager.isTableCreated(key) && count++
            }
            if (count === listKeys.length){
                await c.sql().table().create()
                toCreate.splice(i, 1)
                i = 0;
            }
        }
        if (toCreate.length){
            let err = []
            for (let c of toCreate){
                err.push(c.option().table())
            }
            throw new Error(`Table${toCreate.length > 1 ? 's' : ''}: ${err.join(', ')} not created because of crossed foreign keys`)
        }
    }
}