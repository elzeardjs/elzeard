import { getChanges } from './changes'
import { 
    renderTemplateAdded,
    renderTemplateDeleted,
    renderTemplateUpdated,
    renderTemplateRenamed
} from './templates'

export default class Manager {
    
    private _oldTable: string
    private _newTable: string

    constructor(oldTable: string, newTable: string){
        this._oldTable = oldTable
        this._newTable = newTable
    }

    oldTable = () => this._oldTable
    newTable = () => this._newTable

    getMigration = () => {
        const { added, deleted, renamed, updated } = getChanges(this.oldTable(), this.newTable())
        const ret = renderTemplateDeleted(deleted, this.oldTable())

        const renamedTemplate = renderTemplateRenamed(renamed)
        const addedTemplate = renderTemplateAdded(added, this.newTable())
        const updatedTemplate = renderTemplateUpdated(updated, this.oldTable(), this.newTable())

        ret.up += renamedTemplate.up + addedTemplate.up + updatedTemplate.up
        ret.down += renamedTemplate.down + addedTemplate.down + updatedTemplate.down
        return ret
    }
}