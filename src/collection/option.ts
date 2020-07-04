import Model from '../model'
import Collection from './index'

export interface IOptions {
    connected: boolean
    table: string
    nodeModel: Model | null
    nodeCollection: Collection | null
}

export default class OptionManager { 

    private _c: Collection
    
    private _options: IOptions = {
        connected: false,
        table: '',
        nodeModel: null,
        nodeCollection: null
    }

    constructor(c: Collection, option: any){
        this._c = c
        this._init(option)
    }

    private _init = (options: any) => {
        this._set(options)
        return this
    }

    private _collection = (): Collection => this._c
    private _set = (o: Object) => this._options = Object.assign({}, this._options, o)

    public table = (): string => this.get().table
    public isConnected = (): boolean => this.get().connected  
    public get = (): IOptions => this._options
    public nodeModel = (): any => this.get().nodeModel as Model
    public nodeCollection = (): any => this.get().nodeCollection as Collection

    public kids = () => {
        return {
            ...this.get(),
            sql: this._collection().sql,
            
        }
    }
}