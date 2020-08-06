import find from 'lodash/find'
import filter from 'lodash/filter'
import findIndex from 'lodash/findIndex'
import isEqual from 'lodash/isEqual'
import orderBy from 'lodash/orderBy'
import remove from 'lodash/remove'

import Collection from './'
import Manager from '../manager'
import Model from '../model'
import { populate as populateCollection } from './utils'
import to from './to'
import errors from '../errors'

interface ILocalMethods {
    append(...values: any): LocalManager
    count(): number
    find(predicate: any): Model | null
    findIndex(predicate: any): number
    fillPrevStateStore(prevStateStore: any[] | void): LocalManager
    filter(predicate: any): LocalManager
    first(): Model | null
    indexOf(v: any): number
    last(): Model | null
    limit(limit: number): LocalManager
    map(callback: (v: any, index: number) => any): any[]
    nodeAt(index: number): Model | undefined
    offset(offset: number): LocalManager
    orderBy(iteratees: any[], orders: any[] | void): LocalManager
    pop(): LocalManager
    prepend(...values: any): LocalManager
    push(v: any): LocalManager
    reduce(callback: (accumulator: any, currentValue: any) => any, initialAccumulator: any): any
    remove(v: any): LocalManager
    removeBy(predicate: any): LocalManager
    removeIndex(index: number): LocalManager
    reverse(): LocalManager
    set(state: any[]): LocalManager
    shift(): LocalManager
    slice(): LocalManager
    splice(...args: any): LocalManager
    updateAt(v: any, index: number): LocalManager
    updateWhere(predicate: any, toSet: Object): LocalManager
}

export default class LocalManager {

    private _lastManipulationResult = null
    private _prevStateStore: any = []
    private _state: any = []
    c: Collection
    
    public get prevStateStore(){ return this._prevStateStore }
    public get state(){ return this._state }

    public getLastManipulationResult = () => this._lastManipulationResult
    public setManipulationResult = (result: any) => this._lastManipulationResult = result

    public to = () => to(this.c)

    public fillPrevStateStore = (prevStateStore = this.to().plainUnpopulated()) => {
        this._prevStateStore = prevStateStore
        return this.c
    }

    constructor(c: Collection){
        this.c = c
    }

    ////////////  INTERNAL METHODS //////////////

    private _changesFromLastSave = () => {
        const primary = this.c.super().schemaSpecs().getPrimaryKey()
        const toDelete: any[] = []
        const toUpdate: Model[] = []

        const prevStateStore = this.prevStateStore as Array<any>
        const currentStateStore = this.to().plainUnpopulated()

        if (!isEqual(prevStateStore, currentStateStore)){
            prevStateStore.forEach( (value) => !!value[primary] && !find(currentStateStore, {[primary]: value[primary]}) && toDelete.push(value))
            this.state.forEach( (value: Model) => !find(prevStateStore, value.to().plainUnpopulated()) && toUpdate.push(value))
        }
        return { toDelete: this.to().listClass(toDelete), toUpdate: toUpdate }
    }


    /*          SQL RELATED METHODS            */

    public saveToDB = async (): Promise<this> => {
        const { toDelete, toUpdate } = this._changesFromLastSave()
        toDelete.length && await this.c.sql().list(toDelete).remove()
        toUpdate.length && await this.c.sql().list(toUpdate).update()
        this.fillPrevStateStore()
        return this
    }

    public populate = async (): Promise<this> => {
        (this.c.super().is().unpopulated() || this.c.super().is().plainPopulated()) && await populateCollection(this.c)
        return this
    }

    public unpopulate = (): this => {
        this.state.forEach((m: Model) => m.unpopulate())
        return this
    }


    /*     PURE LOCAL STATE INTERACTION METHODS         */

    public append = (...values: any): this => this.set(this.state.concat(values.map((value: any) => this.c.newNode(value).mustValidateSchema())))
    //Return the number of element in the array
    public count = (): number => this.state.length

    //find the first node matching the predicate see: https://lodash.com/docs/4.17.15#find
    public find = (predicate: any): Model | null => {
        const o = find(this.to().plain(), predicate)
        if (o){
            const index = this.findIndex(o)
            return index < 0 ? null : this.state[index]
        }
        return null
    }

    //return the index of the first element found matching the predicate. see https://lodash.com/docs/4.17.15#findIndex
    public findIndex = (predicate: any): number => findIndex(this.to().plain(), predicate)


    //pick up a list of node matching the predicate. see: https://lodash.com/docs/4.17.15#filter
    public filter = (predicate: any): LocalManager => this.c.new( filter(this.to().plain(), predicate)).local()

    public first = (): Model | null => this.count() == 0 ? null : this.nodeAt(0)

