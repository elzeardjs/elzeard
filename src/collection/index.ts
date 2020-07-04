import _ from 'lodash'
import Model, {IAction} from '../model'
import IsManager from './is'
import OptionManager from './option'
import to from './to'
import SQLManager from '../sql' 
import schemaManager from '../schema'
import Manager from '../manager'

import { populate } from './utils'


type Constructor<T> = new(...args: any[]) => T;

//  i) this class can be improved by adding more than you can usually find in lists.
//It aims to be the parent of any model class representing a list of object/classes
//for example in a todolist it would be the parent of the TodoList class containing a list of Todos
//This can be useful to avoid redundant functions like sorting, filtering, pushing, deleting, updating etc...

export default class Collection {
    
    private _prevStateStore: any = []
    private _state: any = []
    private _prevState: any = []

    private _is: IsManager
    private _option: OptionManager
    private _sql: SQLManager

    public get prevStateStore(){ return this._prevStateStore }
    public get state(){ return this._state }
    public get prevState(){ return this._prevState }

    public schema = () => schemaManager(this.newNode(undefined))
    public is = (): IsManager => this._is
    public option = (): OptionManager => this._option
    public sql = (): SQLManager => this._sql
    public to = () => to(this)

    public fillPrevStateStore = (prevStateStore = this.to().plainUnpopulated()) => {
        this._prevStateStore = prevStateStore
        return this
    }

    public fillPrevState = (prevState = this.to().plainUnpopulated()) => {
        this._prevState = prevState
        return this
    }

    public action = (value: any = undefined): IAction => {
        return { save: this.save, value }
    }

    constructor(list: any[] = [], models: [Constructor<Model>, Constructor<Collection>], ...props: any){
        this._option = new OptionManager(this, Object.assign({}, { nodeModel: models[0], nodeCollection: models[1] }, props[0]))
        this._is = new IsManager(this)
        this._sql = new SQLManager(this)
        this.set(list)

        this.is().connected() && Manager.prepareCollection(this)
    }

    private changesFromLastSave = () => {
        const primary = this.schema().getPrimaryKey()
        const toDelete: any[] = []
        const toUpdate: Model[] = []

        const prevStateStore = this._prevStateStore as Array<any>
        const currentStateStore = this.to().plainUnpopulated()

        prevStateStore.forEach( (value) => !!value[primary] && !_.find(currentStateStore, {[primary]: value[primary]}) && toDelete.push(value))
        this.state.forEach((value: Model) => !_.find(prevStateStore, value.to().plainUnpopulated()) && toUpdate.push(value))

        return { toDelete: this.to().listClass(toDelete), toUpdate: toUpdate }
    }

    public save = async () => {
        const { toDelete, toUpdate } = this.changesFromLastSave()
        console.log('delete', this.new(toDelete).to().plainUnpopulated())
        console.log('toUpdate', this.new(toUpdate).to().plainUnpopulated())
        await this.sql().list(toDelete).remove()
        await this.sql().list(toUpdate).update()
        this.fillPrevStateStore()
    }

    public populate = async () => {
        (this.is().unpopulated() || this.is().plainPopulated()) && await populate(this)
        return this
    }

    public unpopulate = () => {
        this.state.forEach((m: Model) => m.unpopulate())
        return this
    }

    
    /////////////////////////////////////// LOCAL METHODS BELOW /////////////////////////////////////

    public set = (state: any[] = this.state): IAction => {
        this.fillPrevState()
        this._state = this.to().listClass(state)
        return this.action() 
    }

    //Return the number of element in the array
    public count = (): number => this.state.length

    public copy = (): Collection => this.new(this.to().plain())

    //delete a node if it exists in the list.
    public delete = (v: any): IAction => {
        const node = this.newNode(v)
        const primary = this.schema().getPrimaryKey()
        return this.deleteBy({[primary]: node.state[primary]})
    }

    //delete all the nodes matching the predicate. see https://lodash.com/docs/4.17.15#remove
    public deleteBy = (predicate: any): IAction => {
        const statePlain = this.to().plain()
        const e = _.remove(statePlain, predicate)
        !!e.length && this.set(statePlain)
        return this.action()
    }

