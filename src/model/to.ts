import Model from './'
import { toPlain } from './utils'

export default (m: Model) => {
    const isUnpopulated = m.is().unpopulated()

    const plain = (): any => toPlain(m)
    const plainUnpopulated = () => isUnpopulated ? plain() : m.copy().unpopulate().to().plain()
    const plainPopulated = async () => (await m.copy().populate()).to().plain()

    const string = () => JSON.stringify(plain())
    const stringUnpopulated = async () => JSON.stringify(plainUnpopulated())
    const stringPopulated = async () => JSON.stringify(await plainPopulated())

    return { 
        plain, 
        plainUnpopulated, 
        plainPopulated,

        string,
        stringUnpopulated,
        stringPopulated
    }
}