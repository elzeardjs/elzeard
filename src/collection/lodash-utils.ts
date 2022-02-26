import Model from '../model'
import isFunction from 'lodash/isFunction'
import isPlainObject from 'lodash/isPlainObject'
import isObjectLike from 'lodash/isObjectLike'
import isArray from 'lodash/isArray'
import Collection from './index'

export interface IGrouped {
    [propName: string]: Collection
}

export type TOrder = 'desc' | 'asc'

export type TObjectStringAny = { [char: string]: any }
export type TPredicateFn = (model: any, index: number) => any
export type TPredicatePickNode = string | TObjectStringAny | [string, any] | TPredicateFn 
export type TPredicatePickKey = string | TPredicateFn

export type TPredicateSort = string | string[] |  TPredicateFn | TPredicateFn[]
export type TOrderSort = TOrder | TOrder[]

export const treatPredicateSortNode = (predicate: TPredicateSort) => {

    const thError = () => new Error(`Each element of an array of predicate have all to be the same type, here string or callback function.`)

    if (typeof predicate === 'string')
        return (m: Model) => m.state[predicate]
    
    else if (isFunction(predicate))
        return predicate

    else if (isArray(predicate) && predicate.length > 0 && typeof predicate[0] === 'string'){
        const ret: TPredicateFn[] = []
        for (const p of predicate){
            if (typeof p !== 'string')
                throw thError()
            ret.push((m: Model) => m.state[p as string])
        }
        return ret
    }
    
    else if (isArray(predicate) && predicate.length > 0 && typeof predicate[0] === 'function'){
        for (const p of predicate){
            if (typeof p !== 'function')
                throw thError()
        }
        return predicate
    }

    throw new Error(`wrong predicate.`)
}

export const treatPredicatePickNode = (predicate: TPredicatePickNode): TPredicateFn => {
    if (isFunction(predicate))
        return predicate
    
    else if (isObjectLike(predicate) && isPlainObject(predicate)){
        return (m: Model) => {
            const keys = Object.keys(predicate)
            let count = 0
            for (const key of keys)
                m.state[key] === (predicate as TObjectStringAny)[key] && count++
            return count === keys.length
        }
    } 
    
    else if (isArray(predicate))
        return (m: Model) => m.state[predicate[0] as string] === predicate[1]
    
    else if (typeof predicate === 'string')
        return (m: Model) => m.state[predicate]

    throw new Error(`Predicate value error, can be one of:
- string
- Object {[string]: any}
- Array[2] -> [key: string, value: any]
- Function ((model: Model, index: number) => boolean)`)
}

export const collectionPredictor = (predicate: any, c: Collection) => {
    let countFn = 0
    if (isArray(predicate)){
        for (let o of predicate)
            isFunction(o) && countFn++
        if (countFn != 0 && countFn != predicate.length)
            throw new Error(`If an array of predicate contains at least 1 function, all the other ones must be a function.`)
        return countFn == 0 ? c.local().to().plain() : c.local().state
    }
    return isFunction(predicate) ? c.local().state : c.local().to().plain()
}