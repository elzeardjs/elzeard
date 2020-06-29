import _ from 'lodash'
import { Engine } from 'joi-to-sql'
import Model, {IAction} from '../model'
import IsManager from './is'
import OptionManager from './option'
import SQLManager from './sql' 
import Manager from '../manager'
import config from '../config'

type Constructor<T> = new(...args: any[]) => T;

//  i) this class can be improved by adding more than you can usually find in lists.
//It aims to be the parent of any model class representing a list of object/classes
//for example in a todolist it would be the parent of the TodoList class containing a list of Todos
//This can be useful to avoid redundant functions like sorting, filtering, pushing, deleting, updating etc...

export default class Collection {
    
    private _prevStateStore: any = []
    private _state: any = []
    private _prevState: any = []
    private _defaultState: any = []

    private _is: IsManager
    private _option: OptionManager
    private _sql: SQLManager

    constructor(list: any[] = [], models: [Constructor<Model>, Constructor<Collection>], ...props: any){
        this._option = new OptionManager(this, Object.assign({}, { nodeModel: models[0], collectionModel: models[1] }, props[0]))
        this._is = new IsManager(this)
        this._sql = new SQLManager(this)
        this._setDefaultState(this.state)
        this.set(list)

        this.is().connected() && Manager.prepareCollection(this)
    }

    private _setDefaultState = (state: any) => this._defaultState = state
    private _setPrevState = (state: any) => this._prevState = state
    private _setPrevStateStore = (state: any) => this._prevStateStore = state

    public set = (state: any[] = this.state): IAction => {
        this._setPrevState(this.state)
        this._state = this.toListClass(state)
        return this.action()        
    }

    public get prevStateStore(){
        return this._prevStateStore
    }

    public get state(){
        return this._state
    }

    public get prevState(){
        return this._prevState
    }

    public get defaultState(){
        return this._defaultState
    }

    //joi-to-sql
    public joi = () => {
        const engine = (): Engine => {
            const m = this.option().nodeModel() as any
            return new Engine(m.schema, { mysqlConfig: config.mysqlConfig() })
        }

        return {
            engine,
            schemaAnalyzed: () => engine().analyze(),
            getPrimaryKey: () => engine().analyze()?.primary_key,
            getForeignKeys: () => engine().analyze()?.foreign_keys,
            getRefs: () => engine().analyze()?.foreign_keys
        }
    }
    
    public is = (): IsManager => this._is
    public option = (): OptionManager => this._option
    public sql = (): SQLManager => this._sql

    public action = (value: any = undefined): IAction => {
        return {
            save: () => this.save(),
            value
        }
    }

    public save = (m: Model | void) => {

    }

    public concat = (list: any[] = []) => this.newCollection(this.state.slice().concat(this.toListClass(list)))
    
    //Return the number of element in the array
    public count = (): number => this.state.length

    public defaultNodeState = () => this._newNodeModelInstance(undefined).defaultState

    //delete a node if it exists in the list.
    public delete = (v: any): IAction => {
        const index = this.indexOf(this.newNode(v))
        const list = this.state.slice()
        if (index > -1){
            const v = list.splice(index, 1)
            if (!!v.length){
                this.set(list)
                return this.action(v[0])
            }
        }
        return this.action()
    }

    //delete all the nodes matching the predicate. see https://lodash.com/docs/4.17.15#remove
    public deleteBy = (predicate: any): IAction => {
        const statePlain = this.toPlain()
        const e = _.remove(statePlain, predicate)
        !!e.length && this.set(this.toListClass(statePlain))
        return this.action()
    }

    public deleteIndex = (index: number): IAction => {
        const { value } = this.splice(index, 1)
        return this.action(!!value.length ? value[0] : undefined)
    }

    //find the first node matching the predicate see: https://lodash.com/docs/4.17.15#find
    public find = (predicate: any) => {
        const o = _.find(this.toPlain(), predicate)
        if (o){
            const index = this.findIndex(o)
            return index < 0 ? undefined : this.state[index]
        }
        return undefined
    }

    //return the index of the first element found matching the predicate. see https://lodash.com/docs/4.17.15#findIndex
    public findIndex = (predicate: any): number => _.findIndex(this.toPlain(), predicate)

    //pick up a list of node matching the predicate. see: https://lodash.com/docs/4.17.15#filter
    public filter = (predicate: any) => {
        const list = _.filter(this.toPlain(), predicate)
        const ret = []
        for (let elem of list){
            const m = this.find(elem)
            m && ret.push(m)
        }
        return this.newCollection(ret)
    }

    //return the index of the element passed in parameters if it exists in the list.
    public indexOf = (v: any): number => _.findIndex(this.toPlain(), this.newNode(v).toPlain())

    public limit = (limit: number) => this.slice(0, limit)

