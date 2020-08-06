import Collection from '../collection'
import Model from '../model'
import isEmpty from 'lodash/isEmpty'
import { isUnpopulatedFormat, isPopulatable, isPlainPopulated, isPopulatedFormat } from '../model/utils'

export interface IIs {
    empty(): boolean
    autoConnected(): boolean
    sqlAccess(): boolean,
    kidsPassed(): boolean,
    unpopulated(): boolean
    nodeModel(value: any): boolean
    nodeCollection(value: any): boolean
    sqlAccess(): boolean
    unpopulated(): boolean
    populated(): boolean
    plainPopulated(): boolean
    populatable(): boolean
}


export default (dataType: Collection | Model): IIs => {

    const empty = (): boolean => isEmpty(dataType instanceof Model ? dataType.state : dataType.local().state)
    const autoConnected = (): boolean => dataType.super().option().isAutoConnected()

    const sqlAccess = (): boolean => !!dataType.sql()
    const kidsPassed = () => dataType.super().option().isKidsPassed()
    
    const unpopulated = (): boolean => {
        if (dataType instanceof Model)
            return isUnpopulatedFormat(dataType as Model)
        for (const m of dataType.local().state){
            if (!isUnpopulatedFormat(m))
                return false
        }
        return true
    }

    const populated = (): boolean => {
        if (dataType instanceof Model)
            return isPopulatedFormat(dataType as Model)
        for (const m of dataType.local().state){
            if (!isPopulatedFormat(m))
                return false
        }
        return true
    }

    const plainPopulated = (): boolean => {
        if (dataType instanceof Model)
            return isPlainPopulated(dataType as Model)
        for (const m of dataType.local().state){
            if (!isPlainPopulated(m))
                return false
        }
        return true
    }

    const populatable = (): boolean => {
        if (dataType instanceof Model)
            return isPopulatable(dataType as Model)
        for (const m of dataType.local().state){
            if (!isPopulatable(m))
                return false
        }
        return true
    }

    const nodeModel = (value: any) => value instanceof dataType.super().option().nodeModel()
    const nodeCollection = (value: any) => value instanceof dataType.super().option().nodeCollection()

    return {
        autoConnected,
        empty,
        kidsPassed,
        nodeCollection,
        nodeModel,
        sqlAccess,
        unpopulated,
        populated,
        plainPopulated,
        populatable,
    }
}