import isEqual from 'lodash/isEqual'
import clone from 'lodash/clone'

import Errors from '../errors'
import { unpopulate, populate } from './utils'
import {  verifyAllModel } from '../verify'
import { Ecosystem, ISchema } from 'joixsql'

import to from './to'
import IsManager, {IIs} from '../state/is'
import OptionManager, { IOptions } from '../state/option'
import SQLManager from '../sql'
import errors from '../errors'
import config from '../config'

export interface ISuper {
    schemaSpecs(): ISchema
    is(): IIs
    option(): OptionManager
    fillGroup(group: string[]): Model
    fillPrevStateStore(prevStateStore: any | void): Model,
    prevStateStore: any
    group: string[]
}

type Constructor<T> = new(...args: any[]) => T;

export default class Model {

    private _prevStateStore: any = {}
    private _state: any = {}
    private _group: string[] = []
    private _isModelDestroyed: boolean = false

    private _option: OptionManager
    
    //Returns the local's state of the model
    public get state(){ 
        this._checkIfModelIsDestroyed()
        return this._state 
    }

    /* 
        Methods used by Elzeard itself for its working process.
        You won't need to access this method unless you are building
        a package on top or an extension.
    */
    public super = (): ISuper => {
        this._checkIfModelIsDestroyed()

        //returns the JoiXSQL schema of the collection (includes the Joi object)
        const schemaSpecs = () => {
            const modelSchema = (option().nodeModel() as any).schema
            const ecosystem = (config.ecosystem() as Ecosystem)
            return ecosystem.schema({schema: modelSchema, tableName: option().table()})
        }
    
        const is = () => IsManager(this)
        const option = (): OptionManager => this._option

        const fillGroup = (group: string[]) => {
            this._group = group
            return this
        }
    
        const fillPrevStateStore = (prevStateStore: any) => {
            this._prevStateStore = prevStateStore
            return this
        }

        return { 
            schemaSpecs, is, option,
            fillGroup, fillPrevStateStore,
            prevStateStore: this._prevStateStore,
            group: this._group.slice()
        }
    }

    //Returns SQL methods to do to interact with the Model local state.
    public sql = () => {
        this._checkIfModelIsDestroyed()
        return this.super().option().get().sql as SQLManager
    }
    
    //returns data rendering methods
    public to = () => {
        this._checkIfModelIsDestroyed()
        return to(this)
    }

    constructor(state: any, model: Constructor<Model>, option: IOptions){
        this._option = new OptionManager(this, Object.assign({}, option, {nodeModel: model}))

        if (!this.super().option().nodeModel().schema)
            throw errors.noSchema(this)
        
        this._set(Object.assign({}, this.super().schemaSpecs().defaults(), this.super().schemaSpecs().cleanNonPresentValues(state)))
        this.super().is().plainPopulated() && this.populate()
    }

    private _checkIfModelIsDestroyed = () => {
        if (this._isModelDestroyed)
            throw errors.modelDestroyed(this)
    }

    private _set = (state: any = this.state) => {
        if (!Model._isObject(state))
            throw Errors.onlyObjectOnModelState()
        this._state = state
        return this        
    }

    //Returns an identical copy of the current model
    public copy = (): Model => {
        this._checkIfModelIsDestroyed()
        return this.new(this.state).super().fillPrevStateStore(this.super().prevStateStore)
    }

    //Create a new Model based on the current one with the state passed in parameters
    public new = (defaultState: any) => {
        this._checkIfModelIsDestroyed()
        return new (this.super().option().nodeModel())(defaultState, this.super().option().kids())
    }

    //Save the Model's state into the database. (update or insert)
    public saveToDB = async () => {
        this._checkIfModelIsDestroyed()
        if (this.super().option().isKidsPassed()){
            const prevStatePlain = this.super().prevStateStore
            const newStatePlain = this.to().plainUnpopulated()
            if (!isEqual(prevStatePlain, newStatePlain)){
                this.mustValidateSchema(newStatePlain)
                await this.sql().node(this).update()
                this.super().fillPrevStateStore(newStatePlain)
            }
        } else 
            throw errors.noCollectionBinding(this)
    }

    //Remove Model's state from table + disable Model class
    public destroy = async () => {
        this._checkIfModelIsDestroyed()
        try {
            await this.sql().node(this).delete()
            this._isModelDestroyed = true
        } catch (e: any){
            throw new Error(e)
        }
    }

    //Update Model's state.
    public setState = (o = this.state, skipSchemaValidation?: boolean) => {
        this._checkIfModelIsDestroyed()
        if (!Model._isObject(o))
            throw errors.onlyObjectOnModelState()

        const newState = Object.assign({}, this.state, o)
        try {
            !skipSchemaValidation && this.mustValidateSchema(newState)
            this._set(newState)
            verifyAllModel(this) 
        } catch (e: any){
            throw new Error(e)
        }
        return this
    }

    //Delete key/value in the state
    public deleteKey = (key: string) => {
        const newState = Object.assign({}, this.state)
        delete newState[key]
        this._set(newState)
    }

    //Replaces the key defined as a foreign key or a populated with the object at the origin of the foreign key or populate key.
    public populate = async () => {
        this._checkIfModelIsDestroyed()
        if (this.super().is().unpopulated() || this.super().is().plainPopulated()) 
            await populate(this) 
        return this
    }

    //Reverse of populate
    public unpopulate = () => {
        this._checkIfModelIsDestroyed()
        unpopulate(this)
        return this
    }

    //Throw an error if the state passed in parameter doesn't match the Model's schema
    public mustValidateSchema = (state = this.state) => {
        this._checkIfModelIsDestroyed()

        const s = this.new(state).to().plainUnpopulated()
        const defaults = this.super().schemaSpecs().defaults()
        const stateCopy = clone(s)

        for (let key in s)
            s[key] === null && !defaults[key] && delete stateCopy[key]

        const { error } = this.super().schemaSpecs().validate(stateCopy)
        if (error) throw new Error(error)
        return this
    }


    static _isArray = (value: any): boolean => Array.isArray(value)
    static _isObject = (value: any): boolean => value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Model) && !(value instanceof Date)
}