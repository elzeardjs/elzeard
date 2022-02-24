import knex from 'knex'
import Model from '../model'
import Collection from '../collection'
import config from '../config'

import countMethods from './count-methods'
import removeMethods from './remove-methods'
import findMethods from './find-methods'
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
    //Count rows
    public count = () => countMethods(this.collection())
    //Remove rows
    public remove = () => removeMethods(this.collection())
    //Find a specific row
    public find = () => findMethods(this.collection())
    //to format SQL request output
    public format = () => formatMethods(this.collection()) 
    //Perform SQL request based on a list of Models
    public list = (values: Model[]) => listMethods(values, this.collection())
    //Perform SQL request based on a Model
    public node = (n: Model) => nodeMethods(n, this.collection())
    //Fetch rows and set them in a new returned Collection
    public pull = () => pullMethods(this.collection())
    //Perform SQL request on a table
    public table = () => tableMethods(this.collection())
    //Update rows
    public update = (value: Model | Object) => updateMethods(value, this.collection()) 
}
