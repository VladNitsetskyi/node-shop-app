# node-shop-app
Shop application build with Node JS and MongoDB. Used  MVC pattern,EJs as a temp engine for server-side rendered pages.

You may check this app online deployed on Heroku following this link - https://mynodeshop.herokuapp.com/

App functionality:
- login system
- product add, delete, edit
- cart
- checkout
- credit card payment system implemented with help of Stripe.

Brief app functionality description:
- login,logout and reset password with conf email send on email used when signed up. Login systems build with JWT which sends a token each time user visit a page to confirm the user.
- user can add,edit and delete products (when logged in ). Added products are linked to the user which done that, so only he can edit and delete them in Admin Products page. 
- user can add products to his cart , then do checkout in order to pay.
- user can pay for his order with his credit card. You may try that, payment system is in test mode so you may enter some random card number.
