import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { 
  Trophy, 
  Star, 
  Target, 
  Flame, 
  Gift, 
  Users, 
  Crown,
  Medal,
  Award,
  Zap,
  Calendar,
  TrendingUp
} from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockedDate?: string;
  progress?: number;
  maxProgress?: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  progress: number;
  maxProgress: number;
  reward: string;
  expiresIn: string;
}

export const Gamification: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'achievements' | 'challenges' | 'leaderboard' | 'rewards'>('achievements');

  const playerStats = {
    level: 15,
    xp: 2450,
    xpToNext: 3000,
    totalPoints: 15680,
    rank: 23,
    streakDays: 12,
  };

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'First Steps',
      description: 'Complete your first assignment',
      icon: '🎯',
      rarity: 'common',
      unlocked: true,
      unlockedDate: '2 weeks ago',
    },
    {
      id: '2',
      title: 'Study Warrior',
      description: 'Study for 7 consecutive days',
      icon: '⚔️',
      rarity: 'rare',
      unlocked: true,
      unlockedDate: '1 week ago',
    },
    {
      id: '3',
      title: 'Perfect Score',
      description: 'Get 100% on any quiz',
      icon: '💯',
      rarity: 'epic',
      unlocked: true,
      unlockedDate: '3 days ago',
    },
    {
      id: '4',
      title: 'Knowledge Master',
      description: 'Complete 50 assignments',
      icon: '🧠',
      rarity: 'legendary',
      unlocked: false,
      progress: 32,
      maxProgress: 50,
    },
    {
      id: '5',
      title: 'Wellness Champion',
      description: 'Maintain high wellness score for 30 days',
      icon: '💚',
      rarity: 'epic',
      unlocked: false,
      progress: 18,
      maxProgress: 30,
    },
  ];

  const challenges: Challenge[] = [
    {
      id: '1',
      title: 'Daily Grind',
      description: 'Complete 3 assignments today',
      type: 'daily',
      progress: 2,
      maxProgress: 3,
      reward: '50 XP',
      expiresIn: '6h 23m',
    },
    {
      id: '2',
      title: 'Study Marathon',
      description: 'Study for 20 hours this week',
      type: 'weekly',
      progress: 14,
      maxProgress: 20,
      reward: '200 XP + Badge',
      expiresIn: '2d 14h',
    },
    {
      id: '3',
      title: 'Subject Master',
      description: 'Get A grade in all subjects this month',
      type: 'monthly',
      progress: 3,
      maxProgress: 5,
      reward: '500 XP + Title',
      expiresIn: '12d 8h',
    },
  ];

  const leaderboard = [
    { rank: 1, name: 'Alex Chen', points: 18950, level: 18, badge: '👑' },
    { rank: 2, name: 'Sarah Kim', points: 17230, level: 17, badge: '🥈' },
    { rank: 3, name: 'Mike Rodriguez', points: 16890, level: 16, badge: '🥉' },
    { rank: 4, name: 'Emma Wilson', points: 16120, level: 16, badge: '🏆' },
    { rank: 5, name: 'David Park', points: 15950, level: 15, badge: '⭐' },
    { rank: 23, name: 'You', points: 15680, level: 15, badge: '🎯', isCurrentUser: true },
  ];

  const rewards = [
    { id: '1', title: 'Custom Avatar', cost: 500, type: 'cosmetic', available: true },
    { id: '2', title: 'Study Buddy AI+', cost: 1000, type: 'feature', available: true },
    { id: '3', title: 'Priority Support', cost: 750, type: 'service', available: false },
    { id: '4', title: 'Exclusive Badge', cost: 300, type: 'cosmetic', available: true },
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'rare':
        return 'bg-primary-100 text-primary-800 border-primary-300';
      case 'epic':
        return 'bg-accent-100 text-accent-800 border-accent-300';
      case 'legendary':
        return 'bg-warning-100 text-warning-800 border-warning-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getChallengeTypeColor = (type: string) => {
    switch (type) {
      case 'daily':
        return 'success';
      case 'weekly':
        return 'primary';
      case 'monthly':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Achievements & Rewards</h1>
          <p className="text-gray-600">Track your progress, unlock achievements, and earn rewards for your dedication.</p>
        </div>
      </div>

      {/* Player Stats */}
      <Card className="bg-gradient-to-r from-primary-50 to-accent-50 border-primary-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {playerStats.level}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Level {playerStats.level}</h3>
              <div className="flex items-center gap-4 mt-2">
                <div>
                  <p className="text-sm text-gray-600">XP Progress</p>
                  <div className="w-48">
                    <ProgressBar 
                      progress={(playerStats.xp / playerStats.xpToNext) * 100} 
                      color="primary"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {playerStats.xp} / {playerStats.xpToNext} XP
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-600">{playerStats.totalPoints.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Points</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent-600">#{playerStats.rank}</p>
                <p className="text-sm text-gray-600">Class Rank</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-warning-600">{playerStats.streakDays}</p>
                <p className="text-sm text-gray-600">Day Streak</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
        {[
          { id: 'achievements', label: 'Achievements', icon: Trophy },
          { id: 'challenges', label: 'Challenges', icon: Target },
          { id: 'leaderboard', label: 'Leaderboard', icon: Crown },
          { id: 'rewards', label: 'Rewards', icon: Gift },
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
      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <Card key={achievement.id} className={`relative overflow-hidden ${
              achievement.unlocked ? 'bg-white' : 'bg-gray-50'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`text-4xl p-3 rounded-xl ${
                  achievement.unlocked ? 'bg-primary-50' : 'bg-gray-200 grayscale'
                }`}>
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`font-semibold ${
                      achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {achievement.title}
                    </h3>
                    <Badge 
                      variant="secondary" 
                      size="sm" 
                      className={getRarityColor(achievement.rarity)}
                    >
                      {achievement.rarity}
                    </Badge>
                  </div>
                  <p className={`text-sm mb-3 ${
                    achievement.unlocked ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {achievement.description}
                  </p>
                  
                  {achievement.unlocked ? (
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-success-500" />
                      <span className="text-sm text-success-600 font-medium">
                        Unlocked {achievement.unlockedDate}
                      </span>
                    </div>
                  ) : achievement.progress !== undefined ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-medium text-gray-900">
                          {achievement.progress} / {achievement.maxProgress}
                        </span>
                      </div>
                      <ProgressBar 
                        progress={(achievement.progress / achievement.maxProgress!) * 100} 
                        color="primary"
                        size="sm"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">Locked</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'challenges' && (
        <div className="space-y-4">
          {challenges.map((challenge) => {
            const typeColor = getChallengeTypeColor(challenge.type);
            return (
              <Card key={challenge.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{challenge.title}</h3>
                      <Badge variant={typeColor as any} size="sm">
                        {challenge.type}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-4">{challenge.description}</p>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Progress</span>
                          <span className="text-sm font-bold text-gray-900">
                            {challenge.progress} / {challenge.maxProgress}
                          </span>
                        </div>
                        <ProgressBar 
                          progress={(challenge.progress / challenge.maxProgress) * 100} 
                          color={typeColor as any}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Gift className="w-4 h-4 text-warning-500" />
                          <span className="text-sm font-medium text-gray-900">Reward: {challenge.reward}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Expires in {challenge.expiresIn}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    {challenge.progress >= challenge.maxProgress ? (
                      <Button size="sm" icon={Gift}>
                        Claim Reward
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" icon={TrendingUp}>
                        View Progress
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Class Leaderboard</h2>
            <Badge variant="secondary">
              Updated 5 minutes ago
            </Badge>
          </div>
          
          <div className="space-y-2">
            {leaderboard.map((player) => (
              <div
                key={player.rank}
                className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                  player.isCurrentUser 
                    ? 'bg-primary-50 border-2 border-primary-200' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    player.rank <= 3 ? 'bg-warning-100 text-warning-800' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {player.rank}
                  </div>
                  <div className="text-2xl">{player.badge}</div>
                  <div>
                    <h3 className={`font-semibold ${
                      player.isCurrentUser ? 'text-primary-900' : 'text-gray-900'
                    }`}>
                      {player.name}
                    </h3>
                    <p className="text-sm text-gray-600">Level {player.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{player.points.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">points</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'rewards' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Reward Store</h2>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-warning-500" />
              <span className="text-lg font-bold text-gray-900">{playerStats.totalPoints.toLocaleString()}</span>
              <span className="text-sm text-gray-600">points available</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward) => (
              <Card key={reward.id} className={`${!reward.available ? 'opacity-50' : ''}`}>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                    {reward.type === 'cosmetic' ? '🎨' : reward.type === 'feature' ? '⚡' : '🎯'}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{reward.title}</h3>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Star className="w-4 h-4 text-warning-500" />
                    <span className="font-bold text-gray-900">{reward.cost}</span>
                    <span className="text-sm text-gray-600">points</span>
                  </div>
                  <Button 
                    size="sm" 
                    disabled={!reward.available || playerStats.totalPoints < reward.cost}
                    className="w-full"
                  >
                    {reward.available ? 'Redeem' : 'Coming Soon'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};