import Collection from './'
import Model from '../model'

export default (c: Collection) => {
    const isUnpopulated = c.super().is().unpopulated()
    const isPlainPopulated = c.super().is().plainPopulated()
    const primary = c.super().schemaSpecs().getPrimaryKey()
    
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

    //Returns an array of the primary keys
    const arrayPrimary = (): any[] => {
        const ret: any[] = []
        plainUnpopulated().forEach((elem: any) => elem[primary] && ret.push(elem[primary]))
        return ret
    }

    //Filter the result rendered by specifying a group name
    const filterGroup = (groupName: string | void) => {
        filterGroupName = groupName
        isFilterGroup = true
        return JSONStringMethods
    }

    //Returns the collection state into a plain object
    const plain = (): any => {
        const ret: any[] = []
        c.local().state.forEach((m: Model) => ret.push(queryMiddleWare(m.to()).plain()))
        return ret
    }

    //Returns the populated collection state into a plain object
    const plainPopulated = async () => {
        if (isUnpopulated || isPlainPopulated){
            const populated = await c.copy().local().populate()
            return populated.to().plain()
        }
        return plain()
    }

     //Returns the unpopulated collection state into a plain object
    const plainUnpopulated = (): any => isUnpopulated ? plain() : c.copy().local().unpopulate().to().plain()

    //Returns the collection state into string object
    const string = (): string => JSON.stringify(plain())
    //Returns the populated collection state into string object
    const stringPopulated = async () => JSON.stringify(await plainPopulated())
    //Returns the unpopulated collection state into string object
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
