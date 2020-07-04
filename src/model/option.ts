import Model from './'
import SQLManager from '../sql'

export interface IOptions {
    nodeModel: Model | null
    sql(): SQLManager | void;
}

export default class OptionManager { 

    private _m: Model
    private _options: IOptions = {
        nodeModel: null,
        sql: () => undefined,
    }

    constructor(m: Model, option: any){
        this._m = m
        this._init(option)
    }

    private _init = (options: any) => {
        this._set(options)
        return this
    }

    private _model = (): Model => this._m
    private _set = (o: Object) => this._options = Object.assign({}, this._options, o)

    public get = (): IOptions => this._options
    public nodeModel = (): any => this.get().nodeModel as Model
    public hasReceivedKids = () => this.get().sql() != undefined

  /*    kids is setting the options for any nested Model/Collection.
        It makes the nested one using the same connected action than its parent.
        Example: 
        We assume that we have a connected Model called `User` with a state Object that contains 
        a non-connected Model called `Device`.

        Here is the state
        {
            first_name: ''
            device: new Device({id: 'iPhone X'})
        }

        If we want to call some Device's method and save the state to refresh the components, it won't work by default.
        Because Device is not connected.

        so we are copying the reference of the key methods of User into the options that we are going to pass
        to device after the instance.
        this way:

        {
            first_name: ''
            device: new Device({id: 'iPhone X'}, this.options().kids())
        }
    */
    public kids = () => {
        return {
            ...this.get(),
            sql: this._model().sql
        }
    }
}