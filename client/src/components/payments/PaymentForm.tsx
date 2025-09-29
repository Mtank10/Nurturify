import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { AlertCircle, CreditCard, Lock } from 'lucide-react';

interface PaymentFormProps {
  amount: number;
  currency?: string;
  description: string;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
  loading?: boolean;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  currency = 'usd',
  description,
  onSuccess,
  onError,
  loading: externalLoading = false
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Card element not found');
      setProcessing(false);
      return;
    }

    try {
      // Create payment method
      const { error: methodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (methodError) {
        throw new Error(methodError.message);
      }

      // Create payment intent on server
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to cents
          currency,
          payment_method_id: paymentMethod.id,
          description
        })
      });

      const { client_secret, error: serverError } = await response.json();

      if (serverError) {
        throw new Error(serverError);
      }

      // Confirm payment
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(client_secret);

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      onSuccess(paymentIntent);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Details</h3>
          <p className="text-gray-600">{description}</p>
          <p className="text-2xl font-bold text-primary-600 mt-2">
            ${amount.toFixed(2)} {currency.toUpperCase()}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-error-50 border border-error-200 rounded-xl text-error-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CreditCard className="w-4 h-4 inline mr-2" />
              Card Information
            </label>
            <div className="p-3 border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Lock className="w-4 h-4" />
            <span>Your payment information is secure and encrypted</span>
          </div>
        </div>

        <Button
          type="submit"
          disabled={!stripe || processing || externalLoading}
          loading={processing || externalLoading}
          className="w-full"
          size="lg"
        >
          {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </Button>
      </form>
    </Card>
  );
};