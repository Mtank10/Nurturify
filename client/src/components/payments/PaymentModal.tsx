import React, { useState } from 'react';
import { X, CreditCard, Calendar, User } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { PaymentForm } from './PaymentForm';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51234567890abcdef');

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentType: 'subscription' | 'course' | 'counseling';
  amount: number;
  title: string;
  description: string;
  onSuccess: (paymentIntent: any) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  paymentType,
  amount,
  title,
  description,
  onSuccess
}) => {
  const [step, setStep] = useState<'details' | 'payment'>('details');

  if (!isOpen) return null;

  const getPaymentIcon = () => {
    switch (paymentType) {
      case 'subscription':
        return CreditCard;
      case 'course':
        return Calendar;
      case 'counseling':
        return User;
      default:
        return CreditCard;
    }
  };

  const Icon = getPaymentIcon();

  const handlePaymentSuccess = (paymentIntent: any) => {
    onSuccess(paymentIntent);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md">
        <Card className="p-0">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-100 rounded-xl flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-600">{paymentType}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" icon={X} onClick={onClose}>
              <span className="sr-only">Close</span>
            </Button>
          </div>

          <div className="p-6">
            {step === 'details' ? (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Summary</h3>
                  <p className="text-gray-600 mb-4">{description}</p>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Total Amount</span>
                      <span className="text-2xl font-bold text-primary-600">
                        ${amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">What you'll get:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {paymentType === 'subscription' && (
                      <>
                        <li>• Advanced AI insights and recommendations</li>
                        <li>• Personalized study plans</li>
                        <li>• Priority customer support</li>
                        <li>• Advanced analytics dashboard</li>
                      </>
                    )}
                    {paymentType === 'course' && (
                      <>
                        <li>• Full course access</li>
                        <li>• Interactive assignments</li>
                        <li>• Certificate of completion</li>
                        <li>• Lifetime access to materials</li>
                      </>
                    )}
                    {paymentType === 'counseling' && (
                      <>
                        <li>• 1-on-1 counseling session</li>
                        <li>• Professional mental health support</li>
                        <li>• Personalized wellness plan</li>
                        <li>• Follow-up resources</li>
                      </>
                    )}
                  </ul>
                </div>

                <Button
                  onClick={() => setStep('payment')}
                  className="w-full"
                  size="lg"
                >
                  Proceed to Payment
                </Button>
              </div>
            ) : (
              <Elements stripe={stripePromise}>
                <PaymentForm
                  amount={amount}
                  description={description}
                  onSuccess={handlePaymentSuccess}
                  onError={(error) => console.error('Payment error:', error)}
                />
              </Elements>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};