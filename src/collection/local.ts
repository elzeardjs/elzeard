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
    
    //Previous Collection's state
    public get prevStateStore(){ return this._prevStateStore }
    
    //Current Collection's state
    public get state(){ return this._state }

    //Returns the last result of local writting manipulation in the local state (update/add/remove)
    public getLastManipulationResult = (): any => this._lastManipulationResult
    private _setManipulationResult = (result: any) => {
        this._lastManipulationResult = result
    }

    //Returns methods to convert your Collection local state into data types (like string, plain JSON..)
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


    //Save to the database all the changes that has been made in the local state of the collection.
    public saveToDB = async (): Promise<this> => {
        const { toDelete, toUpdate } = this._changesFromLastSave()
        toDelete.length && await this.parent().sql().list(toDelete).remove()
        toUpdate.length && await this.parent().sql().list(toUpdate).update()
        this.fillPrevStateStore()
        return this
    }

    //Replaces the key defined as a foreign key or a populated with the object at the origin of the foreign key or populate key.
    public populate = async (): Promise<this> => {
        (this.parent().super().is().unpopulated() || this.parent().super().is().plainPopulated()) && await populateCollection(this.parent())
        return this
    }

    //Reverse function of populate
    public unpopulate = (): this => {
        this.state.forEach((m: Model) => m.unpopulate())
        return this
    }


    /*     PURE LOCAL STATE INTERACTION METHODS         */

    //Returns an Array of value for the key in each element of the Collection.
    public arrayOf = (key: string): any[] => this.map((m: Model) => m.state[key])

    //Returns a fresh Collection with the Array passed in parameter added at the end of the current Collection's state.
    public append = (...values: any): this => this.concat(values)
  
    /*
        Returns an Array of collections splited into groups of the length of nChunk.
        The original Collection will not be modified.
    */
    public chunk = (nChunk: number): Collection[] => {
        const list: any[] = chunk(this.state, nChunk)
        for (let i = 0; i < list.length; i++){
            list[i] = this.parent().new(list[i])
        }
        return list
    }
  
    //Concatenates the current state with any values.
    public concat = (list: any[]): this => {
        return this.set(this.state.concat(list.map((value: any) => this.parent().newNode(value).mustValidateSchema())))
    }

    //Return the number of element in the array
    public count = (): number => this.state.length

    //Finds the first node matching the predicate
    public find = (predicate: TPredicatePickNode): Model | undefined => {
        const index = this.findIndex(predicate)
        if (index == -1)
            return undefined
        return this.nodeAt(index) as Model
    }

    //Returns the index of the first node matching the predicate
    public findIndex = (predicate: TPredicatePickNode): number => findIndex(collectionPredictor(predicate, this.parent()), predicate)

    /*
        Returns a new Collection filled with list of node matching the predicate
        The original Collection will not be modified.
    */
    public filter = (predicate: TPredicatePickNode): LocalManager => this.parent().new(filter(this.state, treatPredicatePickNode(predicate))).local()

    /*
        Returns a new Collection filled with the nodes for whom the key's value is equal to one of the value in the arrayElems passed in parameter.
        The original Collection will not be modified.
    */
    public filterIn = (key: string, arrayElems: any[]): LocalManager => this.filter((m: Model) => arrayElems.indexOf(m.state[key]) != -1)

    //Returns the head node of the list
    public first = (): Model | undefined => this.nodeAt(0)

    public forEach = (callback: (m: any, index: number) => any) => {
        for (let i = 0; i < this.count(); i++)
            callback(this.state[i], i)
    }

    /*
        Returns an object composed of keys generated from the results of running each element of collection thru iteratee.
        The corresponding value of each key is a Collection of elements responsible for generating the key.
    */
    public groupBy = (predicate: TPredicatePickKey): IGrouped => {
        const d = groupBy(this.state, treatPredicatePickNode(predicate))
        const ret: IGrouped = {}
        Object.keys(d).map((key: string) => ret[key] = this.parent().new(d[key]))
        return ret
    }

    //Returns the index of the first node matching the predicate
    public indexOf = (predicate: TPredicatePickNode) => this.findIndex(predicate)

    //Returns the tail node of the list
    public last = (): Model | undefined => this.nodeAt(this.count() - 1)

    /*
    	Returns a collection filled with the n first nodes of the list.
        The original Collection will not be modified.
    */
    public limit = (limit: number): LocalManager => this.slice(0, limit)

    //Creates a new array with the results of calling the callback for every Collection node (same than javascript map on arrays)
    public map = (callback: (v: any, index: number) => any): any[] => { 
        let ret: any[] = []
        this.forEach((m: Model, index: number) => {
            const v = callback(m, index)
            v && ret.push(v)
        })
        return ret
    }

    //Returns the node at index in the list.
    public nodeAt = (index: number): Model | undefined => this.state[index]

    //Gets the node at index n of the Collection. If n is negative, the nth node from the end is returned.
    public nth = (index: number): Model | undefined => this.count() == 0 ? undefined : (nth(this.state, index) as Model)

    /*
        Returns a fresh instance of the collection removing the n first nodes of the list.
        The original Collection will not be modified.
    */
    public offset = (offset: number): LocalManager => this.slice(offset)

    /*
        Returns a fresh Collection with the nodes sorted upon the parameters passed
        The original Collection will not be modified.
    */
    public orderBy = (predicate: TPredicateSort, order: TOrderSort): Collection => {
        return this.parent().new(
            orderBy(this.state, treatPredicateSortNode(predicate), order)
        )
    }

    //Removes the last node in the list
    public pop = () => {
        const list = this.state.slice()
        const poped = list.pop()
        poped && this.set(list)
        this._setManipulationResult(poped)
        return this
    }

    //Adds the values at the beginning of the current Collection's state.
    public prepend = (...values: any): this => this.set(values.map((value: any) => this.parent().newNode(value).mustValidateSchema()).concat(this.state))

    //add a node at the end of the list
    public push = (v: any): this => {
        const list = this.state.slice()
        const n = list.push(this.parent().newNode(v).mustValidateSchema())
        n && this.set(list)
        this._setManipulationResult(n)
        return this
    }

    /* 
        Reduces Collection to a value which is the accumulated result of running each element in collection, 
        where each successive invocation is supplied the return value of the previous. 
        If initialAccumulator is not given, the first Model of Collection is used as the initial value.
    */
    public reduce = (callback: (accumulator: any, currentValue: any) => any, initialAccumulator: any = this.count() ? this.nodeAt(0) : null) => {
        const array = this._state
        for (let i = 0; i < array.length; i++)
            initialAccumulator = callback(initialAccumulator, array[i])
        return initialAccumulator
    }

    //Removes the Model passed in parameter if present in the list.
    public remove = (v: TPredicatePickNode): this => {
        const index = this.findIndex(v)
        const list = this.state.slice()
        if (index > -1){
            const v = list.splice(index, 1)
            if (!!v.length){
                this.set(list)
                this._setManipulationResult(v[0])
                return this
            }
        }
        return this
    }

    //Removes all the nodes matching the predicate
    public removeBy = (predicate: TPredicatePickNode): this => {
        const futureState = collectionPredictor(predicate, this.parent())
        const e = remove(futureState, predicate)
        !!e.length && this.set(futureState)
        this._setManipulationResult(e.length)
        return this
    }

    //Removes an element at index.
    public removeIndex = (index: number): this => {
        this.splice(index, 1)
        const value = this.getLastManipulationResult()
        this._setManipulationResult(!!value.length ? value[0] : undefined)
        return this
    }

    /*
        Returns a fresh collection with the reversed order the nodes in the collection.
        The original Collection will not be modified.
    */
    public reverse = (): LocalManager => this.parent().new(this.state.slice().reverse()).local()

    //Replaces the state by the one passed in parameter.
    public set = (state: any[] = this.state): this => {
        const tableName = this.parent().super().option().table()
        const ctxID = this.parent().__contextID
        if (Manager.collections().node(tableName).__contextID === ctxID){
            throw errors.pullOnMotherCollection()
        }        
        if (!Model._isArray(state))
            throw errors.onlyArrayOnCollectionState()

        this._state = this.to().listClass(state)
        return this
    }

    //Remove the first element
    public shift = (): this => {
        const list = this.state.slice()
        const shifted = list.shift()
        shifted && this.set(list)
        this._setManipulationResult(shifted)
        return this
    }

    /* 
        The slice() method returns a shallow copy of a portion of the Collection 
        into a new Collection of Models selected from start to end (end not included) 
        where start and end represent the index of items in that Collection. 
        The original array Collection will not be modified.
    */
    public slice = (...indexes: any): LocalManager => this.parent().new(this.state.slice(...indexes)).local()

    //The splice() method changes the contents of an array by removing or replacing existing Models and/or adding new Models in place.
    public splice = (...args: any): this => {
        const start = args[0]
        const deleteCount = args[1]
        const items = args.slice(2, args.length)

        const internalSplice = (start: number, ...args: any) => {
            const list = this.state.slice()
            const value = list.splice(start, ...args)
            this.set(list)
            this._setManipulationResult(value)
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
                items[i] = this.parent().newNode(items[i]).mustValidateSchema()
        }

        return internalSplice(start, deleteCount, ...items)
    }

    //Set the state of every model in the collection with the data passed in parameter.
    public updateAll = (toSet: Object): this => {
        this.forEach((m: Model) => m.setState(toSet))
        this._setManipulationResult(this.count())
        return this
    }

    //Updates the element at index with the Model or Object passed in parameter
    public updateAt = (v: any, index: number): this => {
        const vCopy = this.parent().newNode(v).mustValidateSchema()
        const list = this.state.slice()
        if (list[index]){
            list[index] = vCopy
            this.set(list)
            this._setManipulationResult(vCopy)
            return this
        }
        return this.push(vCopy)
    }

    //Merges the states of the Models matching the predicate with toSet Object value
    public updateWhere = (predicate: TPredicatePickNode, toSet: Object): this => {
        const list = this.filter(predicate)
        list.forEach((m: Model) => m.setState(toSet))
        this._setManipulationResult(list.count())
        return this
    }

    /*
        Returns a new Collection with only unique elements.
        The original Collection will not be modified.
    */
    public uniq = (): LocalManager => {
        let ret = this.parent().new([]).local()
        this.forEach((m: Model) => !ret.find(m.to().plain()) && ret.push(m))
        return ret
    }

    /*
        Returns a new Collection with the iteratee by which uniqueness is computed.
        The original Collection will not be modified.
    */
    public uniqBy = (predicate: TPredicatePickKey): Collection => this.parent().new(uniqBy(collectionPredictor(predicate, this.parent()), predicate))
}