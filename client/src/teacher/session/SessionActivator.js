import React, { useState, useEffect } from 'react';
import {
  Play,
  Square,
  MapPin,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  Radio,
  BookOpen
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

/**
 * Session Activator Component
 * 
 * Allows teachers to start/end class sessions.
 * This maps the physical beacon (room) to the current class.
 */
const SessionActivator = ({ onSessionChange }) => {
  const [rooms, setRooms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  // Update session duration every second
  useEffect(() => {
    let interval;
    if (activeSession) {
      interval = setInterval(() => {
        const start = new Date(activeSession.startedAt);
        const now = new Date();
        setSessionDuration(Math.floor((now - start) / 1000 / 60));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomsRes, classesRes, todayRes] = await Promise.all([
        axios.get('/api/sessions/rooms'),
        axios.get('/api/sessions/classes'),
        axios.get('/api/sessions/today')
      ]);

      // Handle Supabase response format (snake_case)
      const roomsData = roomsRes.data.rooms || [];
      setRooms(roomsData.map(r => ({
        ...r,
        roomId: r.room_id || r.roomId,
        beaconConfig: { minor: r.beacon_minor, major: r.beacon_major }
      })));
      
      const classesData = classesRes.data.classes || classesRes.data || [];
      setClasses(classesData.map(c => ({
        ...c,
        classId: c.class_id || c.classId
      })));
      
      // Check if there's an active session
      const todaySessions = todayRes.data.sessions || [];
      const active = todaySessions.find(s => s.status === 'active');
      if (active) {
        setActiveSession({
          ...active,
          sessionId: active.id || active.sessionId,
          className: active.class_name || active.className,
          roomId: active.room_id || active.roomId,
          startedAt: active.actual_start || active.startedAt
        });
      }
    } catch (error) {
      // Don't show error for canceled requests (happens when navigating away)
      if (error.code !== 'ERR_CANCELED') {
        console.error('Failed to fetch session data:', error);
        toast.error('Failed to load session data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async () => {
    if (!selectedRoom || !selectedClass) {
      toast.error('Please select both room and class');
      return;
    }

    try {
      setStarting(true);
      const response = await axios.post('/api/sessions/start', {
        roomId: selectedRoom,
        classId: selectedClass
      });

      setActiveSession(response.data.session);
      setSelectedRoom('');
      setSelectedClass('');
      toast.success(`Class started in ${response.data.session.roomName}`);
      
      if (onSessionChange) {
        onSessionChange(response.data.session);
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to start session';
      toast.error(message);
      
      // If room already has active session, show details
      if (error.response?.data?.activeSession) {
        const existing = error.response.data.activeSession;
        toast.error(`Room is in use: ${existing.className} by ${existing.teacherName}`, {
          duration: 5000
        });
      }
    } finally {
      setStarting(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;

    try {
      setEnding(true);
      const response = await axios.post('/api/sessions/end', {
        sessionId: activeSession.sessionId || activeSession._id
      });

      toast.success(
        `Class ended. ${response.data.session.stats.confirmedCount} students confirmed.`,
        { duration: 5000 }
      );
      
      setActiveSession(null);
      setSessionDuration(0);
      
      if (onSessionChange) {
        onSessionChange(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to end session');
    } finally {
      setEnding(false);
    }
  };

  const formatDuration = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins} min`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Radio className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Session Activator</h3>
            <p className="text-indigo-100 text-sm">Start or end your class session</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {activeSession ? (
          /* Active Session View */
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 font-semibold">Class in Progress</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900">{activeSession.className}</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">Room: {activeSession.roomId}</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">Duration: {formatDuration(sessionDuration)}</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">
                    Started at {new Date(activeSession.startedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleEndSession}
              disabled={ending}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Square className="h-5 w-5" />
              )}
              <span>{ending ? 'Ending...' : 'End Class'}</span>
            </button>
          </div>
        ) : (
          /* Start Session View */
          <div className="space-y-4">
            {rooms.length === 0 ? (
              <div className="text-center py-6">
                <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">No rooms configured</p>
                <p className="text-sm text-gray-500">
                  Ask admin to add rooms with beacon configuration
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Room
                  </label>
                  <select
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  >
                    <option value="">Choose a room...</option>
                    {rooms.map((room) => (
                      <option key={room.roomId || room.room_id} value={room.roomId || room.room_id}>
                        {room.name} (Beacon: {room.beaconConfig?.minor || room.beacon_minor})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Class
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  >
                    <option value="">Choose a class...</option>
                    {classes.map((cls) => (
                      <option key={cls.classId || cls.class_id || cls.id} value={cls.classId || cls.class_id}>
                        {cls.name} {cls.subject ? `(${cls.subject})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleStartSession}
                  disabled={starting || !selectedRoom || !selectedClass}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {starting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                  <span>{starting ? 'Starting...' : 'Start Class'}</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionActivator;
