import  { config } from '../../../index'
const main = async () => {

    config.setMySQLConfig({
        host: '',
        user: 'root',
        password: '',
        database: ''
    })
    config.setHistoryDirPath('./history')
    require('./general')
}

main()