    //return the index of the element passed in parameters if it exists in the list.
    public indexOf = (v: any): number => findIndex(this.to().plain(), this.c.newNode(v).to().plain())

    public last = (): Model | null => this.count() == 0 ? null : this.nodeAt(this.count() - 1)

    public limit = (limit: number): LocalManager => this.slice(0, limit)

    public map = (callback: (v: any, index: number) => any): any[] => { 
        const array = this.state
        let ret: any[] = []
        for (let i = 0; i < array.length; i++){
            const v = callback(array[i], i)
            v && ret.push(v)
        }
        return ret
    }

    public nodeAt = (index: number): Model | null => this.state[index] ? this.state[index] : null
    public offset = (offset: number): LocalManager => this.slice(offset)

    //return a sorted array upon the parameters passed. see: https://lodash.com/docs/4.17.15#orderBy
    public orderBy = (iteratees: any[] = [], orders: any[] = ['desc']): LocalManager => this.c.new(orderBy(this.to().plain(), iteratees, orders)).local()

    public pop = () => {
        const list = this.state.slice()
        const poped = list.pop()
        poped && this.set(list)
        this.setManipulationResult(poped)
        return this
    }


    public prepend = (...values: any): this => this.set(values.map((value: any) => this.c.newNode(value).mustValidateSchema()).concat(this.state))

    //add an element to the list
    public push = (v: any): this => {
        const list = this.state.slice()
        const n = list.push(this.c.newNode(v).mustValidateSchema())
        n && this.set(list)
        this.setManipulationResult(n)
        return this
    }

    public reduce = (callback: (accumulator: any, currentValue: any) => any, initialAccumulator: any = this.count() ? this.nodeAt(0) : null) => {
        const array = this._state
        for (let i = 0; i < array.length; i++)
            initialAccumulator = callback(initialAccumulator, array[i])
        return initialAccumulator
    }

    //remove a node if it exists in the list, by primary key or predicate object.
    public remove = (v: Object | string | number): this => {
        if (typeof v === 'string' || typeof v === 'number'){
            const primary = this.c.super().schemaSpecs().getPrimaryKey()
            if (!primary)
                throw errors.noPrimaryKey(this.c.super().option().table())
            return this.removeBy({[primary]: v})            
        }
        return this.removeBy(v)
    }

    //remove all the nodes matching the predicate. see https://lodash.com/docs/4.17.15#remove
    public removeBy = (predicate: any): this => {
        const statePlain = this.to().plain()
        const e = remove(statePlain, predicate)
        !!e.length && this.set(statePlain)
        return this
    }

    public removeIndex = (index: number): this => {
        const value = this.splice(index, 1).getLastManipulationResult() as any
        this.setManipulationResult(!!value.length ? value[0] : undefined)
        return this
    }

    public reverse = (): LocalManager => this.c.new(this._state.slice().reverse()).local()

    public set = (state: any[] = this.state): this => {
        const tableName = this.c.super().option().table()
        const ctxID = this.c.__contextID
        if (Manager.collections().node(tableName).__contextID === ctxID){
            throw new Error(`The local state of the global instance of a Collection can't be updated. Use the method ctx() before updating it.`)
        }        
        if (!Model._isArray(state))
            throw errors.onlyArrayOnCollectionState()

        this._state = this.to().listClass(state)
        return this
    }

    public shift = (): this => {
        const list = this.state.slice()
        const shifted = list.shift()
        shifted && this.set(list)
        this.setManipulationResult(shifted)
        return this
    }

    public slice = (...indexes: any): LocalManager => this.c.new(this.state.slice(...indexes)).local()

    public splice = (...args: any): this => {
        const start = args[0]
        const deleteCount = args[1]
        const items = args.slice(2, args.length)

        const internalSplice = (start: number, ...args: any) => {
            const list = this.state.slice()
            const value = list.splice(start, ...args)
            this.set(list)
            this.setManipulationResult(value)
            return this
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
            if (!this.c.super().is().nodeModel(items[i]) && !Model._isObject(items[i]))
                throw new Error("items parameter must be an Objet or the same Model than collection's nodes")
            else 
                items[i] = this.c.newNode(items[i])
        }

        return internalSplice(start, deleteCount, ...items)
    }

    // Update the element at index or post it.
    public updateAt = (v: any, index: number): this => {
        const vCopy = this.c.newNode(v).mustValidateSchema()
        const list = this.state.slice()
        if (list[index]){
            list[index] = vCopy
            this.set(list)
            this.setManipulationResult(vCopy)
            return this
        }
        return this.push(vCopy)
    }

    // Update the element at index or post it.
    public updateWhere = (predicate: any, toSet: Object): this => {
        let count = 0;
        for (let m of this.state)
            find([m.to().plainUnpopulated()], predicate) && m.setState(toSet) && count++
        this.setManipulationResult(count)
        return this
    }
}