import Model from './'
import { toPlain, GROUP_PLAIN_OPTION } from './utils'



export default (m: Model) => {
    const mRef = m.copy()
    const isUnpopulated = mRef.is().unpopulated()
    let plainOPT: any = undefined

    const plain = (): any => toPlain(mRef, plainOPT)
    const plainUnpopulated = () => isUnpopulated ? plain() : mRef.unpopulate().to().plain()
    const plainPopulated = async () => (await mRef.populate()).to().plain()

    const string = () => JSON.stringify(plain())
    const stringUnpopulated = async () => JSON.stringify(plainUnpopulated())
    const stringPopulated = async () => JSON.stringify(await plainPopulated())

    const filterGroup = (groupName: string | void) => {
        plainOPT = GROUP_PLAIN_OPTION
        const groups = mRef.schema().getGroups()
        if (groupName && groups[groupName])
            mRef.fillGroup(groups[groupName])
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