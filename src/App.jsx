import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Play, Pause, RotateCcw, Trash2, Plus, Settings, Info, Clock, Zap, BookOpen, TrendingUp, MoreVertical, X, Upload, Loader, Check, AlertCircle, AlertTriangle, Home } from 'lucide-react';

const PerrysProductivityTracker = () => {
  const [currentPage, setCurrentPage] = useState('timer');

  // Timer State
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('study');
  const [selectedClass, setSelectedClass] = useState(1);

  // In-Class Mode State
  const [currentClassSession, setCurrentClassSession] = useState(null);
  const [showClassWarning, setShowClassWarning] = useState(false);
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [enableClassMode, setEnableClassMode] = useState(true);

  // Data State
  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem('perrys_activities');
    return saved ? JSON.parse(saved) : [];
  });

  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem('perrys_classes');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'BSCI222', color: '#FF6B6B', days: 'MWF', time: '10:00-11:15' },
      { id: 2, name: 'CHEM241', color: '#4ECDC4', days: 'TTh', time: '13:30-14:45' },
      { id: 3, name: 'CHEM242', color: '#45B7D1', days: 'MWF', time: '11:30-12:45' },
    ];
  });

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('perrys_categories');
    return saved ? JSON.parse(saved) : [
      { id: 'study', name: 'Studying', icon: '📚', color: '#3B82F6' },
      { id: 'exercise', name: 'Exercise', icon: '💪', color: '#10B981' },
      { id: 'chores', name: 'Chores', icon: '🧹', color: '#8B5CF6' },
    ];
  });

  const [sleepLog, setSleepLog] = useState(() => {
    const saved = localStorage.getItem('perrys_sleep');
    return saved ? JSON.parse(saved) : { bedtime: '23:00', wakeTime: '07:00' };
  });

  // Schedule Import State
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedClasses, setExtractedClasses] = useState([]);
  const [analysisError, setAnalysisError] = useState(null);

  // UI State
  const [selectedTrendCategory, setSelectedTrendCategory] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('7days');
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Check for current class every minute
  useEffect(() => {
    const checkCurrentClass = () => {
      if (!enableClassMode) {
        setCurrentClassSession(null);
        return;
      }

      const now = new Date();
      const dayOfWeek = now.getDay();
      const dayLetters = ['', 'M', 'T', 'W', 'Th', 'F', 'S', 'Su'];
      const currentDay = dayLetters[dayOfWeek === 0 ? 7 : dayOfWeek];
      const currentTime = now.getHours() * 60 + now.getMinutes();

      for (let cls of classes) {
        if (!cls.days || !cls.time) continue;

        const dayPattern = cls.days.toUpperCase();
        let meetsToday = false;

        if (dayPattern.includes('MO') || dayPattern === 'M') meetsToday = currentDay === 'M';
        if (dayPattern.includes('TU') || dayPattern === 'T') meetsToday = currentDay === 'T';
        if (dayPattern.includes('WE') || dayPattern === 'W') meetsToday = currentDay === 'W';
        if (dayPattern.includes('TH') || dayPattern === 'Th') meetsToday = currentDay === 'Th';
        if (dayPattern.includes('FR') || dayPattern === 'F') meetsToday = currentDay === 'F';

        if (!meetsToday) continue;

        const timeMatch = cls.time.match(/(\d{1,2}):(\d{2})\s*(?:am|pm|AM|PM)?\s*-\s*(\d{1,2}):(\d{2})\s*(?:am|pm|AM|PM)?/i);
        if (!timeMatch) continue;

        let startHour = parseInt(timeMatch[1]);
        let startMin = parseInt(timeMatch[2]);
        let endHour = parseInt(timeMatch[3]);
        let endMin = parseInt(timeMatch[4]);

        if (cls.time.toUpperCase().includes('PM')) {
          if (startHour !== 12) startHour += 12;
          if (endHour !== 12) endHour += 12;
        }

        const classStart = startHour * 60 + startMin;
        const classEnd = endHour * 60 + endMin;

        if (currentTime >= classStart - 5 && currentTime < classEnd) {
          setCurrentClassSession({
            id: cls.id,
            name: cls.name,
            startTime: `${String(startHour % 12 || 12).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
            endTime: `${String(endHour % 12 || 12).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`,
            isAM: startHour < 12,
          });
          setShowClassWarning(true);
          return;
        }
      }

      setCurrentClassSession(null);
      setShowClassWarning(false);
    };

    checkCurrentClass();
    const interval = setInterval(checkCurrentClass, 60000);
    return () => clearInterval(interval);
  }, [classes, enableClassMode]);

  // Timer Effect
  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('perrys_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('perrys_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('perrys_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('perrys_sleep', JSON.stringify(sleepLog));
  }, [sleepLog]);

  // Utility Functions
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getWakingHours = () => {
    const [bedHour, bedMin] = sleepLog.bedtime.split(':').map(Number);
    const [wakeHour, wakeMin] = sleepLog.wakeTime.split(':').map(Number);
    let wakingHours = wakeHour + wakeMin / 60 - (bedHour + bedMin / 60);
    if (wakingHours < 0) wakingHours += 24;
    return wakingHours;
  };

  const handleStart = () => {
    if (enableClassMode && currentClassSession && !overrideEnabled) {
      setShowClassWarning(true);
      return;
    }
    setIsRunning(true);
  };

  const handleStop = () => {
    if (elapsedTime > 0) {
      const today = new Date().toISOString().split('T')[0];
      const newActivity = {
        id: Date.now(),
        category: selectedCategory,
        class: selectedCategory === 'study' ? selectedClass : null,
        duration: Math.round(elapsedTime / 60),
        date: today,
        timestamp: new Date().toISOString(),
      };
      setActivities([...activities, newActivity]);
    }
    setIsRunning(false);
    setElapsedTime(0);
  };

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayActivities = activities.filter(a => a.date === today);
    const wakingHours = getWakingHours();
    const totalMinutes = todayActivities.reduce((sum, a) => sum + a.duration, 0);
    const productivityPercent = ((totalMinutes / 60) / wakingHours * 100).toFixed(1);

    const stats = {};
    categories.forEach(cat => {
      const catActivities = todayActivities.filter(a => a.category === cat.id);
      const catMinutes = catActivities.reduce((sum, a) => sum + a.duration, 0);
      stats[cat.id] = { minutes: catMinutes, percent: ((catMinutes / 60) / wakingHours * 100).toFixed(1) };
    });

    const classStats = {};
    todayActivities.filter(a => a.category === 'study' && a.class).forEach(a => {
      if (!classStats[a.class]) classStats[a.class] = 0;
      classStats[a.class] += a.duration;
    });

    const classPercents = {};
    const totalStudyMinutes = stats.study.minutes;
    Object.entries(classStats).forEach(([classId, minutes]) => {
      classPercents[classId] = totalStudyMinutes > 0 ? ((minutes / totalStudyMinutes) * 100).toFixed(1) : 0;
    });

    return { totalMinutes, productivityPercent, stats, classStats, classPercents };
  };

  const getTrendData = () => {
    const days = selectedDateRange === '7days' ? 7 : 30;
    const data = [];
    const wakingHours = getWakingHours();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayActivities = activities.filter(a => a.date === dateStr);
      const point = { date: dateStr.slice(5) };

      const totalMinutes = dayActivities.reduce((sum, a) => sum + a.duration, 0);
      point.Overall = parseFloat(((totalMinutes / 60) / wakingHours * 100).toFixed(1));

      categories.forEach(cat => {
        const catMinutes = dayActivities.filter(a => a.category === cat.id).reduce((sum, a) => sum + a.duration, 0);
        point[cat.name] = parseFloat(((catMinutes / 60) / wakingHours * 100).toFixed(1));
      });

      data.push(point);
    }

    return data;
  };

  const getTodayActivities = () => {
    const today = new Date().toISOString().split('T')[0];
    return activities.filter(a => a.date === today).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const getStreak = () => {
    let streak = 0;
    const threshold = (getWakingHours() * 0.5) * 60;

    for (let i = 0; i < 365; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayActivities = activities.filter(a => a.date === dateStr);
      const totalMinutes = dayActivities.reduce((sum, a) => sum + a.duration, 0);

      if (totalMinutes >= threshold) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const deleteActivity = (id) => {
    setActivities(activities.filter(a => a.id !== id));
  };

  // PAGE COMPONENTS
  const TimerPage = () => {
    const todayStats = getTodayStats();
    const todayActivities = getTodayActivities();
    const currentCategory = categories.find(c => c.id === selectedCategory);
    const isBlockedByClass = enableClassMode && currentClassSession && !overrideEnabled;

    return (
      <div className="pb-24">
        {/* Class Warning Modal */}
        {showClassWarning && currentClassSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
            <div className="bg-white w-full rounded-t-3xl p-6 space-y-4 animate-in slide-in-from-bottom">
              <div className="text-center">
                <div className="text-5xl mb-3">🎓</div>
                <h2 className="text-2xl font-bold text-slate-900">You're in class!</h2>
                <p className="text-lg font-semibold text-slate-700 mt-2">{currentClassSession.name}</p>
                <p className="text-sm text-slate-600">{currentClassSession.startTime} - {currentClassSession.endTime}</p>
              </div>

              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-center">
                <p className="font-semibold text-red-900">Focus on your lecture! 📖</p>
              </div>

              <button
                onClick={() => setShowClassWarning(false)}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg text-lg"
              >
                Got It - Pay Attention
              </button>

              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={overrideEnabled}
                  onChange={(e) => setOverrideEnabled(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <span className="text-sm text-slate-700">I need to track anyway</span>
              </label>

              {overrideEnabled && (
                <button
                  onClick={() => {
                    setShowClassWarning(false);
                    handleStart();
                  }}
                  className="w-full bg-yellow-600 text-white font-bold py-4 rounded-lg text-lg"
                >
                  Track Anyway
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main Timer */}
        <div className={`text-center pt-8 pb-6 px-4 space-y-6 transition ${
          isBlockedByClass 
            ? 'bg-red-900 text-white' 
            : 'bg-gradient-to-b from-slate-900 to-slate-800 text-white'
        }`}>
          {isBlockedByClass && (
            <p className="text-red-200 text-xs font-bold uppercase animate-pulse">
              ⚠️ IN CLASS - TRACKING DISABLED
            </p>
          )}
          
          <p className="text-slate-300 text-sm font-medium uppercase tracking-wide">
            {currentCategory?.name}
          </p>
          {selectedCategory === 'study' && (
            <p className="text-slate-400 text-sm">{classes.find(c => c.id === selectedClass)?.name}</p>
          )}

          {/* BIG Timer */}
          <div className="py-12">
            <div className="text-7xl font-light tabular-nums tracking-tighter" style={{ fontFamily: 'Courier New, monospace' }}>
              {formatTime(elapsedTime)}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3 justify-center px-2">
            {!isRunning ? (
              <button
                onClick={handleStart}
                disabled={isBlockedByClass}
                className={`flex-1 py-4 rounded-xl font-bold text-white text-lg transition ${
                  isBlockedByClass
                    ? 'bg-slate-600 opacity-50'
                    : 'bg-emerald-500 active:scale-95'
                }`}
              >
                <Play className="w-6 h-6 inline mr-2" /> Start
              </button>
            ) : (
              <button
                onClick={() => setIsRunning(false)}
                className="flex-1 bg-amber-500 text-white py-4 rounded-xl font-bold text-lg active:scale-95"
              >
                <Pause className="w-6 h-6 inline mr-2" /> Pause
              </button>
            )}

            <button
              onClick={handleStop}
              disabled={elapsedTime === 0}
              className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 active:scale-95"
            >
              <Zap className="w-6 h-6 inline mr-2" /> Save
            </button>
          </div>
        </div>

        {/* Category Selection */}
        <div className="px-4 pt-6 pb-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase">Activity</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-3 rounded-lg font-medium transition ${
                    selectedCategory === cat.id
                      ? 'text-white shadow-lg'
                      : 'text-slate-600 bg-slate-100'
                  }`}
                  style={selectedCategory === cat.id ? { backgroundColor: cat.color } : {}}
                >
                  <div className="text-2xl">{cat.icon}</div>
                  <div className="text-xs mt-1">{cat.name}</div>
                </button>
              ))}
            </div>
          </div>

          {selectedCategory === 'study' && (
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(parseInt(e.target.value))}
                className="w-full border-2 border-slate-300 rounded-lg p-3 font-medium mt-2 text-lg"
              >
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="px-4 space-y-2">
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-600">
            <p className="text-xs text-slate-500 font-bold uppercase">Today's Productivity</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{todayStats.productivityPercent}%</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-emerald-600">
            <p className="text-xs text-slate-500 font-bold uppercase">Time Logged</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{Math.floor(todayStats.totalMinutes / 60)}h {todayStats.totalMinutes % 60}m</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-purple-600">
            <p className="text-xs text-slate-500 font-bold uppercase">Streak</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">🔥 {getStreak()}</p>
          </div>
        </div>

        {/* Today's Sessions */}
        <div className="px-4 mt-4">
          <h3 className="font-bold text-slate-900 mb-3">Today's Sessions</h3>
          {todayActivities.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No sessions yet</p>
          ) : (
            <div className="space-y-2">
              {todayActivities.map((activity) => {
                const cat = categories.find(c => c.id === activity.category);
                const cls = activity.class ? classes.find(c => c.id === activity.class) : null;
                return (
                  <div key={activity.id} className="bg-white p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-900">{cat?.icon} {cat?.name}</p>
                      {cls && <p className="text-xs text-slate-600">{cls.name}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{activity.duration}m</p>
                      <button
                        onClick={() => deleteActivity(activity.id)}
                        className="text-red-500 text-xs font-bold mt-1"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const AnalyticsPage = () => {
    const todayStats = getTodayStats();
    const trendData = getTrendData();
    const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];

    return (
      <div className="pb-24 px-4 pt-4 space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Analytics</h2>

        {/* Today's Breakdown */}
        <div className="bg-white rounded-xl p-4 space-y-3">
          <h3 className="font-bold text-slate-900">Today's Breakdown</h3>
          {categories.map(cat => {
            const catStat = todayStats.stats[cat.id];
            return (
              <div key={cat.id}>
                <div className="flex justify-between items-center mb-1">
                  <p className="font-semibold text-slate-900">{cat.icon} {cat.name}</p>
                  <p className="font-bold text-slate-900">{catStat.percent}%</p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.min(catStat.percent, 100)}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Study by Class */}
        {todayStats.stats.study.minutes > 0 && (
          <div className="bg-white rounded-xl p-4 space-y-2">
            <h3 className="font-bold text-slate-900">Study Breakdown</h3>
            {Object.entries(todayStats.classStats).map(([classId, minutes]) => {
              const classData = classes.find(c => c.id === parseInt(classId));
              const percent = todayStats.classPercents[classId];
              return (
                <div key={classId} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                  <p className="font-semibold text-slate-900">{classData?.name}</p>
                  <p className="font-bold text-slate-900">{percent}%</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Trend Chart */}
        <div className="bg-white rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-900">Trends</h3>
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="text-xs border border-slate-300 rounded p-1"
            >
              <option value="7days">7 Days</option>
              <option value="30days">30 Days</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <ResponsiveContainer width="100%" height={250} minWidth={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }} />
                <Line type="monotone" dataKey="Overall" stroke={COLORS[0]} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const SettingsPage = () => {
    return (
      <div className="pb-24 px-4 pt-4 space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>

        {/* Focus Mode */}
        <div className="bg-white rounded-xl p-4 space-y-3">
          <h3 className="font-bold text-slate-900">🎓 Focus Mode</h3>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={enableClassMode}
              onChange={(e) => setEnableClassMode(e.target.checked)}
              className="w-5 h-5 rounded"
            />
            <span className="text-slate-700">Disable tracking during class</span>
          </label>
          <p className="text-xs text-slate-600">Automatically blocks timer when you're in class based on your schedule.</p>
        </div>

        {/* Sleep Schedule */}
        <div className="bg-white rounded-xl p-4 space-y-3">
          <h3 className="font-bold text-slate-900">😴 Sleep Schedule</h3>
          <div className="space-y-2">
            <div>
              <label className="text-xs font-bold text-slate-600">Bedtime</label>
              <input
                type="time"
                value={sleepLog.bedtime}
                onChange={(e) => setSleepLog({ ...sleepLog, bedtime: e.target.value })}
                className="w-full border-2 border-slate-300 rounded-lg p-3 mt-1 text-lg"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Wake Time</label>
              <input
                type="time"
                value={sleepLog.wakeTime}
                onChange={(e) => setSleepLog({ ...sleepLog, wakeTime: e.target.value })}
                className="w-full border-2 border-slate-300 rounded-lg p-3 mt-1 text-lg"
              />
            </div>
          </div>
          <p className="text-xs text-slate-600">Waking hours: <strong>{getWakingHours().toFixed(1)}h</strong></p>
        </div>

        {/* Classes */}
        <div className="bg-white rounded-xl p-4 space-y-3">
          <h3 className="font-bold text-slate-900">📚 My Classes</h3>
          <div className="space-y-2">
            {classes.map(cls => (
              <div key={cls.id} className="flex justify-between items-start p-2 bg-slate-50 rounded">
                <div>
                  <p className="font-semibold text-slate-900">{cls.name}</p>
                  {cls.days && <p className="text-xs text-slate-600">{cls.days} {cls.time && `${cls.time}`}</p>}
                </div>
                <button
                  onClick={() => setClasses(classes.filter(c => c.id !== cls.id))}
                  className="text-red-500 font-bold text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              const newClassName = prompt('Class name (e.g., BSCI222):');
              if (newClassName) {
                const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
                setClasses([...classes, {
                  id: Math.max(...classes.map(c => c.id), 0) + 1,
                  name: newClassName,
                  color: colors[classes.length % colors.length],
                }]);
              }
            }}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg text-lg"
          >
            + Add Class
          </button>
        </div>

        {/* Data */}
        <div className="bg-white rounded-xl p-4">
          <h3 className="font-bold text-slate-900 mb-3">📊 Data</h3>
          <button
            onClick={() => {
              const data = { activities, classes, categories, sleepLog };
              const element = document.createElement('a');
              element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2)));
              element.setAttribute('download', 'perrys_data.json');
              element.style.display = 'none';
              document.body.appendChild(element);
              element.click();
              document.body.removeChild(element);
            }}
            className="w-full bg-slate-600 text-white font-bold py-3 rounded-lg text-lg"
          >
            📥 Export Data
          </button>
        </div>
      </div>
    );
  };

  const AboutPage = () => {
    return (
      <div className="pb-24 px-4 pt-4 space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">About Perry's</h2>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white space-y-2">
          <h3 className="text-3xl font-bold">Perry's</h3>
          <p className="text-slate-300">Productivity Tracker</p>
        </div>

        <div className="bg-white rounded-xl p-4 space-y-3">
          <h3 className="font-bold text-slate-900">Built by Paarth Mathur</h3>
          <div className="text-sm text-slate-700 space-y-2">
            <p><strong>🎓</strong> Pre-med student at UMD College Park</p>
            <p><strong>🧠</strong> Neuroscience + Microbiology major</p>
            <p><strong>📍</strong> From Southbury, Connecticut</p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-600">
          <p className="text-sm text-blue-900">
            <strong>Focus Mode</strong> helps you stay attentive in lectures by automatically detecting when you're in class and blocking distractions. Your education comes first.
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 space-y-2">
          <p className="text-xs text-slate-600">Version 3.3 - Mobile Optimized</p>
          <p className="text-xs text-slate-600">Designed for your phone with a clean, touch-friendly interface</p>
        </div>
      </div>
    );
  };

  // MAIN RENDER
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Content */}
      <main>
        {currentPage === 'timer' && <TimerPage />}
        {currentPage === 'analytics' && <AnalyticsPage />}
        {currentPage === 'settings' && <SettingsPage />}
        {currentPage === 'about' && <AboutPage />}
      </main>

      {/* Bottom Navigation - FIXED */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-20">
        <button
          onClick={() => setCurrentPage('timer')}
          className={`flex flex-col items-center gap-1 py-2 px-4 w-full ${
            currentPage === 'timer' ? 'text-blue-600 font-bold' : 'text-slate-600'
          }`}
        >
          <Clock className="w-6 h-6" />
          <span className="text-xs">Timer</span>
        </button>

        <button
          onClick={() => setCurrentPage('analytics')}
          className={`flex flex-col items-center gap-1 py-2 px-4 w-full ${
            currentPage === 'analytics' ? 'text-blue-600 font-bold' : 'text-slate-600'
          }`}
        >
          <TrendingUp className="w-6 h-6" />
          <span className="text-xs">Analytics</span>
        </button>

        <button
          onClick={() => setCurrentPage('settings')}
          className={`flex flex-col items-center gap-1 py-2 px-4 w-full ${
            currentPage === 'settings' ? 'text-blue-600 font-bold' : 'text-slate-600'
          }`}
        >
          <Settings className="w-6 h-6" />
          <span className="text-xs">Settings</span>
        </button>

        <button
          onClick={() => setCurrentPage('about')}
          className={`flex flex-col items-center gap-1 py-2 px-4 w-full ${
            currentPage === 'about' ? 'text-blue-600 font-bold' : 'text-slate-600'
          }`}
        >
          <Info className="w-6 h-6" />
          <span className="text-xs">About</span>
        </button>
      </nav>
    </div>
  );
};

export default PerrysProductivityTracker;
