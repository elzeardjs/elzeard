import Model from './'
import { toPlain } from './utils'

export default (m: Model) => {
    const mRef = m.copy()
    const isUnpopulated = mRef.super().is().unpopulated()

    //Returns the model state into a plain object
    const plain = (): any => toPlain(mRef)
    //Returns the unpopulated model state into a plain object
    const plainUnpopulated = () => isUnpopulated ? plain() : mRef.unpopulate().to().plain()
    //Returns the populated model state into a plain object
    const plainPopulated = async () => (await mRef.populate()).to().plain()

    
    //Returns the model state into string object
    const string = () => JSON.stringify(plain())
    //Returns the unpopulated model state into a string object
    const stringUnpopulated = async () => JSON.stringify(plainUnpopulated())
    //Returns the populated model state into a string object
    const stringPopulated = async () => JSON.stringify(await plainPopulated())

    //Filter the result rendered by specifying a group name
    const filterGroup = (groupName: string | void) => {
        const groups = mRef.super().schemaSpecs().getGroups()
        if (groupName && groups[groupName]){
            mRef.super().fillGroup(groups[groupName])
        }
        return ret
    }

    const ret = {
        plain, 
        plainUnpopulated, 
        plainPopulated,

        string,
        stringUnpopulated,
        stringPopulated
    }

    return Object.assign({}, ret, {filterGroup})
}