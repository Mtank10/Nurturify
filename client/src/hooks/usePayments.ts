import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import apiService from '../services/api';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
}

export const usePayments = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPaymentIntent = async (amount: number, currency: string = 'usd', metadata?: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.createPaymentIntent({
        amount,
        currency,
        metadata
      });

      if (response.success) {
        return response.data as PaymentIntent;
      } else {
        throw new Error(response.message || 'Failed to create payment intent');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (clientSecret: string, paymentMethodData?: any) => {
    if (!stripe || !elements) {
      throw new Error('Stripe not initialized');
    }

    try {
      setLoading(true);
      setError(null);

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethodData || {
          card: cardElement,
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return paymentIntent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment confirmation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (priceId: string, paymentMethodId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.createSubscription({
        priceId,
        paymentMethodId
      });

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create subscription');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Subscription failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.cancelSubscription(subscriptionId);

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to cancel subscription');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Cancellation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createPaymentIntent,
    confirmPayment,
    createSubscription,
    cancelSubscription,
    loading,
    error,
    stripe,
    elements
  };
};