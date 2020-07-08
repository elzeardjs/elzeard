import _ from 'lodash'
import Model from '../model'
import IsManager from '../state/is'
import OptionManager from '../state/option'
import SQLManager from '../sql' 
import SchemaManager from '../state/schema'
import Manager from '../manager'
import LocalManager from './local'
import QuickManager from './quick'

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

    public schema = () => SchemaManager(this.newNode(undefined))
    public is = () => IsManager(this)
    public option = (): OptionManager => this._option
    public sql = (): SQLManager => this._sql
    public local = (): LocalManager => this._local
    public quick = () => QuickManager(this)

    constructor(list: any[] = [], models: [Constructor<Model>, Constructor<Collection>], ...props: any){
        this._contextID = r && r++
        this._local = new LocalManager(this)
        this._option = new OptionManager(this, Object.assign({}, { nodeModel: models[0], nodeCollection: models[1] }, props[0]))
        
        if (!this.option().table())
            throw errors.tableRequired()
        if (!this.is().kidsPassed() && !!Manager.collections().node(this.option().table()))
            throw errors.tableAlreadyExist(this.option().table())
        
        this._sql = new SQLManager(this)
        this.is().kidsPassed() && this.local().set(list)
        !this.is().kidsPassed() && Manager.prepareCollection(this)
    }

    public copy = (): Collection => this.new(this.local().to().plain())

    public ctx = (): Collection => this.new([])

    public new = (v: any = []): Collection => this.is().nodeCollection(v) ? v : this._newNodeCollectionInstance(v).local().fillPrevStateStore(this.local().prevStateStore)
    public newNode = (v: any): Model => this.is().nodeModel(v) ? v : this._newNodeModelInstance(v)

    private _newNodeCollectionInstance = (defaultState: any) => new (this.option().nodeCollection())(defaultState, this.option().kids())  
    private _newNodeModelInstance = (defaultState: any) => new (this.option().nodeModel())(defaultState, this.option().kids())  
}