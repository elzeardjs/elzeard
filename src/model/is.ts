import _ from 'lodash'
import Model from './'
import { isBackFormat, isFrontable } from './utils'

export default class IsManager {
    
    private _m: Model

    constructor(m: Model){
        this._m = m
    }

    private _model = (): Model => this._m

    public equal = (m: Model): boolean => this._model().toString() === m.toString()
    public empty = (): boolean => _.isEmpty(this._model().state)
    public backFormat = (): boolean => isBackFormat(this._model())
    public frontable = (): boolean => isFrontable(this._model())
}