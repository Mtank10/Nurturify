import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SubscriptionPlans } from '../components/payments/SubscriptionPlans';
import { PaymentModal } from '../components/payments/PaymentModal';
import { useAuth } from '../hooks/useAuth';
import { CreditCard, Calendar, User, History, Download, CircleCheck as CheckCircle, Clock, Circle as XCircle } from 'lucide-react';

interface PaymentHistory {
  id: string;
  type: 'subscription' | 'course' | 'counseling';
  description: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  date: string;
  invoice_url?: string;
}

export const Payments: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'plans' | 'history'>('plans');
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    type: 'subscription' | 'course' | 'counseling';
    amount: number;
    title: string;
    description: string;
  }>({
    isOpen: false,
    type: 'subscription',
    amount: 0,
    title: '',
    description: ''
  });

  // Mock payment history - in real app, fetch from API
  const paymentHistory: PaymentHistory[] = [
    {
      id: '1',
      type: 'subscription',
      description: 'Premium Plan - Monthly',
      amount: 19.99,
      currency: 'usd',
      status: 'succeeded',
      date: '2024-01-15',
      invoice_url: '#'
    },
    {
      id: '2',
      type: 'counseling',
      description: 'Mental Health Counseling Session',
      amount: 75.00,
      currency: 'usd',
      status: 'succeeded',
      date: '2024-01-10'
    },
    {
      id: '3',
      type: 'course',
      description: 'Advanced Mathematics Course',
      amount: 149.99,
      currency: 'usd',
      status: 'pending',
      date: '2024-01-08'
    }
  ];

  const handleSelectPlan = (plan: any) => {
    setPaymentModal({
      isOpen: true,
      type: 'subscription',
      amount: plan.price,
      title: `${plan.name} Plan`,
      description: `Subscribe to ${plan.name} plan for ${plan.interval}ly access`
    });
  };

  const handlePaymentSuccess = (paymentIntent: any) => {
    console.log('Payment successful:', paymentIntent);
    // Handle successful payment - update user subscription, show success message, etc.
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return CheckCircle;
      case 'pending':
        return Clock;
      case 'failed':
        return XCircle;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
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

  // Check user permissions
  const canMakePayments = ['student', 'parent', 'admin'].includes(user?.role || '');

  if (!canMakePayments) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 text-center max-w-md">
          <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">
            Payment features are only available for students, parents, and administrators.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payments & Billing</h1>
          <p className="text-gray-600">Manage your subscriptions, course purchases, and payment history.</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
        {[
          { id: 'plans', label: 'Subscription Plans', icon: CreditCard },
          { id: 'history', label: 'Payment History', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-primary-600 shadow-soft'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'plans' && (
        <SubscriptionPlans
          onSelectPlan={handleSelectPlan}
          currentPlan="basic" // This would come from user's current subscription
        />
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
              <Button variant="ghost" size="sm" icon={Download}>
                Export
              </Button>
            </div>

            <div className="space-y-4">
              {paymentHistory.map((payment) => {
                const StatusIcon = getStatusIcon(payment.status);
                const TypeIcon = getTypeIcon(payment.type);
                
                return (
                  <div key={payment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <TypeIcon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{payment.description}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(payment.date).toLocaleDateString()} • 
                          ${payment.amount.toFixed(2)} {payment.currency.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={getStatusColor(payment.status) as any} 
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <StatusIcon className="w-3 h-3" />
                        {payment.status}
                      </Badge>
                      
                      {payment.invoice_url && (
                        <Button variant="ghost" size="sm">
                          Invoice
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {paymentHistory.length === 0 && (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payment History</h3>
                <p className="text-gray-600">Your payment transactions will appear here.</p>
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card 
              hover 
              className="p-6 cursor-pointer"
              onClick={() => setPaymentModal({
                isOpen: true,
                type: 'course',
                amount: 149.99,
                title: 'Course Enrollment',
                description: 'Enroll in a premium course'
              })}
            >
              <div className="text-center">
                <Calendar className="w-8 h-8 text-primary-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Enroll in Course</h3>
                <p className="text-sm text-gray-600">Access premium courses and materials</p>
              </div>
            </Card>

            <Card 
              hover 
              className="p-6 cursor-pointer"
              onClick={() => setPaymentModal({
                isOpen: true,
                type: 'counseling',
                amount: 75.00,
                title: 'Counseling Session',
                description: 'Book a mental health counseling session'
              })}
            >
              <div className="text-center">
                <User className="w-8 h-8 text-accent-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Book Counseling</h3>
                <p className="text-sm text-gray-600">Schedule a session with a counselor</p>
              </div>
            </Card>

            <Card hover className="p-6 cursor-pointer">
              <div className="text-center">
                <CreditCard className="w-8 h-8 text-warning-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Manage Cards</h3>
                <p className="text-sm text-gray-600">Update payment methods</p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
        paymentType={paymentModal.type}
        amount={paymentModal.amount}
        title={paymentModal.title}
        description={paymentModal.description}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};