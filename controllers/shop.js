const Product = require('../models/product')


const Cart = require('../models/cart');
const sequelize = require('../util/database');
const OrderItem = require('../models/orderItem');
const items_per_page=1;
exports.getProducts = (req, res, next) => {
  Product.findAll()
  .then(products=>{
    res.json({products,success:true})
    // res.render('shop/product-list', {
    //   prods: products,//rows is name given to database and fielddata is data inside
    //   pageTitle: 'All Products',
    //   path: '/products'
    // });
    const page=+req.query.page ||1
    let totalItems;
    Product.count()
    .then(numProducts=>{
      totalItems=numProducts;
      return Product.findAll()
        .skip((page-1)*items_per_page)
        .limit(items_per_page)
    }).catch(err=>console.log(err))
    .then(products=>{
      const hasNextPage=items_per_page*page<totalItems;
      const hasPreviousPage=page>1;
      const nextPage=page+1;
      const previousPage=page-1;
      const lastPage=Math.ceil(totalItems/items_per_page)
      const obj={
        totalItems:totalItems,
        currentPage:page,
        hasNexPage:hasNextPage,
        hasPreviousPage:hasPreviousPage,
        nextPage:nextPage,
        previousPage:previousPage,
        lastPage:lastPage
      }
      res.json({products,success:true,obj})
    }).catch(err => {
      console.log(err);
    });
      })
  .catch(err=>console.log(err));
};
exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findAll({where:{id:prodId}})
  .then(products=>{
    res.render('shop/product-detail', {
      product: products[0],
      pageTitle: products[0].title,
      path: '/products'
    })
  })
  .catch(err=>console.log(err))
  // Product.findById(prodId)
  // .then((product)=>{
    
  // }).catch(err=>console.log(err));
};
exports.getIndex = (req, res, next) => {
  Product.findAll()
  
  .then(products=>{
    res.render('shop/index', {
      prods: products,//rows is name given to database and fielddata is data inside
      pageTitle: 'Shop',
      path: '/',
      
    });
  })
  .catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  })
};

exports.getCart = (req, res, next) => {
  req.user.getCart()
  .then(cart=>{
    return cart
    .getProducts()
    .then(products=>{
        res.status(200).json({success:true,products:products})
      // res.render('shop/cart', {
      //   path: '/cart',
      //   pageTitle: 'Your Cart',
      //   products: products
      //});
    })
    //.catch(err=>console.log(err))
    .catch(err=>{res.status(500).json({sucess:false, message:err})})
  })
  .catch(err=>console.log(err))
  
};

exports.postCart = (req, res, next) => {
 
  const prodId = req.body.productId;
  let fetchedCart;
  let newQuantity=1;
  req.user
  .getCart()
  .then(cart=>{
    fetchedCart=cart;
    return cart.getProducts({where : {id : prodId}})
  })
  .then(products=>{
    let product;
    if(products.length>0){
      product=products[0];
    }
   
    if(product){
      const oldQuantity = product.cartItem.quantity;
      newQuantity = oldQuantity +1;
      return product
    }
    return Product.findByPk(prodId)
    .then(product=>{
      return fetchedCart.addProduct(product, {
        through : {quantity : newQuantity}
      })
    })
    .then(product=>{
      return fetchedCart.addProduct(product, 
        {through :{quantity : newQuantity}
      });      //addproduct is method added by sequelize for manytomany relations
    })
    .catch(err=>console.log(err));
  })
  .then(()=>{
    //res.redirect('/cart');
    res.status(200).json({success:true, message:'Successfully added the product'})//connecting frontend in task11
  })
  .catch(err=>
    //console.log(err))
    res.status(500).json({success:false, message:'Error occured'})
  )};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user.getCart()
  .then(cart=>{
    return cart.getProducts({where : {id:prodId}})
  }).then(products=>{
    const product = products[0];
    return product.cartItem.destroy()
  })
  .then(result=>{
    res.redirect('/cart');
  })
  .catch(err=>console.log(err));
  // Product.findById(prodId, product => {
  //   Cart.deleteProduct(prodId, product.price);
  //   res.redirect('/cart');
  // });
};
exports.postOrder= async(req,res,next)=>{
  try{
    const cart = await req.user.getCart()
    const products= await req.user.getProducts()
    const order= await req.user.createOrder()
    await order.addProduct(products.map(product=>{
      product.orderItem={
        quaantity:product.cartItem.quantity
      }
      return product
    }))
    await cart.setProducts(null);
    res.json({message:'order placed', orderId:order.id})
  }catch(err){
    res.status(500).json({err:err})

  }
}

exports.getOrders = (req, res, next) => {
  res.render('shop/orders', {
    path: '/orders',
    pageTitle: 'Your Orders'
  });
};
exports.getOrders=async(req,res,next)=>{
  try{
    const data=[]
    const orderArray=await req.user.getOrders();
    await Promise.all(orderArray.map(async(eachOrder)=>{
      const eachOrderDetail={}
      eachOrderDetail.orderId=eachOrder.id;
      const ord= await Order.findByPk(eachOrder.id)
      const orderedProducts=await ord.getProducts()
      const orderedProductsFiltered=[];
      orderedProducts.map(item=>{
        orderedProductsFiltered.push(item.dataValues)
      })
      eachOrderDetail.products=orderedProductsFiltered;
      data.push(eachOrderDetail)

    }))
    res.status(201).json({data})
  }catch(err){
    res.status(500).json({err:err})
  }
}

exports.getCheckout = (req, res, next) => {
  res.render('shop/checkout', {
    path: '/checkout',
    pageTitle: 'Checkout'
  });
};