    public map = (callback: (v: any, index: number) => any) => { 
        const array = this.state
        let ret = []
        for (let i = 0; i < array.length; i++){
            const v = callback(array[i], i)
            v && ret.push(v)
        }
        return ret
    }

    public newCollection = (v: any): Collection => this._isNodeCollection(v) ? v : this._newNodeCollectionInstance(v)
    public newNode = (v: any): Model => this._isNodeModel(v) ? v : this._newNodeModelInstance(v)
    
    public nodeAt = (index: number) => this.state[index] && this._isNodeModel(this.state[index]) ? this.state[index] : undefined

    public offset = (offset: number) => this.slice(offset)

    //return a sorted array upon the parameters passed. see: https://lodash.com/docs/4.17.15#orderBy
    public orderBy = (iteratees: any[] = [], orders: any[] = []) => {
        const list = _.orderBy(this.toPlain(), iteratees, orders)
        const ret = []
        for (let elem of list){
            const m = this.find(elem)
            m && ret.push(m)
        }
        return this.newCollection(ret)
    }

    public pop = (): IAction => {
        const list = this.state.slice()
        const poped = list.pop()
        poped && this.set(list)
        return this.action(poped)
    }
    //add an element to the list
    public push = (v: any): IAction => {
        const list = this.state.slice()
        const n = list.push(this.newNode(v))
        n && this.set(list)
        return this.action(n)
    }

    public reduce = (callback: (accumulator: any, currentValue: any) => any, initialAccumulator: any = this.count() ? this.nodeAt(0) : null) => {
        const array = this.state
        for (let i = 0; i < array.length; i++)
            initialAccumulator = callback(initialAccumulator, array[i])
        return initialAccumulator
    }

    public reverse = () => this.newCollection(this.state.slice().reverse())

    public shift = (): IAction => {
        const list = this.state.slice()
        const shifted = list.shift()
        shifted && this.set(list)
        return this.action(shifted)
    }

    public slice = (...indexes: any) => this.newCollection(this.state.slice(...indexes))

    public splice = (...args: any) => {
        const start = args[0]
        const deleteCount = args[1]
        const items = args.slice(2, args.length)

        const internalSplice = (...args: any) => {
            const list = this.state.slice()
            const value = list.splice(...args)
            this.set(list)
            return this.action(value)
        }

        if (typeof start !== 'number')
            throw new Error("splice start parameter must be a number")

        if (!deleteCount)
            return internalSplice(start)

        if (typeof deleteCount !== 'number')
            throw new Error("splice deleteCount parameter must be a number")

        if (items.length == 0)
            return internalSplice(start, deleteCount)

        for (let i = 0; i < items.length; i++){
            if (!this._isNodeModel(items[i]) && !Model._isObject(items[i]))
                throw new Error("items parameter must be an Objet or the same Model than collection's nodes")
            else 
                items[i] = this.newNode(items[i])
        }

        return internalSplice(start, deleteCount, ...items)
    }

    // Update the element at index or post it.
    public update = (v: any, index: number): IAction => {
        const vCopy = this.newNode(v)
        const list = this.state.slice()
        if (list[index]){
            list[index] = vCopy
            this.set(list)
            return this.action(vCopy)
        }
        return this.push(vCopy)
    }


    public newFromPull = (rows: any[]): Collection => {
        this._setPrevStateStore(rows.slice())
        return this.newCollection(rows)
    }
    /*
        Transform an array of object into an array of instancied Model
        Exemple => 
        [{content: '123', id: 'abc'}, {content: '456', id: 'def'}]
        to
        [new Model(content: '123', id: 'abc'}), new Model({content: '456', id: 'def'})]
        the class used to instance the objects is the one passed in parameters as nodeModel in the constructor.

    */
    public toListClass = (elem: any[] = []): Model[] => {
        let ret: Model[] = []
        elem.forEach((elem) => ret.push(this.newNode(elem)))
        return ret
    }

    //Return the state to JSONified object.
    //It implies that the state is an array, an object or a Model typed class (model or extended from Model)
    public toPlain = (...args: any): any => {
        const ret: any[] = []
        this.state.forEach((m: Model) => ret.push(m.toPlain()))
        return ret
    }

    public toString = (): string => JSON.stringify(this.toPlain())

    private _getNodeCollection = (): any => this.option().nodeCollection() as Collection
    private _getNodeModel = (): any => this.option().nodeModel() as Model

    private _isNodeCollection = (value: any): boolean => value instanceof this._getNodeCollection()
    private _isNodeModel = (value: any): boolean => value instanceof this._getNodeModel()

    private _newNodeCollectionInstance = (defaultState: any) => new (this._getNodeCollection())(defaultState, this.option().kids())  
    private _newNodeModelInstance = (defaultState: any) => new (this._getNodeModel())(defaultState, this.option().kids())  
}