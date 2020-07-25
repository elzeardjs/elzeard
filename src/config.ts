import Manager from './manager/'
import { config, Ecosystem } from 'joi-to-sql'
import knex, { MySqlConnectionConfig } from 'knex'

class Config {

    private _isLogEnabled = true
    done = async () => await Manager.init()

    constructor(){
        config.setEcoystem(new Ecosystem())
    }

    setHistoryDirPath = (historyFolderPath: string) => config.set({historyDir: historyFolderPath})

    ecosystem = () => config.ecosystem() as Ecosystem
    mysqlConnexion = () => config.mysqlConnexion() as knex<any, unknown[]>
    
    setMySQLConfig = (conf: MySqlConnectionConfig) => config.set({mysqlConfig: conf})
    setCriticalCode = (code: string) => config.set({criticalCode: code})
    
    enableCriticalConfirmation = () => config.enableCriticalConfirmation()
    disableCriticalConfirmation = () => config.disableCriticalConfirmation()

    isLogEnabled = () => this._isLogEnabled
    enableLog = () => {
        this._isLogEnabled = true
        config.enableLog()
    }
    disableLog = () => {
        this._isLogEnabled = false
        config.disableLog()
    }
}

export default new Config()