import Model from '../model'
import Collection from '../collection'
import SQLManager from '../sql'

export interface IOptions {
    table: string
    nodeModel: Model | null
    nodeCollection: Collection | null
    sql: SQLManager | null
    autoConnect: boolean
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

    constructor(dataType: Collection | Model, option: any){
        this._dataType = dataType
        this._init(option)
    }

    private _init = (options: any) => this._set(options)

    private dataType = (): Collection | Model => this._dataType
    private _set = (o: Object) => this._options = Object.assign({}, this._options, o)

    public table = (): string => this.get().table
    public get = (): IOptions => this._options
    public nodeModel = (): any => this.get().nodeModel as Model
    public nodeCollection = (): any => this.get().nodeCollection as Collection
    public isKidsPassed = () => this.sql() != null
    public isAutoConnected = () => this._options.autoConnect

    
    public sql = () => this.get().sql

    public kids = () => {
        return {
            table: this.table(),
            sql: this.dataType().sql()
        }
    }
}