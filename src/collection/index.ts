import { Ecosystem } from 'joixsql'

import Model from '../model'
import IsManager from '../state/is'
import OptionManager from '../state/option'
import SQLManager from '../sql' 
import Manager from '../manager'
import LocalManager from './local'
import QuickManager from './quick'
import ExpressTools from './express'
import config from '../config'
import errors from '../errors'


type Constructor<T> = new(...args: any[]) => T;

//  i) this class can be improved by adding more than you can usually find in lists.
//It aims to be the parent of any model class representing a list of object/classes
//for example in a todolist it would be the parent of the TodoList class containing a list of Todos
//This can be useful to avoid redundant functions like sorting, filtering, pushing, deleting, updating etc...

let r = 1
export default class Collection {
    
    private _option: OptionManager
    private _sql: SQLManager
    private _local: LocalManager
    private _contextID: number

    public get __contextID() { return this._contextID}

    public super = () => {
        const schemaSpecs = () => {
            const modelSchema = ((option().nodeModel()) as any).schema
            const ecosystem = (config.ecosystem() as Ecosystem)
            return ecosystem.schema({schema: modelSchema, tableName: option().table()})
        }
        const is = () => IsManager(this)
        const option = (): OptionManager => this._option 

        return {
            is,
            option,
            schemaSpecs
        }
    }

    public sql = (): SQLManager => this._sql
    public local = (): LocalManager => this._local
    public quick = () => QuickManager(this)
    public expressTools = () => ExpressTools(this)

    constructor(list: any[] = [], models: [Constructor<Model>, Constructor<Collection>], ...props: any){
        this._contextID = r && r++
        this._local = new LocalManager(this)
        this._option = new OptionManager(this, Object.assign({}, { nodeModel: models[0], nodeCollection: models[1] }, props[0]))
        
        if (!this.super().option().table())
            throw errors.tableRequired()
        if (!this.super().is().kidsPassed() && !!Manager.collections().node(this.super().option().table()))
            throw errors.tableAlreadyExist(this.super().option().table())
        
        this._sql = new SQLManager(this)
        this.super().is().kidsPassed() && this.local().set(list)
        this.super().is().autoConnected() && !this.super().is().kidsPassed() && Manager.prepareCollection(this)
    }

    public copy = (): Collection => this.new(this.local().to().plain())

    public ctx = (): Collection => this.new([])

    public new = (v: any = []): Collection => this.super().is().nodeCollection(v) ? v : this._newNodeCollectionInstance(v).local().fillPrevStateStore(this.local().prevStateStore)
    public newNode = (v: any): Model => this.super().is().nodeModel(v) ? v : this._newNodeModelInstance(v)

    private _newNodeCollectionInstance = (defaultState: any) => new (this.super().option().nodeCollection())(defaultState, this.super().option().kids())  
    private _newNodeModelInstance = (defaultState: any) => new (this.super().option().nodeModel())(defaultState, this.super().option().kids())  
}