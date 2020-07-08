import _ from 'lodash'

import Errors from '../errors'
import { unpopulate, populate } from './utils'
import {  verifyAllModel } from '../verify'
import SchemaManager from '../state/schema'

import to from './to'
import IsManager from '../state/is'
import OptionManager from '../state/option'
import SQLManager from '../sql'
import errors from '../errors'

export interface IAction {
    saveToDB(): Promise<any>
    value: any
}

export default class Model {

    private _prevStateStore: any = {}
    private _state: any = {}
    private _group: string[] = []

    private _option: OptionManager
    
    public get group(){ return this._group.slice() }
    public get prevStateStore(){ return this._prevStateStore }
    public get state(){ return this._state }

    public schema = () => SchemaManager(this)
    public is = () => IsManager(this)
    public option = (): OptionManager => this._option
    public sql = () => this.option().get().sql as SQLManager
    public to = () => to(this)

    public action = (value: any = undefined): IAction => {
        return { saveToDB: this.saveToDB, value }
    }

    public fillGroup = (group: string[]) => {
        this._group = group
        return this
    }

    public fillPrevStateStore = (prevStateStore = this.to().plainUnpopulated()) => {
        this._prevStateStore = prevStateStore
        return this
    }

    constructor(state: any, ...props: any){
        this._option = new OptionManager(this, Object.assign({}, props[0], props[1]))

        if (!this.option().nodeModel().schema)
            throw errors.noSchema(this)
        
        this._set(Object.assign({}, this.schema().defaults(), this.schema().cleanNonPresentValues(state)))
        this.is().plainPopulated() && this.populate()
    }

    private _set = (state: any = this.state): IAction => {
        if (!Model._isObject(state))
            throw Errors.onlyObjectOnModelState()
        this._state = state
        return this.action()        
    }

    public copy = (): Model => this.new(this.state).fillPrevStateStore(this.prevStateStore)

    public new = (defaultState: any) => new (this.option().nodeModel())(defaultState, this.option().kids())

    public saveToDB = async () => {
        if (this.option().isKidsPassed()){
            const prevStatePlain = this.prevStateStore
            const newStatePlain = this.to().plainUnpopulated()
            if (!_.isEqual(prevStatePlain, newStatePlain)){
                const { error } = this.schema().validate(newStatePlain)
                if (error) throw new Error(error)
                await this.sql().node(this).update()
                this.fillPrevStateStore()
            }
        } else 
            throw errors.noCollectionBinding(this)
    }

    //Only usable in a Model/State
    public setState = (o = this.state): IAction => {
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
        return this.action()
    }

    public populate = async () => {
        (this.is().unpopulated() || this.is().plainPopulated()) && await populate(this) 
        return this
    }

    public unpopulate = () => {
        unpopulate(this)
        return this
    }

    mustValidateSchema = (state = this.state) => {
        const { error } = this.schema().validate(this.new(state).to().plainUnpopulated())
        if (error) throw new Error(error)
        return this
    }

    static _isArray = (value: any): boolean => Array.isArray(value)
    static _isObject = (value: any): boolean => value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Model) && !(value instanceof Date)
}