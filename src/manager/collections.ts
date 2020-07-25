import Manager from './manager'
import Collection from '../collection'
import _ from 'lodash'
import { MigrationManager } from 'joi-to-sql'
import { createTables, dropAllTables } from '../knex-tools'
import config from '../config'
import { Color } from '../utils'

export default class CollectionsManager {

    private _m: Manager
    private _collections: any = {}

    constructor(m: Manager){
        this._m = m
    }

    public count = () => _.size(this.get())

    public get = () => this._collections
    public manager = () => this._m
    public reset = () => this._collections = {}
    public node = (key: string): Collection => this.get()[key]

    public add = (c: Collection) => {
        this._collections[c.super().option().table()] = c
        config.ecosystem().add({schema: (c.super().option().nodeModel() as any).schema, tableName: c.super().option().table()})
    }
    public exist = (key: string) => this.get()[key]

    public forEach = (callback: (c: Collection, key: string) => any) => {
        for (let key in this.get())
            callback(this.get()[key], key)
    }

    public dropAllTable = () => dropAllTables()
    public createAllTable = async () => {
        const startTime = new Date().getTime()

        const log = (...v: any) => config.isLogEnabled() && console.log(...v)

        const getMessage = () => {
            const olds: string[] = []
            const news: string[] = []

            this.forEach((c: Collection) => {
                const tName = c.super().option().table()
                MigrationManager.schema().lastFilename(tName) == null ? news.push(tName) : olds.push(tName)
            })
            let msg = ''
            if (news.length > 0){
                msg += `${Color.Reset}${Color.FgGreen}+++${Color.Reset} We detected ${Color.FgWhite}MySQL table(s) add. ${Color.Reset}${Color.FgGreen}+++${Color.Reset}\n\n\n`
                if (olds.length > 0) msg += `${Color.FgWhite}Existing${Color.Reset} table${olds.length > 1 ? 's' : ''}:\n\n`
                for (const old of olds)
                    msg += `    - ${Color.FgWhite}${old}${Color.Reset}\n`
                msg += `${olds.length > 0 ? `\n\n` : ``}${Color.FgGreen}New${Color.Reset} table${news.length > 1 ? 's' : ''}:\n\n`
                for (const n of news)
                    msg += `    - ${Color.FgGreen}${n}${Color.Reset}\n`
                msg += '\n\n'
            }
            return {news, msg}
        }

        try {
            const {news, msg} = getMessage()
            if (news.length > 0){
                log('\n-------------------------------------------\n')
                log(msg)
                await createTables()
                for (const n of news){
                    const ecoModel = this.node(n).super().schemaSpecs().ecosystemModel()
                    MigrationManager.schema().create(ecoModel)
                }
                log(`Table${news.length > 1 ? 's' : ''} creation ${Color.FgGreen}succeed${Color.Reset} in ${ ((new Date().getTime() - startTime) / 1000).toFixed(3)} seconds. ✅`)
                log('\n-------------------------------------------\n')
            }
        } catch (e){
            throw new Error(e)
        }
    }

    public verifyAll = () => {
        this.forEach((c: Collection) => {
            config.ecosystem().verify(c.super().schemaSpecs().ecosystemModel()).all()
        })
    }
}