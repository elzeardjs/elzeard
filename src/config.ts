import Manager from './manager/'
import { config, Ecosystem } from 'joixsql'
import knex, { MySqlConnectionConfig } from 'knex'

class Config {

    private _isLogEnabled = true
    done = async () => await Manager.init()

    constructor(){
        config.setEcosystem(new Ecosystem())
    }

    setHistoryDirPath = (historyFolderPath: string) => config.set({historyDir: historyFolderPath})

    /* Ecosystem is a class used by JOIxSQL that manages tables creation and migration */
    ecosystem = () => config.ecosystem() as Ecosystem
    mysqlConnexion = (): knex<any, unknown[]> => config.mysqlConnexion() as any
    
    setMySQLConfig = (conf: MySqlConnectionConfig) => config.set({mysqlConfig: conf})
    setCriticalCode = (code: string) => config.set({criticalCode: code})
    
    enableCriticalConfirmation = () => config.enableCriticalConfirmation()
    disableCriticalConfirmation = () => config.disableCriticalConfirmation()

    isRemovingMigrationOnErrorEnabled = () => config.isRemovingMigrationOnErrorEnabled()
    enableMigrationRemovingOnError = () => config.enableMigrationRemovingOnError()
    disableMigrationRemovingOnError = () => config.disableMigrationRemovingOnError()

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