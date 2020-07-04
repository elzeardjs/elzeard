import _ from 'lodash'
import Collection from './'
import Model from '../model'

export default class IsManager {
    
    private _c: Collection

    constructor(c: Collection){
        this._c = c
    }

    private _collection = (): Collection => this._c

    public connected = (): boolean => this._collection().option().isConnected() 
    public empty = (): boolean => _.isEmpty(this._collection().state)
    
    public unpopulated = (): boolean => {
        for (const m of this._collection().state){
            if (!m.is().unpopulated())
                return false
        }
        return true
    }
    public plainPopulated = (): boolean => {
        for (const m of this._collection().state){
            if (!m.is().plainPopulated())
                return false
        }
        return true
    }
 
    public populated = (): boolean => {
        for (const m of this._collection().state){
            if (!m.is().populated())
                return false
        }
        return true
    }

    public populatable = (): boolean => {
        for (const m of this._collection().state){
            if (!m.is().populatable())
                return false
        }
        return true
    }

    public nodeModel = (value: any) => value instanceof this._collection().option().nodeModel()
    public nodeCollection = (value: any) => value instanceof this._collection().option().nodeCollection()
}