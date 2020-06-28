import _ from 'lodash'
import Collection from './'

export default class IsManager {
    
    private _c: Collection

    constructor(c: Collection){
        this._c = c
    }

    private _collection = (): Collection => this._c

    public connected = (): boolean => this._collection().option().isConnected() 
    public empty = (): boolean => _.isEmpty(this._collection().state)
}