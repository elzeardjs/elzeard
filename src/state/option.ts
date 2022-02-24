import Model from '../model'
import Collection from '../collection'
import SQLManager from '../sql'

export interface IOptions {
    table?: string
    nodeModel?: Model | null
    nodeCollection?: Collection | null
    sql?: SQLManager | null
    autoConnect?: boolean
}

export default class OptionManager { 

    private _dataType: Collection | Model
    
    private _options: IOptions = {
        table: '',
        nodeModel: null,
        nodeCollection: null,
        sql: null,
        autoConnect: true
    }

    constructor(dataType: Collection | Model, option: IOptions){
        this._dataType = dataType
        this._init(option)
    }

    private _init = (options: any) => this._set(options)

    private dataType = (): Collection | Model => this._dataType
    private _set = (o: Object) => this._options = Object.assign({}, this._options, o)

    //returns the table name
    public table = (): string => this.get().table as string
    public get = (): IOptions => this._options
    //returns the parent Model class if set
    public nodeModel = (): any => this.get().nodeModel as Model
    //returns the parent Collection class if set
    public nodeCollection = (): any => this.get().nodeCollection as Collection
    //returns true if this model is owned by a collection
    public isKidsPassed = () => this.sql() != null
    public isAutoConnected = () => this._options.autoConnect as boolean
    
    public sql = () => this.get().sql

    public kids = () => {
        return {
            table: this.table(),
            sql: this.dataType().sql()
        }
    }
}