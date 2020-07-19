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
    fillPrevStateStore(prevStateStore: any | void): Model
}

export default class Model {

    private _prevStateStore: any = {}
    private _state: any = {}
    private _group: string[] = []

    private _option: OptionManager
    
    public get group(){ return this._group.slice() }
    public get prevStateStore(){ return this._prevStateStore }
    public get state(){ return this._state }

    public super = (): ISuper => {
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
            fillGroup, fillPrevStateStore
        }
    }

    public sql = () => this.super().option().get().sql as SQLManager
    public to = () => to(this)

    constructor(state: any, ...props: any){
        this._option = new OptionManager(this, Object.assign({}, props[0], props[1]))

        if (!this.super().option().nodeModel().schema)
            throw errors.noSchema(this)
        
        this._set(Object.assign({}, this.super().schemaSpecs().defaults(), this.super().schemaSpecs().cleanNonPresentValues(state)))
        this.super().is().plainPopulated() && this.populate()
    }

    private _set = (state: any = this.state) => {
        if (!Model._isObject(state))
            throw Errors.onlyObjectOnModelState()
        this._state = state
        return this        
    }

    public copy = (): Model => this.new(this.state).super().fillPrevStateStore(this.prevStateStore)

    public new = (defaultState: any) => new (this.super().option().nodeModel())(defaultState, this.super().option().kids())

    public saveToDB = async () => {
        if (this.super().option().isKidsPassed()){
            const prevStatePlain = this.prevStateStore
            const newStatePlain = this.to().plainUnpopulated()
            if (!_.isEqual(prevStatePlain, newStatePlain)){
                const { error } = this.super().schemaSpecs().validate(newStatePlain)
                if (error) throw new Error(error)
                await this.sql().node(this).update()
                this.super().fillPrevStateStore(newStatePlain)
            }
        } else 
            throw errors.noCollectionBinding(this)
    }

    //Only usable in a Model/State
    public setState = (o = this.state) => {
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
        (this.super().is().unpopulated() || this.super().is().plainPopulated()) && await populate(this) 
        return this
    }

    public unpopulate = () => {
        unpopulate(this)
        return this
    }

    public mustValidateSchema = (state = this.state) => {
        const { error } = this.super().schemaSpecs().validate(this.new(state).to().plainUnpopulated())
        if (error) throw new Error(error)
        return this
    }

    static _isArray = (value: any): boolean => Array.isArray(value)
    static _isObject = (value: any): boolean => value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Model) && !(value instanceof Date)
}