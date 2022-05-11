const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
var cors=require('cors')

const errorController = require('./controllers/error');
const dotenv=require('dotenv')
dotenv.config()
const sequelize = require('./util/database')

const app = express();

app.use(cors());

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

const Product = require('./models/product');

const User= require('./models/user');
const Cart = require('./models/cart');
const CartItem = require('./models/cart-item');
const Order=require('./models/order')
const OrderItem = require('./models/orderItem')

//app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, 'public')));

app.use((req,res,next)=>{//middleware executed after app.listen
    User.findByPk(1)
    .then(user=>{
        req.user=user;
        next();
    })
    .catch(err=>console.log(err))
})

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

Product.belongsTo(User, {constraints : true, onDelete : 'Cascade'});
User.hasMany(Product);
User.hasOne(Cart);
Cart.belongsTo(User);
Cart.belongsToMany(Product, {through : CartItem});
Product.belongsToMany(Cart, {through : CartItem});

User.hasMany(Order)
Order.belongsTo(User,{constraints:true, onDelete:'Cascade'})
Order.belongsToMany(Product,{through:OrderItem})
Product.belongsToMany(Order,{through:OrderItem})
sequelize
//.sync({force : true})
.sync()
.then(result=>{
    return User.findByPk(1)
    //console.log(result);
})
.then(user=>{
    if(!user){
        return User.create({name : 'Ankit',email : 'abc@gmail.com'})
    }
    return user;
})
.then(user=>{
    //console.log(user);
    return user.createCart();//cart is created
    
})
.then(cart=>{
    app.listen(3000);
})
.catch(err=>console.log(err));


