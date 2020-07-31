import _ from 'lodash'

import Errors from '../errors'
import { unpopulate, populate } from './utils'
import {  verifyAllModel } from '../verify'
import { Ecosystem, ISchema } from 'joi-to-sql'

import to from './to'
import IsManager, {IIs} from '../state/is'
import OptionManager from '../state/option'
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
    
    public get state(){ 
        this._checkIfModelIsDestroyed()
        return this._state 
    }

    public super = (): ISuper => {
        this._checkIfModelIsDestroyed()

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

    public sql = () => {
        this._checkIfModelIsDestroyed()
        return this.super().option().get().sql as SQLManager
    }
    
    public to = () => {
        this._checkIfModelIsDestroyed()
        return to(this)
    }

    constructor(state: any, model: Constructor<Model>, ...option: any){
        this._option = new OptionManager(this, Object.assign({}, ...option, {nodeModel: model}))

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

    public copy = (): Model => {
        this._checkIfModelIsDestroyed()
        return this.new(this.state).super().fillPrevStateStore(this.super().prevStateStore)
    }

    public new = (defaultState: any) => {
        this._checkIfModelIsDestroyed()
        return new (this.super().option().nodeModel())(defaultState, this.super().option().kids())
    }

    public saveToDB = async () => {
        this._checkIfModelIsDestroyed()
        if (this.super().option().isKidsPassed()){
            const prevStatePlain = this.super().prevStateStore
            const newStatePlain = this.to().plainUnpopulated()
            if (!_.isEqual(prevStatePlain, newStatePlain)){
                this.mustValidateSchema(newStatePlain)
                await this.sql().node(this).update()
                this.super().fillPrevStateStore(newStatePlain)
            }
        } else 
            throw errors.noCollectionBinding(this)
    }

    public destroy = async () => {
        this._checkIfModelIsDestroyed()
        try {
            await this.sql().node(this).delete()
            this._isModelDestroyed = true
        } catch (e){
            throw new Error(e)
        }
    }

    //Only usable in a Model/State
    public setState = (o = this.state) => {
        this._checkIfModelIsDestroyed()
        if (!Model._isObject(o))
            throw errors.onlyObjectOnModelState()

        const newState = Object.assign({}, this.state, o)
        try {
            this.mustValidateSchema(newState)
            this._set(newState)
            verifyAllModel(this) 
        } catch (e){
            throw new Error(e)
        }
        return this
    }

    public populate = async () => {
        this._checkIfModelIsDestroyed()
        if (this.super().is().unpopulated() || this.super().is().plainPopulated()) 
            await populate(this) 
        return this
    }

    public unpopulate = () => {
        this._checkIfModelIsDestroyed()
        unpopulate(this)
        return this
    }

    public mustValidateSchema = (state = this.state) => {
        this._checkIfModelIsDestroyed()

        const s = this.new(state).to().plainUnpopulated()
        const defaults = this.super().schemaSpecs().defaults()
        const stateCopy = _.clone(s)

        for (let key in s)
            s[key] === null && !defaults[key] && delete stateCopy[key]

        const { error } = this.super().schemaSpecs().validate(stateCopy)
        console.log(error, stateCopy)
        if (error) throw new Error(error)
        return this
    }


    static _isArray = (value: any): boolean => Array.isArray(value)
    static _isObject = (value: any): boolean => value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Model) && !(value instanceof Date)
}