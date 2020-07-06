import Manager from './manager'
import { MySqlConnectionConfig } from 'knex'

class Config {

    private _isDev = true
    private _logger = false
    private _mysqlConfig: MySqlConnectionConfig
    
    constructor(){
        this._mysqlConfig = {}
    }

    done = async () => await Manager.init()

    isDevMode = () => this._isDev
    setAsProduction = () => this._isDev = false

    //Todo: logger feature
    isLoggerEnabled = () => this._logger
    enableLogger = () => this._logger = true

    mysqlConfig = () => this._mysqlConfig
    setMySQLConfig = (config: MySqlConnectionConfig) => this._mysqlConfig = config
}

export default new Config()