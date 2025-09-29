import express from 'express';
import Stripe from 'stripe';
import prisma from '../config/database.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51234567890abcdef', {
  apiVersion: '2023-10-16',
});

// @desc    Create payment intent
// @route   POST /api/payments/create-intent
// @access  Private
router.post('/create-intent', protect, async (req, res, next) => {
  try {
    const { amount, currency = 'usd', metadata = {} } = req.body;

    // Validate amount
    if (!amount || amount < 50) { // Minimum $0.50
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least $0.50'
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        userId: req.user.id,
        userRole: req.user.role,
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      }
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment intent'
    });
  }
});

// @desc    Create subscription
// @route   POST /api/payments/create-subscription
// @access  Private
router.post('/create-subscription', protect, async (req, res, next) => {
  try {
    const { priceId, paymentMethodId } = req.body;

    if (!priceId) {
      return res.status(400).json({
        success: false,
        message: 'Price ID is required'
      });
    }

    // Get or create customer
    let customer;
    const existingCustomer = await stripe.customers.list({
      email: req.user.email,
      limit: 1
    });

    if (existingCustomer.data.length > 0) {
      customer = existingCustomer.data[0];
    } else {
      customer = await stripe.customers.create({
        email: req.user.email,
        name: `${req.user.student?.firstName || req.user.teacher?.firstName || ''} ${req.user.student?.lastName || req.user.teacher?.lastName || ''}`.trim(),
        metadata: {
          userId: req.user.id,
          role: req.user.role
        }
      });
    }

    // Attach payment method if provided
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      });

      // Set as default payment method
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: req.user.id,
        userRole: req.user.role
      }
    });

    // Store subscription in database
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        // You might want to add subscription fields to your user model
        // subscriptionId: subscription.id,
        // subscriptionStatus: subscription.status
      }
    });

    res.status(200).json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent?.client_secret,
        status: subscription.status
      }
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create subscription'
    });
  }
});

// @desc    Cancel subscription
// @route   POST /api/payments/cancel-subscription/:id
// @access  Private
router.post('/cancel-subscription/:id', protect, async (req, res, next) => {
  try {
    const subscriptionId = req.params.id;

    // Verify subscription belongs to user
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    if (subscription.metadata.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this subscription'
      });
    }

    // Cancel subscription
    const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);

    // Update database
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        // subscriptionStatus: 'canceled'
      }
    });

    res.status(200).json({
      success: true,
      data: {
        subscriptionId: canceledSubscription.id,
        status: canceledSubscription.status,
        canceledAt: canceledSubscription.canceled_at
      }
    });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel subscription'
    });
  }
});

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
router.get('/history', protect, async (req, res, next) => {
  try {
    const { limit = 10, starting_after } = req.query;

    // Get customer
    const customers = await stripe.customers.list({
      email: req.user.email,
      limit: 1
    });

    if (customers.data.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const customer = customers.data[0];

    // Get payment intents
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customer.id,
      limit: parseInt(limit),
      starting_after
    });

    // Get invoices
    const invoices = await stripe.invoices.list({
      customer: customer.id,
      limit: parseInt(limit),
      starting_after
    });

    // Combine and format data
    const payments = [
      ...paymentIntents.data.map(pi => ({
        id: pi.id,
        type: 'payment',
        amount: pi.amount / 100,
        currency: pi.currency,
        status: pi.status,
        description: pi.description || 'Payment',
        created: pi.created,
        invoice_url: null
      })),
      ...invoices.data.map(inv => ({
        id: inv.id,
        type: 'invoice',
        amount: inv.amount_paid / 100,
        currency: inv.currency,
        status: inv.status,
        description: inv.description || 'Subscription',
        created: inv.created,
        invoice_url: inv.hosted_invoice_url
      }))
    ].sort((a, b) => b.created - a.created);

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve payment history'
    });
  }
});

// @desc    Get subscription status
// @route   GET /api/payments/subscription-status
// @access  Private
router.get('/subscription-status', protect, async (req, res, next) => {
  try {
    // Get customer
    const customers = await stripe.customers.list({
      email: req.user.email,
      limit: 1
    });

    if (customers.data.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          hasActiveSubscription: false,
          subscription: null
        }
      });
    }

    const customer = customers.data[0];

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1
    });

    const hasActiveSubscription = subscriptions.data.length > 0;
    const subscription = hasActiveSubscription ? subscriptions.data[0] : null;

    res.status(200).json({
      success: true,
      data: {
        hasActiveSubscription,
        subscription: subscription ? {
          id: subscription.id,
          status: subscription.status,
          current_period_end: subscription.current_period_end,
          plan: subscription.items.data[0]?.price
        } : null
      }
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve subscription status'
    });
  }
});

// @desc    Webhook handler for Stripe events
// @route   POST /api/payments/webhook
// @access  Public (but verified by Stripe)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      
      // Update database, send confirmation email, etc.
      try {
        const userId = paymentIntent.metadata.userId;
        if (userId) {
          // Create notification
          await prisma.notification.create({
            data: {
              userId,
              type: 'system',
              title: 'Payment Successful',
              message: `Your payment of $${paymentIntent.amount / 100} has been processed successfully.`,
              priority: 'medium'
            }
          });
        }
      } catch (error) {
        console.error('Error handling payment success:', error);
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      
      try {
        const userId = failedPayment.metadata.userId;
        if (userId) {
          await prisma.notification.create({
            data: {
              userId,
              type: 'system',
              title: 'Payment Failed',
              message: `Your payment of $${failedPayment.amount / 100} could not be processed. Please try again.`,
              priority: 'high'
            }
          });
        }
      } catch (error) {
        console.error('Error handling payment failure:', error);
      }
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      console.log('Subscription updated:', subscription.id);
      
      try {
        const userId = subscription.metadata.userId;
        if (userId) {
          // Update user subscription status in database
          await prisma.user.update({
            where: { id: userId },
            data: {
              // subscriptionId: subscription.id,
              // subscriptionStatus: subscription.status
            }
          });

          // Create notification
          await prisma.notification.create({
            data: {
              userId,
              type: 'system',
              title: 'Subscription Updated',
              message: `Your subscription has been ${event.type.includes('created') ? 'created' : 'updated'}.`,
              priority: 'medium'
            }
          });
        }
      } catch (error) {
        console.error('Error handling subscription update:', error);
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

export default router;