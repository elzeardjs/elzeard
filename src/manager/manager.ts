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
            try {
                this.collections().verifyAll()
                await this.collections().createAllTable()
                this.setInitialized()
            } catch (e){
                console.log(e)
                throw new Error(e)
            }
        }
    }

    public collections = () => this._collectionsManager
 
    public prepareCollection = (c: Collection) => {
        this.collections().add(c)
    }

    public isInitialized = () => this._hasBeenInitialized
    public setInitialized = () => this._hasBeenInitialized = true
}