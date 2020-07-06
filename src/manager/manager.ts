import Collection from "../collection"
import CollectionsManager from './collections'

export default class Manager {
    
    private _hasBeenInitialized: boolean = false
    private _collectionsManager: CollectionsManager

    constructor(){
        this._collectionsManager = new CollectionsManager(this)
    }

    public reset = () => {
        this._hasBeenInitialized = false
    }

    public init = async () => {
        if (!this.isInitialized()){
            this.setInitialized()
            await this.collections().createAllTable()
        }
    }

    public collections = () => this._collectionsManager
 
    public prepareCollection = (c: Collection) => this.collections().add(c)

    public isInitialized = () => this._hasBeenInitialized
    public setInitialized = () => this._hasBeenInitialized = true
}