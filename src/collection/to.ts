import Collection from './'
import Model from '../model'

export default (c: Collection) => {
    const isUnpopulated = c.is().unpopulated()
    const isPlainPopulated = c.is().plainPopulated()
    const primary = c.schema().getPrimaryKey()
    
    let isFilterGroup = false
    let filterGroupName: any = undefined

    const queryMiddleWare = (to: any) => {
        if (isFilterGroup)
            return to.filterGroup(filterGroupName)
        return to
    }

    /*
        Transform an array of object into an array of instancied Model
        Exemple => 
        [{content: '123', id: 'abc'}, {content: '456', id: 'def'}]
        to
        [new Model(content: '123', id: 'abc'}), new Model({content: '456', id: 'def'})]
        the class used to instance the objects is the one passed in parameters as nodeModel in the constructor.

    */
    const listClass = (elem: any[] = []): Model[] => {
        let ret: Model[] = []
        elem.forEach((elem) => ret.push(c.newNode(elem)))
        return ret
    }

    const arrayPrimary = (): any[] => {
        const ret: any[] = []
        plainUnpopulated().forEach((elem: any) => elem[primary] && ret.push(elem[primary]))
        return ret
    }

    const filterGroup = (groupName: string | void) => {
        filterGroupName = groupName
        isFilterGroup = true
        return JSONStringMethods
    }

    const plain = (): any => {
        const ret: any[] = []
        c.state.forEach((m: Model) => ret.push(queryMiddleWare(m.to()).plain()))
        return ret
    }

    const plainPopulated = async () => {
        if (isUnpopulated || isPlainPopulated)
            return (await c.copy().populate()).to().plain()
        return plain()
    }

    const plainUnpopulated = (): any => isUnpopulated ? plain() : c.copy().unpopulate().to().plain()

    const string = (): string => JSON.stringify(plain())
    const stringPopulated = async () => JSON.stringify(await plainPopulated())
    const stringUnpopulated = () => JSON.stringify(plainUnpopulated())

    
    const JSONStringMethods = {
        plain, 
        plainPopulated,
        plainUnpopulated, 

        string,
        stringPopulated,
        stringUnpopulated
    }



    return Object.assign({}, { 
        listClass, 
        arrayPrimary, 
        filterGroup
    }, JSONStringMethods)
}
