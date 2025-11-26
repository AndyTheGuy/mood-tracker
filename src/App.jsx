import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Download, Plus, Settings, X, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const MoodTracker = () => {
  const [currentView, setCurrentView] = useState('entry');
  const [entries, setEntries] = useState([]);
  const [medications, setMedications] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showMedSettings, setShowMedSettings] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [timeRange, setTimeRange] = useState('week');
  const [saveStatus, setSaveStatus] = useState('');
  const [anxiety, setAnxiety] = useState(5);
  const [irritability, setIrritability] = useState(5);
  const [depressedMood, setDepressedMood] = useState(5);
  const [elevatedMood, setElevatedMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [notes, setNotes] = useState('');
  const [sleep, setSleep] = useState('');
  const [weight, setWeight] = useState('');
  const [selectedMeds, setSelectedMeds] = useState([]);
  const [newMedName, setNewMedName] = useState('');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderTimes, setReminderTimes] = useState(['09:00', '14:00', '19:00']);
  const [newReminderTime, setNewReminderTime] = useState('');

  useEffect(() => {
    try {
      const savedEntries = localStorage.getItem('moodTrackerEntries');
      const savedMeds = localStorage.getItem('moodTrackerMeds');
      const savedReminders = localStorage.getItem('moodTrackerReminders');
      const savedNotifStatus = localStorage.getItem('moodTrackerNotifications');
      
      if (savedEntries) setEntries(JSON.parse(savedEntries));
      if (savedMeds) setMedications(JSON.parse(savedMeds));
      if (savedReminders) setReminderTimes(JSON.parse(savedReminders));
      if (savedNotifStatus) setNotificationsEnabled(JSON.parse(savedNotifStatus));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  useEffect(() => {
    if (entries.length > 0) {
      localStorage.setItem('moodTrackerEntries', JSON.stringify(entries));
    }
  }, [entries]);

  useEffect(() => {
    if (medications.length > 0) {
      localStorage.setItem('moodTrackerMeds', JSON.stringify(medications));
    }
  }, [medications]);

  const showSaveMessage = (message) => {
    setSaveStatus(message);
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const isFirstEntryToday = () => {
    const today = new Date().toISOString().split('T')[0];
    return !entries.some(e => e.date === today);
  };

  const addMedication = () => {
    if (newMedName.trim()) {
      setMedications([...medications, { id: Date.now(), name: newMedName.trim() }]);
      setNewMedName('');
      showSaveMessage('Medication added');
    }
  };

  const removeMedication = (id) => {
    setMedications(medications.filter(m => m.id !== id));
    showSaveMessage('Medication removed');
  };

  const enableNotifications = async () => {
    try {
      if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function(OneSignal) {
          await OneSignal.Notifications.requestPermission();
          const isSubscribed = await OneSignal.User.PushSubscription.optedIn;
          
          if (isSubscribed) {
            setNotificationsEnabled(true);
            localStorage.setItem('moodTrackerNotifications', JSON.stringify(true));
            scheduleNotifications();
            showSaveMessage('Notifications enabled!');
          } else {
            showSaveMessage('Permission denied');
          }
        });
      } else {
        showSaveMessage('OneSignal not loaded');
      }
    } catch (error) {
      console.error('Notification error:', error);
      showSaveMessage('Error enabling notifications');
    }
  };

  const disableNotifications = () => {
    setNotificationsEnabled(false);
    localStorage.setItem('moodTrackerNotifications', JSON.stringify(false));
    showSaveMessage('Notifications disabled');
  };

  const scheduleNotifications = () => {
    // OneSignal will handle scheduling on their servers
    // We just need to send the reminder times to tag the user
    if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push(function(OneSignal) {
        OneSignal.User.addTag("reminder_times", reminderTimes.join(','));
      });
    }
  };

  const addReminderTime = () => {
    if (newReminderTime && !reminderTimes.includes(newReminderTime)) {
      const updated = [...reminderTimes, newReminderTime].sort();
      setReminderTimes(updated);
      localStorage.setItem('moodTrackerReminders', JSON.stringify(updated));
      setNewReminderTime('');
      if (notificationsEnabled) scheduleNotifications();
      showSaveMessage('Reminder added');
    }
  };

  const removeReminderTime = (time) => {
    const updated = reminderTimes.filter(t => t !== time);
    setReminderTimes(updated);
    localStorage.setItem('moodTrackerReminders', JSON.stringify(updated));
    if (notificationsEnabled) scheduleNotifications();
    showSaveMessage('Reminder removed');
  };

  const toggleMedSelection = (medId) => {
    setSelectedMeds(prev =>
      prev.includes(medId) ? prev.filter(id => id !== medId) : [...prev, medId]
    );
  };

  const addEntry = () => {
    if (sleep && (parseFloat(sleep) < 0 || parseFloat(sleep) > 24)) {
      showSaveMessage('Sleep must be between 0-24 hours');
      return;
    }
    if (weight && parseFloat(weight) < 0) {
      showSaveMessage('Weight cannot be negative');
      return;
    }

    const now = new Date();
    const newEntry = {
      id: Date.now(),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].substring(0, 5),
      timestamp: now.toISOString(),
      anxiety: parseInt(anxiety),
      irritability: parseInt(irritability),
      depressedMood: parseInt(depressedMood),
      elevatedMood: parseInt(elevatedMood),
      energy: parseInt(energy),
      notes: notes.trim(),
      medications: selectedMeds.map(id => medications.find(m => m.id === id)?.name).filter(Boolean),
      ...(isFirstEntryToday() && {
        sleep: sleep ? parseFloat(sleep) : null,
        weight: weight ? parseFloat(weight) : null
      })
    };

    setEntries([...entries, newEntry].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    setAnxiety(5);
    setIrritability(5);
    setDepressedMood(5);
    setElevatedMood(5);
    setEnergy(5);
    setNotes('');
    setSleep('');
    setWeight('');
    setSelectedMeds([]);
    showSaveMessage('Entry saved!');
  };

  const getEntriesForDate = (date) => {
    return entries.filter(e => e.date === date).sort((a, b) => a.time.localeCompare(b.time));
  };

  const getDatesWithEntries = () => {
    const dates = [...new Set(entries.map(e => e.date))];
    return dates.sort((a, b) => b.localeCompare(a));
  };

  const getTimeRangeData = () => {
    const ranges = { day: 1, week: 7, month: 30, year: 365, all: 99999 };
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - ranges[timeRange]);

    const filteredEntries = entries.filter(e => new Date(e.timestamp) >= startDate);
    const grouped = {};

    filteredEntries.forEach(e => {
      if (!grouped[e.date]) {
        grouped[e.date] = {
          date: e.date,
          anxiety: [], irritability: [], depressed: [], elevated: [], energy: [],
          sleep: e.sleep || null, weight: e.weight || null
        };
      }
      grouped[e.date].anxiety.push(e.anxiety);
      grouped[e.date].irritability.push(e.irritability);
      grouped[e.date].depressed.push(e.depressedMood);
      grouped[e.date].elevated.push(e.elevatedMood);
      grouped[e.date].energy.push(e.energy);
    });

    return Object.values(grouped).map(day => ({
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: day.date,
      anxiety: day.anxiety.reduce((a, b) => a + b, 0) / day.anxiety.length,
      irritability: day.irritability.reduce((a, b) => a + b, 0) / day.irritability.length,
      depressed: day.depressed.reduce((a, b) => a + b, 0) / day.depressed.length,
      elevated: day.elevated.reduce((a, b) => a + b, 0) / day.elevated.length,
      energy: day.energy.reduce((a, b) => a + b, 0) / day.energy.length,
      sleep: day.sleep, weight: day.weight
    })).sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
  };

  const getFilteredEntries = () => {
    if (!exportStartDate && !exportEndDate) return entries;
    
    return entries.filter(entry => {
      const entryDate = entry.date;
      const afterStart = !exportStartDate || entryDate >= exportStartDate;
      const beforeEnd = !exportEndDate || entryDate <= exportEndDate;
      return afterStart && beforeEnd;
    });
  };

  const exportToPDF = () => {
    const filteredEntries = getFilteredEntries();
    const dates = [...new Set(filteredEntries.map(e => e.date))].sort((a, b) => b.localeCompare(a));
    
    const printWindow = window.open('', '', 'width=800,height=600');
    
    let content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Mood Tracker Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1 {
            color: #4f46e5;
            border-bottom: 3px solid #4f46e5;
            padding-bottom: 10px;
          }
          h2 {
            color: #6366f1;
            margin-top: 30px;
            border-bottom: 2px solid #e0e7ff;
            padding-bottom: 5px;
          }
          .entry {
            margin: 15px 0;
            padding: 15px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: #f9fafb;
          }
          .entry-time {
            font-weight: bold;
            color: #374151;
            margin-bottom: 10px;
          }
          .metrics {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 10px;
            margin: 10px 0;
          }
          .metric {
            text-align: center;
            padding: 8px;
            border-radius: 5px;
            background: white;
            border: 1px solid #e5e7eb;
          }
          .metric-label {
            font-size: 11px;
            color: #6b7280;
            margin-bottom: 3px;
          }
          .metric-value {
            font-size: 18px;
            font-weight: bold;
          }
          .anxiety { color: #ef4444; }
          .irritability { color: #f97316; }
          .depressed { color: #3b82f6; }
          .elevated { color: #eab308; }
          .energy { color: #10b981; }
          .notes {
            margin-top: 10px;
            padding: 10px;
            background: white;
            border-left: 3px solid #4f46e5;
            font-style: italic;
            color: #4b5563;
          }
          .medications {
            margin-top: 8px;
            padding: 8px;
            background: #fef3c7;
            border-radius: 5px;
            font-size: 14px;
          }
          .daily-stats {
            margin-top: 10px;
            padding: 10px;
            background: #dbeafe;
            border-radius: 5px;
            display: flex;
            gap: 20px;
          }
          @media print {
            .entry { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>Mood Tracker Report</h1>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        ${exportStartDate || exportEndDate ? `<p><strong>Date Range:</strong> ${exportStartDate || 'Start'} to ${exportEndDate || 'End'}</p>` : ''}
    `;

    dates.forEach(date => {
      const dayEntries = filteredEntries.filter(e => e.date === date).sort((a, b) => a.time.localeCompare(b.time));
      const firstEntry = dayEntries[0];
      
      content += `<h2>${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>`;
      
      if (firstEntry.sleep !== null || firstEntry.weight !== null) {
        content += '<div class="daily-stats">';
        if (firstEntry.sleep !== null) content += `<div><strong>Sleep:</strong> ${firstEntry.sleep} hours</div>`;
        if (firstEntry.weight !== null) content += `<div><strong>Weight:</strong> ${firstEntry.weight} kg</div>`;
        content += '</div>';
      }

      dayEntries.forEach(entry => {
        content += `
          <div class="entry">
            <div class="entry-time">${entry.time}</div>
            <div class="metrics">
              <div class="metric">
                <div class="metric-label">Anxiety</div>
                <div class="metric-value anxiety">${entry.anxiety}</div>
              </div>
              <div class="metric">
                <div class="metric-label">Irritability</div>
                <div class="metric-value irritability">${entry.irritability}</div>
              </div>
              <div class="metric">
                <div class="metric-label">Depressed</div>
                <div class="metric-value depressed">${entry.depressedMood}</div>
              </div>
              <div class="metric">
                <div class="metric-label">Elevated</div>
                <div class="metric-value elevated">${entry.elevatedMood}</div>
              </div>
              <div class="metric">
                <div class="metric-label">Energy</div>
                <div class="metric-value energy">${entry.energy}</div>
              </div>
            </div>
            ${entry.medications && entry.medications.length > 0 ? `
              <div class="medications">
                <strong>Medications:</strong> ${entry.medications.join(', ')}
              </div>
            ` : ''}
            ${entry.notes ? `<div class="notes">${entry.notes}</div>` : ''}
          </div>
        `;
      });
    });

    content += `
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
    
    showSaveMessage('Print dialog opened - Save as PDF');
    setShowExportModal(false);
  };

  const getColorClass = (type, variant = 'bg') => {
    const colors = {
      red: { bg: 'bg-red-200', text: 'text-red-600', bgLight: 'bg-red-50' },
      orange: { bg: 'bg-orange-200', text: 'text-orange-600', bgLight: 'bg-orange-50' },
      blue: { bg: 'bg-blue-200', text: 'text-blue-600', bgLight: 'bg-blue-50' },
      yellow: { bg: 'bg-yellow-200', text: 'text-yellow-600', bgLight: 'bg-yellow-50' },
      green: { bg: 'bg-green-200', text: 'text-green-600', bgLight: 'bg-green-50' }
    };
    return colors[type][variant];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 pb-20">
      {saveStatus && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {saveStatus}
        </div>
      )}

      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Mood Tracker
          </h1>
          <button onClick={() => setShowMedSettings(true)} className="p-2 hover:bg-gray-100 rounded-lg">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {showMedSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Settings</h2>
              <button onClick={() => setShowMedSettings(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-6">
              {/* Notifications Section */}
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-3">Push Notifications</h3>
                {!notificationsEnabled ? (
                  <button
                    onClick={enableNotifications}
                    className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700"
                  >
                    Enable Notifications
                  </button>
                ) : (
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3 flex items-center justify-between">
                      <span className="text-green-700">✓ Notifications Enabled</span>
                      <button
                        onClick={disableNotifications}
                        className="text-red-600 text-sm hover:underline"
                      >
                        Disable
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="block text-sm font-medium">Reminder Times</label>
                      <div className="flex gap-2">
                        <input
                          type="time"
                          value={newReminderTime}
                          onChange={(e) => setNewReminderTime(e.target.value)}
                          className="flex-1 px-3 py-2 border rounded-lg"
                        />
                        <button
                          onClick={addReminderTime}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                        >
                          Add
                        </button>
                      </div>
                      <div className="space-y-2">
                        {reminderTimes.map(time => (
                          <div key={time} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span>{time}</span>
                            <button
                              onClick={() => removeReminderTime(time)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Medications Section */}
              <div>
                <h3 className="font-semibold mb-3">Medications</h3>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addMedication()}
                    placeholder="Add medication"
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <button onClick={addMedication} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {medications.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No medications added yet</p>
                  ) : (
                    medications.map(med => (
                      <div key={med.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span>{med.name}</span>
                        <button onClick={() => removeMedication(med.id)} className="text-red-600 hover:text-red-800">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Export to PDF</h2>
              <button onClick={() => setShowExportModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Date (optional)</label>
                <input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date (optional)</label>
                <input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={exportToPDF}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  <FileText className="w-4 h-4 inline mr-1" />
                  Generate PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          {['entry', 'history', 'trends'].map(view => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                currentView === view ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {view === 'entry' && <Plus className="w-4 h-4 inline mr-1" />}
              {view === 'history' && <Calendar className="w-4 h-4 inline mr-1" />}
              {view === 'trends' && <TrendingUp className="w-4 h-4 inline mr-1" />}
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>

        {currentView === 'entry' && (
          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {isFirstEntryToday() && (
              <div className="bg-amber-50 rounded-lg p-4 space-y-4 border border-amber-200">
                <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Morning Log
                </h3>
                <input
                  type="number"
                  step="0.5"
                  value={sleep}
                  onChange={(e) => setSleep(e.target.value)}
                  placeholder="Sleep (hours)"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Weight (kg)"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            )}

            {medications.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium flex items-center gap-2">
                  <span>Medications Taken</span>
                </label>
                <div className="space-y-2">
                  {medications.map(med => (
                    <label key={med.id} className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedMeds.includes(med.id) ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="checkbox"
                        checked={selectedMeds.includes(med.id)}
                        onChange={() => toggleMedSelection(med.id)}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="ml-3">{med.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {[
              { label: 'Anxiety', value: anxiety, setter: setAnxiety, color: 'red' },
              { label: 'Irritability', value: irritability, setter: setIrritability, color: 'orange' },
              { label: 'Depressed Mood', value: depressedMood, setter: setDepressedMood, color: 'blue' },
              { label: 'Elevated Mood', value: elevatedMood, setter: setElevatedMood, color: 'yellow' },
              { label: 'Energy', value: energy, setter: setEnergy, color: 'green' }
            ].map(({ label, value, setter, color }) => (
              <div key={label}>
                <label className="block text-sm font-medium mb-2">{label}: {value}/10</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className={`w-full h-3 ${getColorClass(color, 'bg')} rounded-lg cursor-pointer appearance-none`}
                />
              </div>
            ))}

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              rows="3"
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />

            <button onClick={addEntry} className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
              Save Entry
            </button>
          </div>
        )}

        {currentView === 'history' && (
          <div className="space-y-6">
            {entries.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No entries yet</p>
                <button onClick={() => setCurrentView('entry')} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
                  Create First Entry
                </button>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => setShowExportModal(true)} 
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Export to PDF
                </button>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {getDatesWithEntries().map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </option>
                  ))}
                </select>
                <div className="space-y-4">
                  {getEntriesForDate(selectedDate).map((entry, idx) => (
                    <div key={entry.id} className="bg-white rounded-lg shadow-md p-4">
                      <div className="font-medium mb-3 text-gray-700">{entry.time}</div>
                      {idx === 0 && (entry.sleep !== null || entry.weight !== null) && (
                        <div className="mb-3 p-3 bg-blue-50 rounded-lg flex gap-4 text-sm">
                          {entry.sleep !== null && <div><strong>Sleep:</strong> {entry.sleep}h</div>}
                          {entry.weight !== null && <div><strong>Weight:</strong> {entry.weight}kg</div>}
                        </div>
                      )}
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          { label: 'Anxiety', value: entry.anxiety, color: 'red' },
                          { label: 'Irritable', value: entry.irritability, color: 'orange' },
                          { label: 'Depressed', value: entry.depressedMood, color: 'blue' },
                          { label: 'Elevated', value: entry.elevatedMood, color: 'yellow' },
                          { label: 'Energy', value: entry.energy, color: 'green' }
                        ].map(({ label, value, color }) => (
                          <div key={label} className={`text-center p-2 ${getColorClass(color, 'bgLight')} rounded`}>
                            <div className="text-xs text-gray-600">{label}</div>
                            <div className={`text-lg font-bold ${getColorClass(color, 'text')}`}>{value}</div>
                          </div>
                        ))}
                      </div>
                      {entry.medications && entry.medications.length > 0 && (
                        <div className="mt-3 p-3 bg-yellow-50 rounded text-sm border border-yellow-200">
                          <strong>Medications:</strong> {entry.medications.join(', ')}
                        </div>
                      )}
                      {entry.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm border-l-4 border-indigo-500">{entry.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {currentView === 'trends' && (
          <div className="space-y-6">
            {entries.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No data yet</p>
              </div>
            ) : (
              <>
                <div className="flex gap-2 flex-wrap">
                  {['day', 'week', 'month', 'year', 'all'].map(range => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`flex-1 min-w-[60px] py-2 rounded-lg transition-colors ${
                        timeRange === range ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {range.charAt(0).toUpperCase() + range.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getTimeRangeData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="anxiety" stroke="#ef4444" strokeWidth={2} name="Anxiety" />
                      <Line type="monotone" dataKey="irritability" stroke="#f97316" strokeWidth={2} name="Irritability" />
                      <Line type="monotone" dataKey="depressed" stroke="#3b82f6" strokeWidth={2} name="Depressed" />
                      <Line type="monotone" dataKey="elevated" stroke="#eab308" strokeWidth={2} name="Elevated" />
                      <Line type="monotone" dataKey="energy" stroke="#10b981" strokeWidth={2} name="Energy" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodTracker;
