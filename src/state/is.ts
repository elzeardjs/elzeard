import Collection from '../collection'
import Model from '../model'
import _ from 'lodash'
import { isUnpopulatedFormat, isPopulatable, isPlainPopulated, isPopulatedFormat } from '../model/utils'

export default (dataType: Collection | Model) => {

    const isModel = () => dataType instanceof Model

    const empty = (): boolean => _.isEmpty(dataType.state)
    const sqlAccess = (): boolean => !!dataType.sql()
    const kidsPassed = () => dataType.option().isKidsPassed()
    
    const unpopulated = (): boolean => {
        if (isModel())
            return isUnpopulatedFormat(dataType as Model)
        for (const m of dataType.state){
            if (!isUnpopulatedFormat(m))
                return false
        }
        return true
    }

    const populated = (): boolean => {
        if (isModel())
            return isPopulatedFormat(dataType as Model)
        for (const m of dataType.state){
            if (!isPopulatedFormat(m))
                return false
        }
        return true
    }

    const plainPopulated = (): boolean => {
        if (isModel())
            return isPlainPopulated(dataType as Model)
        for (const m of dataType.state){
            if (!isPlainPopulated(m))
                return false
        }
        return true
    }

    const populatable = (): boolean => {
        if (isModel())
            return isPopulatable(dataType as Model)
        for (const m of dataType.state){
            if (!isPopulatable(m))
                return false
        }
        return true
    }

    const nodeModel = (value: any) => value instanceof dataType.option().nodeModel()
    const nodeCollection = (value: any) => value instanceof dataType.option().nodeCollection()

    return {
        empty,
        sqlAccess,
        kidsPassed,
        unpopulated,
        populated,
        plainPopulated,
        populatable,
        nodeModel,
        nodeCollection
    }
}