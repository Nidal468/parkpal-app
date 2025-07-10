import Stripe from "stripe";


const key = process.env.STRIPE_SECRET_KEY;

const stripe = key ? new Stripe(key, {}) : null
export { stripe }