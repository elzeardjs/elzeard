import find from 'lodash/find'
import filter from 'lodash/filter'
import findIndex from 'lodash/findIndex'
import isEqual from 'lodash/isEqual'
import orderBy from 'lodash/orderBy'
import remove from 'lodash/remove'
import chunk from 'lodash/chunk'
import groupBy from 'lodash/groupBy'
import nth from 'lodash/nth'
import uniqBy from 'lodash/uniqBy'

import Collection from './'
import Manager from '../manager'
import Model from '../model'
import { populate as populateCollection } from './utils'
import to from './to'
import errors from '../errors'

import { 
    IGrouped,
    TPredicateSort,
    TOrderSort,
    treatPredicateSortNode,
    collectionPredictor,
    treatPredicatePickNode,
    TPredicatePickKey,
    TPredicatePickNode
} from './lodash-utils'

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

    private _lastManipulationResult: any = null
    private _prevStateStore: any = []
    private _state: any = []
    private _c: Collection
    
    public get prevStateStore(){ return this._prevStateStore }
    public get state(){ return this._state }

    public getLastManipulationResult = (): any => this._lastManipulationResult
    public setManipulationResult = (result: any) => {
        this._lastManipulationResult = result
    }

    public to = () => to(this.parent())

    public fillPrevStateStore = (prevStateStore = this.to().plainUnpopulated()) => {
        this._prevStateStore = prevStateStore
        return this.parent()
    }

    public parent = (): Collection => this._c
    constructor(c: Collection){
        this._c = c
    }

    ////////////  INTERNAL METHODS //////////////

    private _changesFromLastSave = () => {
        const primary = this.parent().super().schemaSpecs().getPrimaryKey()
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
        toDelete.length && await this.parent().sql().list(toDelete).remove()
        toUpdate.length && await this.parent().sql().list(toUpdate).update()
        this.fillPrevStateStore()
        return this
    }

    public populate = async (): Promise<this> => {
        (this.parent().super().is().unpopulated() || this.parent().super().is().plainPopulated()) && await populateCollection(this.parent())
        return this
    }

    public unpopulate = (): this => {
        this.state.forEach((m: Model) => m.unpopulate())
        return this
    }


    /*     PURE LOCAL STATE INTERACTION METHODS         */

    public arrayOf = (key: string): any[] => this.map((m: Model) => m.state[key])

    public append = (...values: any): this => this.concat(values)
  
    public chunk = (nChunk: number): Collection[] => {
        const list: any[] = chunk(this.state, nChunk)
        for (let i = 0; i < list.length; i++){
            list[i] = this.parent().new(list[i])
        }
        return list
    }
  
    public concat = (list: any[]): this => {
        return this.set(this.state.concat(list.map((value: any) => this.parent().newNode(value).mustValidateSchema())))
    }

    //Return the number of element in the array
    public count = (): number => this.state.length

    //find the first node matching the predicate see: https://lodash.com/docs/4.17.15#find
    public find = (predicate: TPredicatePickNode): Model | undefined => {
        const index = this.findIndex(predicate)
        if (index == -1)
            return undefined
        return this.nodeAt(index) as Model
    }

    //return the index of the first element found matching the predicate. see https://lodash.com/docs/4.17.15#findIndex
    public findIndex = (predicate: TPredicatePickNode): number => findIndex(collectionPredictor(predicate, this.parent()), predicate)

    //pick up a list of node matching the predicate. see: https://lodash.com/docs/4.17.15#filter
    public filter = (predicate: TPredicatePickNode): LocalManager => this.parent().new(filter(this.state, treatPredicatePickNode(predicate))).local()

    public filterIn = (key: string, arrayElems: any[]): LocalManager => this.filter((m: Model) => arrayElems.indexOf(m.state[key]) != -1)

    public first = (): Model | undefined => this.nodeAt(0)

    public forEach = (callback: (m: any, index: number) => any) => {
        for (let i = 0; i < this.count(); i++)
            callback(this.state[i], i)
    }

    public groupBy = (predicate: TPredicatePickKey): IGrouped => {
        const d = groupBy(this.state, treatPredicatePickNode(predicate))
        const ret: IGrouped = {}
        Object.keys(d).map((key: string) => ret[key] = this.parent().new(d[key]))
        return ret
    }

    //return the index of the element passed in parameters if it exists in the list.
    public indexOf = (v: any): number => findIndex(this.to().plain(), this.parent().newNode(v).to().plain())

    public last = (): Model | undefined => this.nodeAt(this.count() - 1)

    public limit = (limit: number): LocalManager => this.slice(0, limit)

    public map = (callback: (v: any, index: number) => any): any[] => { 
        let ret: any[] = []
        this.forEach((m: Model, index: number) => {
            const v = callback(m, index)
            v && ret.push(v)
        })
        return ret
    }

    public nodeAt = (index: number): Model | undefined => this.state[index]

    public nth = (index: number): Model | undefined => this.count() == 0 ? undefined : (nth(this.state, index) as Model)

    public offset = (offset: number): LocalManager => this.slice(offset)

    //return a sorted array upon the parameters passed. see: https://lodash.com/docs/4.17.15#orderBy
    public orderBy = (predicate: TPredicateSort, order: TOrderSort): Collection => {
        return this.parent().new(
            orderBy(this.state, treatPredicateSortNode(predicate), order)
        )
    }

    public pop = () => {
        const list = this.state.slice()
        const poped = list.pop()
        poped && this.set(list)
        this.setManipulationResult(poped)
        return this
    }

    public prepend = (...values: any): this => this.set(values.map((value: any) => this.parent().newNode(value).mustValidateSchema()).concat(this.state))

    //add an element to the list
    public push = (v: any): this => {
        const list = this.state.slice()
        const n = list.push(this.parent().newNode(v).mustValidateSchema())
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


    //delete a node if it exists in the list.
    public remove = (v: any): this => {
        const index = this.indexOf(v)
        const list = this.state.slice()
        if (index > -1){
            const v = list.splice(index, 1)
            if (!!v.length){
                this.set(list)
                this.setManipulationResult(v[0])
                return this
            }
        }
        return this
    }

    public removeAll = (list: any[] = this.state): this => {
        let count = 0;
        list.map((e: any) => this.indexOf(e) != -1 && this.remove(e) && count++)
        this.setManipulationResult(count)
        return this
    }

    //delete all the nodes matching the predicate. see https://lodash.com/docs/4.17.15#remove
    public removeBy = (predicate: TPredicatePickNode): this => {
        const futureState = collectionPredictor(predicate, this.parent())
        const e = remove(futureState, predicate)
        !!e.length && this.set(futureState)
        this.setManipulationResult(e.length)
        return this
    }

    public removeIndex = (index: number): this => {
        this.splice(index, 1)
        const value = this.getLastManipulationResult()
        this.setManipulationResult(!!value.length ? value[0] : undefined)
        return this
    }

    public reverse = (): LocalManager => this.parent().new(this.state.slice().reverse()).local()

    public set = (state: any[] = this.state): this => {
        const tableName = this.parent().super().option().table()
        const ctxID = this.parent().__contextID
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

    public slice = (...indexes: any): LocalManager => this.parent().new(this.state.slice(...indexes)).local()

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
            if (!this.parent().super().is().nodeModel(items[i]) && !Model._isObject(items[i]))
                throw new Error("items parameter must be an Objet or the same Model than collection's nodes")
            else 
                items[i] = this.parent().newNode(items[i])
        }

        return internalSplice(start, deleteCount, ...items)
    }

    public updateAll = (toSet: Object): this => {
        this.forEach((m: Model) => m.setState(toSet))
        this.setManipulationResult(this.count())
        return this
    }

    // Update the element at index or post it.
    public updateAt = (v: any, index: number): this => {
        const vCopy = this.parent().newNode(v).mustValidateSchema()
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
    public updateWhere = (predicate: TPredicatePickNode, toSet: Object): this => {
        const list = this.filter(predicate)
        list.forEach((m: Model) => m.setState(toSet))
        this.setManipulationResult(list.count())
        return this
    }

    public uniq = (): LocalManager => {
        let ret = this.parent().new([]).local()
        this.forEach((m: Model) => !ret.find(m.to().plain()) && ret.push(m))
        return ret
    }

    public uniqBy = (predicate: TPredicatePickKey): Collection => this.parent().new(uniqBy(collectionPredictor(predicate, this.parent()), predicate))
}