import _ from 'lodash'
import Model from '../model'
import IsManager from '../state/is'
import OptionManager from '../state/option'
import to from './to'
import SQLManager from '../sql' 
import schemaManager from '../state/schema'
import Manager from '../manager'
import LocalManager from './local'

type Constructor<T> = new(...args: any[]) => T;

//  i) this class can be improved by adding more than you can usually find in lists.
//It aims to be the parent of any model class representing a list of object/classes
//for example in a todolist it would be the parent of the TodoList class containing a list of Todos
//This can be useful to avoid redundant functions like sorting, filtering, pushing, deleting, updating etc...

export default class Collection {
    
    private _option: OptionManager
    private _sql: SQLManager
    private _local: LocalManager

    public schema = () => schemaManager(this.newNode(undefined))
    public is = () => IsManager(this)
    public option = (): OptionManager => this._option
    public sql = (): SQLManager => this._sql
    public local = (): LocalManager => this._local

    constructor(list: any[] = [], models: [Constructor<Model>, Constructor<Collection>], ...props: any){
        this._local = new LocalManager(this)
        this._option = new OptionManager(this, Object.assign({}, { nodeModel: models[0], nodeCollection: models[1] }, props[0]))
        this._sql = this.is().kidsPassed() ? this.option().sql() as SQLManager : new SQLManager(this)
        this.local().set(list)

        !this.is().kidsPassed() && Manager.prepareCollection(this)
    }

    public create = async (d: any): Promise<Model> => {
        const m = this.newNode(d).mustValidateSchema()
        try {
            await this.sql().node(m).insert()
            return await m.populate()
        } catch (e){
            throw new Error(e)
        }
    }

    public copy = (): Collection => this.new(this.local().to().plain())

    public ctx = (): Collection => this.new()

    public new = (v: any = []): Collection => this.is().nodeCollection(v) ? v : this._newNodeCollectionInstance(v).local().fillPrevStateStore(this.local().prevStateStore)
    public newNode = (v: any): Model => this.is().nodeModel(v) ? v : this._newNodeModelInstance(v)

    private _newNodeCollectionInstance = (defaultState: any) => new (this.option().nodeCollection())(defaultState, this.option().kids())  
    private _newNodeModelInstance = (defaultState: any) => new (this.option().nodeModel())(defaultState, this.option().kids())  
}