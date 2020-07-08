import Manager from './manager'
import Collection from '../collection'
import _ from 'lodash'
import { createTables, dropAllTables } from '../knex-tools'
import { 
    verifyCrossedPopulateValues,
    verifyPopulateExistences,
    verifyForeignKeyExistences,
    verifyGroupingValuesExistence,
    verifyCrossedForeignKey
 } from '../verify'

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

    public dropAllTable = () => dropAllTables()
    public createAllTable = () => createTables()
    public verifyCrossedForeignKey = () => this.forEach((c: Collection) => verifyCrossedForeignKey(c))
    public verifyCrossedPopulateValues = () => this.forEach((c: Collection) => verifyCrossedPopulateValues(c.newNode(undefined)))
    public verifyPopulateExistences = () => this.forEach((c: Collection) => verifyPopulateExistences(c))
    public verifyForeignKeyExistences = () => this.forEach((c: Collection) => verifyForeignKeyExistences(c))
    public verifyGroupingValuesExistence = () => this.forEach((c: Collection) => verifyGroupingValuesExistence(c))


}