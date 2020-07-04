import _ from 'lodash'
import Model from './'
import { isUnpopulatedFormat, isPopulatable, isPlainPopulated, isPopulatedFormat } from './utils'

export default class IsManager {
    
    private _m: Model

    constructor(m: Model){
        this._m = m
    }

    private _model = (): Model => this._m

    public equal = (m: Model): boolean => this._model().toString() === m.toString()
    public empty = (): boolean => _.isEmpty(this._model().state)
    public unpopulated = (): boolean => isUnpopulatedFormat(this._model())
    public plainPopulated = (): boolean => isPlainPopulated(this._model())
    public populated = (): boolean => isPopulatedFormat(this._model())
    public populatable = (): boolean => isPopulatable(this._model())
}