    public deleteIndex = (index: number): IAction => {
        const { value } = this.splice(index, 1)
        return this.action(!!value.length ? value[0] : undefined)
    }

    //find the first node matching the predicate see: https://lodash.com/docs/4.17.15#find
    public find = (predicate: any) => {
        const o = _.find(this.to().plain(), predicate)
        if (o){
            const index = this.findIndex(o)
            return index < 0 ? undefined : this.state[index]
        }
        return undefined
    }

    //return the index of the first element found matching the predicate. see https://lodash.com/docs/4.17.15#findIndex
    public findIndex = (predicate: any): number => _.findIndex(this.to().plain(), predicate)

    //pick up a list of node matching the predicate. see: https://lodash.com/docs/4.17.15#filter
    public filter = (predicate: any) => this.new( _.filter(this.to().plain(), predicate))

    public first = (): Model | null => this.count() == 0 ? null : this.nodeAt(0)

    //return the index of the element passed in parameters if it exists in the list.
    public indexOf = (v: any): number => _.findIndex(this.to().plain(), this.newNode(v).to().plain())

    public last = (): Model | null => this.count() == 0 ? null : this.nodeAt(this.count() - 1)

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

    public new = (v: any): Collection => this.is().nodeCollection(v) ? v : this._newNodeCollectionInstance(v).fillPrevStateStore(this._prevStateStore)
    public newNode = (v: any): Model => this.is().nodeModel(v) ? v : this._newNodeModelInstance(v)
    public nodeAt = (index: number) => this.state[index]

    public offset = (offset: number) => this.slice(offset)

    //return a sorted array upon the parameters passed. see: https://lodash.com/docs/4.17.15#orderBy
    public orderBy = (iteratees: any[] = [], orders: any[] = []): Collection => this.new(_.orderBy(this.to().plain(), iteratees, orders))

    public pop = (): IAction => {
        const list = this.state.slice()
        const poped = list.pop()
        poped && this.set(list)
        return this.action(poped)
    }

    //add an element to the list
    public push = (v: any): IAction => {
        const list = this.state.slice()
        const n = list.push(this.newNode(v).mustValidateSchema())
        n && this.set(list)
        return this.action(n)
    }

    public reduce = (callback: (accumulator: any, currentValue: any) => any, initialAccumulator: any = this.count() ? this.nodeAt(0) : null) => {
        const array = this.state
        for (let i = 0; i < array.length; i++)
            initialAccumulator = callback(initialAccumulator, array[i])
        return initialAccumulator
    }

    public reverse = () => this.new(this.state.slice().reverse())

    public shift = (): IAction => {
        const list = this.state.slice()
        const shifted = list.shift()
        shifted && this.set(list)
        return this.action(shifted)
    }

    public slice = (...indexes: any) => this.new(this.state.slice(...indexes))

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
            if (!this.is().nodeModel(items[i]) && !Model._isObject(items[i]))
                throw new Error("items parameter must be an Objet or the same Model than collection's nodes")
            else 
                items[i] = this.newNode(items[i])
        }

        return internalSplice(start, deleteCount, ...items)
    }

    // Update the element at index or post it.
    public update = (v: any, index: number): IAction => {
        const vCopy = this.newNode(v).mustValidateSchema()
        const list = this.state.slice()
        if (list[index]){
            list[index] = vCopy
            this.set(list)
            return this.action(vCopy)
        }
        return this.push(vCopy)
    }

    // Update the element at index or post it.
    public updateWhere = (predicate: any, toSet: Object): IAction => {
        let count = 0;
        for (let m of this.state)
            _.find([m.to().plainUnpopulated()], predicate) && m.setState(toSet) && count++
        return this.action(count)
    }

    private _newNodeCollectionInstance = (defaultState: any) => new (this.option().nodeCollection())(defaultState, this.option().kids())  
    private _newNodeModelInstance = (defaultState: any) => new (this.option().nodeModel())(defaultState, this.option().kids())  
}