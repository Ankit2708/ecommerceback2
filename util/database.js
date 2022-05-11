const Sequelize=require('sequelize');//class or constructor function
const dotenv= require('dotenv')
const sequelize=new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD,{
    dialect : 'mysql',
    host : process.env.DB_HOST
})
module.exports = sequelize;//fully configured sequelize pool environment