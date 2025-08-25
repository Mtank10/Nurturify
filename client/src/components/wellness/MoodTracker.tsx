import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

const moodEmojis = [
  { value: 1, emoji: '😢', label: 'Very Sad' },
  { value: 2, emoji: '😔', label: 'Sad' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '😊', label: 'Happy' },
  { value: 5, emoji: '😄', label: 'Very Happy' },
];

export const MoodTracker: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (selectedMood) {
      console.log('Mood submitted:', { mood: selectedMood, notes });
      setSelectedMood(null);
      setNotes('');
    }
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Mood Check-in</h2>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-3">How are you feeling today?</p>
          <div className="flex justify-between gap-2">
            {moodEmojis.map((mood) => (
              <button
                key={mood.value}
                onClick={() => setSelectedMood(mood.value)}
                className={`p-3 rounded-xl text-2xl transition-all duration-200 hover:scale-110 ${
                  selectedMood === mood.value
                    ? 'bg-primary-100 ring-2 ring-primary-500'
                    : 'hover:bg-gray-50'
                }`}
                title={mood.label}
              >
                {mood.emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How was your day? Any thoughts or feelings you'd like to share?"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!selectedMood}
          className="w-full"
        >
          Submit Mood Check-in
        </Button>
      </div>
    </Card>
  );
};