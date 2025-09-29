import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
  icon: React.ComponentType<any>;
  color: string;
  stripePriceId: string;
}

interface SubscriptionPlansProps {
  onSelectPlan: (plan: Plan) => void;
  currentPlan?: string;
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  onSelectPlan,
  currentPlan
}) => {
  const { user } = useAuth();
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  const plans: Plan[] = [
    {
      id: 'basic',
      name: 'Basic',
      description: 'Essential features for students',
      price: billingInterval === 'month' ? 9.99 : 99.99,
      currency: 'usd',
      interval: billingInterval,
      stripePriceId: billingInterval === 'month' ? 'price_basic_monthly' : 'price_basic_yearly',
      icon: Zap,
      color: 'primary',
      features: [
        'AI Study Assistant',
        'Basic Analytics',
        'Assignment Tracking',
        'Mobile App Access',
        'Email Support'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Advanced features for serious learners',
      price: billingInterval === 'month' ? 19.99 : 199.99,
      currency: 'usd',
      interval: billingInterval,
      stripePriceId: billingInterval === 'month' ? 'price_premium_monthly' : 'price_premium_yearly',
      icon: Star,
      color: 'accent',
      popular: true,
      features: [
        'Everything in Basic',
        'Advanced AI Insights',
        'Personalized Study Plans',
        'Mental Health Analytics',
        'Priority Support',
        'Custom Reports',
        'Unlimited Counseling Sessions'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Complete solution for institutions',
      price: billingInterval === 'month' ? 49.99 : 499.99,
      currency: 'usd',
      interval: billingInterval,
      stripePriceId: billingInterval === 'month' ? 'price_pro_monthly' : 'price_pro_yearly',
      icon: Crown,
      color: 'warning',
      features: [
        'Everything in Premium',
        'Multi-School Management',
        'Advanced Analytics Dashboard',
        'Custom Integrations',
        'Dedicated Account Manager',
        'White-label Options',
        'API Access'
      ]
    }
  ];

  const getDiscountPercentage = (monthlyPrice: number, yearlyPrice: number) => {
    const monthlyTotal = monthlyPrice * 12;
    const discount = ((monthlyTotal - yearlyPrice) / monthlyTotal) * 100;
    return Math.round(discount);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
        <p className="text-gray-600 mb-6">Unlock premium features and take your learning to the next level</p>
        
        {/* Billing Toggle */}
        <div className="inline-flex items-center bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setBillingInterval('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              billingInterval === 'month'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('year')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              billingInterval === 'year'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
            <Badge variant="success" size="sm" className="ml-2">
              Save {getDiscountPercentage(19.99, 199.99)}%
            </Badge>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = currentPlan === plan.id;
          const canUpgrade = user?.role === 'student' || user?.role === 'parent';
          
          return (
            <Card
              key={plan.id}
              className={`relative p-6 ${
                plan.popular ? 'ring-2 ring-primary-500 shadow-lg' : ''
              } ${isCurrentPlan ? 'bg-gray-50' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge variant="primary" size="sm">
                    Most Popular
                  </Badge>
                </div>
              )}

              <div className="text-center mb-6">
                <div className={`w-12 h-12 bg-${plan.color}-100 rounded-xl flex items-center justify-center mx-auto mb-4`}>
                  <Icon className={`w-6 h-6 text-${plan.color}-600`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-gray-600">/{plan.interval}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-success-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => onSelectPlan(plan)}
                disabled={isCurrentPlan || !canUpgrade}
                variant={plan.popular ? 'primary' : 'secondary'}
                className="w-full"
              >
                {isCurrentPlan ? 'Current Plan' : canUpgrade ? 'Select Plan' : 'Contact Sales'}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Feature Comparison */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4">Feature</th>
                <th className="text-center py-3 px-4">Basic</th>
                <th className="text-center py-3 px-4">Premium</th>
                <th className="text-center py-3 px-4">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { name: 'AI Study Assistant', basic: true, premium: true, pro: true },
                { name: 'Advanced Analytics', basic: false, premium: true, pro: true },
                { name: 'Personalized Study Plans', basic: false, premium: true, pro: true },
                { name: 'Mental Health Tracking', basic: true, premium: true, pro: true },
                { name: 'Unlimited Counseling', basic: false, premium: true, pro: true },
                { name: 'Multi-School Management', basic: false, premium: false, pro: true },
                { name: 'API Access', basic: false, premium: false, pro: true },
              ].map((feature, index) => (
                <tr key={index}>
                  <td className="py-3 px-4 font-medium text-gray-900">{feature.name}</td>
                  <td className="py-3 px-4 text-center">
                    {feature.basic ? (
                      <Check className="w-4 h-4 text-success-500 mx-auto" />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {feature.premium ? (
                      <Check className="w-4 h-4 text-success-500 mx-auto" />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {feature.pro ? (
                      <Check className="w-4 h-4 text-success-500 mx-auto" />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};