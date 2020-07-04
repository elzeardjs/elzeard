import _ from 'lodash'

import Errors from '../errors'
import { toPlain, unpopulate, populate } from './utils'
import {  verifyAllModel } from '../verify'
import SchemaManager from '../schema'

import to from './to'
import IsManager from './is'
import OptionManager from './option'
import SQLManager from '../sql'

export interface IAction {
    save(): Promise<any>
    value: any
}

export default class Model {

    private _prevStateStore: any = {}
    private _state: any = {}
    private _prevState: any = {}

    private _is: IsManager
    private _option: OptionManager

    public get prevStateStore(){ return this._prevStateStore }
    public get state(){ return this._state }
    public get prevState(){ return this._prevState }

    public schema = () => SchemaManager(this)
    public is = (): IsManager => this._is
    public option = (): OptionManager => this._option
    public sql = () => this.option().get().sql() as SQLManager
    public to = () => to(this)

    public action = (value: any = undefined): IAction => {
        return { save: this.save, value }
    }

    public fillPrevStateStore = (prevStateStore = this.to().plainUnpopulated()) => {
        this._prevStateStore = prevStateStore
        return this
    }

    public fillPrevState = (prevState = this.to().plainUnpopulated()) => {
        this._prevState = prevState
        return this
    }

    constructor(state: any, ...props: any){
        this._is = new IsManager(this)
        this._option = new OptionManager(this, Object.assign({}, props[0], props[1]))

        this._set(Object.assign({}, this.schema().defaults(), this.schema().cleanNonPresentValues(state)))
        this.is().plainPopulated() && this.populate()
    }

    private _set = (state: any = this.state): IAction => {
        if (!Model._isObject(state))
            throw Errors.onlyObjectOnModelState()
        this._prevState = this.state
        this._state = state
        return this.action()        
    }

    private _handleStateChanger = (prevStatePlain: any) => {
        const newStatePlain = this.to().plainUnpopulated()
        if (JSON.stringify(prevStatePlain) === JSON.stringify(newStatePlain))
            return
        this.fillPrevState(prevStatePlain)
        verifyAllModel(this)
    }

    public copy = (): Model => this.new(this.state).fillPrevStateStore(this.prevStateStore)

    public new = (defaultState: any) => new (this.option().nodeModel())(defaultState, this.option().kids())

    public save = async () => {
        if (this.option().hasReceivedKids()){
            const prevStatePlain = this.prevState
            const newStatePlain = this.to().plainUnpopulated()
            if (JSON.stringify(prevStatePlain) != JSON.stringify(newStatePlain)){
                const { error } = this.schema().validate(newStatePlain)
                if (error) throw new Error(error)
                await this.sql().node(this).update()
            }
        } else {
            throw new Error("Model need to be bound to a collection to perform save. You can pass `kids` method as option.")
        }
    }

    //Only usable in a Model/State
    public setState = (o = this.state): IAction => {
        if (!Model._isObject(o))
            throw new Error("You can only set an object to setState on a Model")

        const newState = Object.assign({}, this.state, o)
        try {
            this.mustValidateSchema(newState)
            const prevStatePlain = this.to().plainUnpopulated()
            this._set(newState)
            this._handleStateChanger(prevStatePlain)    
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
    }

    static _isArray = (value: any): boolean => Array.isArray(value)
    static _isObject = (value: any): boolean => value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Model) && !(value instanceof Date)
}
