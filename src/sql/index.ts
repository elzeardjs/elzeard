import knex from 'knex'
import Model from '../model'
import Collection from '../collection'
import config from '../config'

import countMethods from './count-methods'
import removeMethods from './remove-methods'
import fetchMethods from './fetch-methods'
import formatMethods from './format-methods'
import listMethods from './list-methods'
import nodeMethods from './node-methods'
import pullMethods from './pull-methods'
import tableMethods from './table-methods'
import updateMethods from './update-methods'

export default class SQLManager {

    static isTableCreated = async (tableName: string) => await SQLManager.mysql().schema.hasTable(tableName)
    static mysql = (): knex<any, unknown[]> => config.mysqlConnexion()
    public knex = (): knex<any, unknown[]> => config.mysqlConnexion()

    private _c: Collection
    constructor(c: Collection){
        this._c = c
    }

    //internal
    private collection = (): Collection => this._c

    public query = () => this.table().query()
    public count = () => countMethods(this.collection())
    public remove = () => removeMethods(this.collection())
    public fetch = () => fetchMethods(this.collection())
    public format = () => formatMethods(this.collection()) 
    public list = (values: Model[]) => listMethods(values, this.collection())
    public node = (n: Model) => nodeMethods(n, this.collection())
    public pull = () => pullMethods(this.collection())
    public table = () => tableMethods(this.collection())
    public update = (value: Model | Object) => updateMethods(value, this.collection()) 
}
