import _ from 'lodash'

import Errors from '../errors'
import { toPlain, unpopulate, populate } from './utils'
import {  verifyAllModel } from '../verify'

import IsManager from './is'
import OptionManager from './option'
import { Engine } from 'joi-to-sql'
import SQLManager from '../collection/sql'

export interface IAction {
    save(): any
    value: any
}

export default class Model {

    private _prevStateStore: any = {}
    private _state: any = {}
    private _prevState: any = {}
    private _defaultState: any = {}

    private _is: IsManager
    private _option: OptionManager

    constructor(state: any, ...props: any){
        this._is = new IsManager(this)
        this._option = new OptionManager(this, Object.assign({}, props[0], props[1]))

        this._set(Object.assign({}, this.defaultSchemaState(), state))
        this._setDefaultState(this.toPlain())
    }

    private _set = (state: any = this.state): IAction => {
        if (!Model._isObject(state))
            throw Errors.onlyObjectOnModelState()
        this._prevState = this.state
        this._state = state
        return this.action()        
    }

    private _handleStateChanger = (prevStatePlain: any) => {
        const newStatePlain = this.toPlainBack()
        if (JSON.stringify(prevStatePlain) === JSON.stringify(newStatePlain))
            return
        this._setPrevState(prevStatePlain)
        verifyAllModel(this)
    }

    private _setDefaultState = (state: any) => this._defaultState = state
    private _setPrevState = (state: any) => this._prevState = state
    public setPrevStateStore = (state: any) => this._prevStateStore = state

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

    public is = (): IsManager => this._is
    public option = (): OptionManager => this._option

    public action = (value: any = undefined): IAction => {
        return {
            save: this.save,
            value
        }
    }
    
    public save = async () => {
        if (this.option().hasReceivedKids()){
            const prevStatePlain = this.prevState
            const newStatePlain = this.toPlainBack()
            if (JSON.stringify(prevStatePlain) != JSON.stringify(newStatePlain)){
                const { error } = this.validate(newStatePlain)
                if (error) throw new Error(error)
                await this.sql().node(this).update()
            }
        } else {
            throw new Error("Model need to be bound to a collection to perform save. You can pass `kids` method as option.")
        }
    }
    
    public sql = () => this.option().get().sql() as SQLManager

    //Only usable in a Model/State
    public setState = (o = this.state): IAction => {
        if (!Model._isObject(o))
            throw new Error("You can only set an object to setState on a Model")

        const newState = Object.assign({}, this.state, o)
        const { error } = this.validate(this.newNodeModel(newState).toPlainBack())
        if (error) throw new Error(error)

        const prevStatePlain = this.toPlainBack()
        this._set(newState)
        this._handleStateChanger(prevStatePlain)

        return this.action()
    }

    public schema = () => {
        const m = this.option().nodeModel() as any
        return m.schema
    }

    //Return the state to JSONified object.
    //It implies that the state is an array, an object or a Model typed class (model or extended from Model)
    public toPlain = (...args: any): any => toPlain(this, args[0])
    public toPlainBack = () => this.is().backFormat() ? this.toPlain() : this.copy().unpopulate().toPlain()
    public toString = (): string => JSON.stringify(this.toPlain())

    public populate = async () => {
        await populate(this) 
        return this
    }

    public unpopulate = () => {
        unpopulate(this)
        return this
    }

    public defaultSchemaState = () => new Engine(this.schema(), {}).analyze().defaults

    public validate = (value: any) => {
        const ret = this.schema().validate(value)
        return {
            error: ret.error ? ret.error.details[0].message : undefined,
            value: ret.value
        }
    }

    public copy = (): Model => this.newNodeModel(this.state)

    public newNodeModel = (defaultState: any) => new (this._getNodeModel())(defaultState, this.option().kids())  

    private _getNodeModel = (): any => this.option().nodeModel() as Model

    static _isArray = (value: any): boolean => Array.isArray(value)
    static _isObject = (value: any): boolean => value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Model) && !(value instanceof Date)
}
