# Socket.IO & Real-time Features

## Overview
Socket.IO enables real-time, bidirectional communication between web clients and servers, perfect for implementing interactive features in our fitness app.

## Features Used in Our Fitness App
- **Live Workout Sharing**: Share workout progress in real-time with friends or trainers
- **Group Challenges**: Real-time updates during group fitness challenges
- **Live Leaderboards**: Dynamic leaderboards that update as users complete activities
- **Workout Partner Matching**: Find and connect with active workout partners nearby
- **Trainer-Client Communication**: Real-time messaging between trainers and clients
- **Workout Notifications**: Instant notifications for workout milestones and achievements

## Implementation Examples

### Live Workout Session
```tsx
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function LiveWorkoutSession({ sessionId, userId }) {
  const [socket, setSocket] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [workoutProgress, setWorkoutProgress] = useState({});
  
  useEffect(() => {
    const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL}/workout-sessions`, {
      query: { sessionId, userId }
    });
    
    newSocket.on('connect', () => {
      console.log('Connected to workout session');
      newSocket.emit('join-session', { sessionId, userId });
    });
    
    newSocket.on('participant-joined', (participant) => {
      setParticipants(prev => [...prev, participant]);
    });
    
    newSocket.on('participant-left', (participantId) => {
      setParticipants(prev => prev.filter(p => p.id !== participantId));
    });
    
    newSocket.on('workout-progress-update', (progress) => {
      setWorkoutProgress(prev => ({
        ...prev,
        [progress.userId]: progress.data
      }));
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.disconnect();
    };
  }, [sessionId, userId]);
  
  const updateMyProgress = (progressData) => {
    if (socket) {
      socket.emit('update-progress', {
        sessionId,
        userId,
        data: progressData
      });
    }
  };
  
  return (
    <div>
      <h2>Live Workout Session</h2>
      <div className="participants">
        <h3>Participants ({participants.length})</h3>
        {participants.map(p => (
          <ParticipantCard 
            key={p.id} 
            participant={p}
            progress={workoutProgress[p.id]}
          />
        ))}
      </div>
      <WorkoutTracker onProgressUpdate={updateMyProgress} />
    </div>
  );
}
```

### Real-time Group Challenge
```tsx
function GroupChallenge({ challengeId, userId }) {
  const [socket, setSocket] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [challengeStatus, setChallengeStatus] = useState({});
  
  useEffect(() => {
    const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL}/challenges`);
    
    newSocket.on('connect', () => {
      newSocket.emit('join-challenge', { challengeId, userId });
    });
    
    newSocket.on('leaderboard-update', (data) => {
      setLeaderboard(data.leaderboard);
    });
    
    newSocket.on('challenge-status-update', (status) => {
      setChallengeStatus(status);
    });
    
    newSocket.on('achievement-unlocked', (achievement) => {
      showAchievementNotification(achievement);
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.disconnect();
    };
  }, [challengeId, userId]);
  
  const submitProgress = (activityData) => {
    if (socket) {
      socket.emit('submit-activity', {
        challengeId,
        userId,
        activity: activityData
      });
    }
  };
  
  return (
    <div>
      <ChallengeHeader status={challengeStatus} />
      <Leaderboard data={leaderboard} currentUserId={userId} />
      <ActivityForm onSubmit={submitProgress} />
    </div>
  );
}
```

### Real-time Trainer Feedback
```tsx
function TrainerFeedbackSession({ sessionId, isTrainer, clientId, trainerId }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [exerciseForm, setExerciseForm] = useState({});
  
  useEffect(() => {
    const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL}/training`);
    const role = isTrainer ? 'trainer' : 'client';
    
    newSocket.on('connect', () => {
      newSocket.emit('join-session', { 
        sessionId, 
        userId: isTrainer ? trainerId : clientId,
        role
      });
    });
    
    newSocket.on('form-correction', (correction) => {
      setExerciseForm(correction);
      // Show correction indicators on exercise visualization
    });
    
    newSocket.on('message', (message) => {
      setMessages(prev => [...prev, message]);
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.disconnect();
    };
  }, [sessionId, isTrainer, clientId, trainerId]);
  
  const sendFormFeedback = (formData) => {
    if (socket && isTrainer) {
      socket.emit('send-form-correction', {
        sessionId,
        formData
      });
    }
  };
  
  const sendMessage = (text) => {
    if (socket) {
      const sender = isTrainer ? trainerId : clientId;
      socket.emit('send-message', {
        sessionId,
        senderId: sender,
        text
      });
    }
  };
  
  return (
    <div className="training-session">
      <ExerciseVisualization 
        formData={exerciseForm}
        onFormChange={isTrainer ? sendFormFeedback : undefined}
      />
      <ChatWindow 
        messages={messages} 
        onSendMessage={sendMessage}
      />
    </div>
  );
}
```

## Backend Integration
- Django Channels setup for WebSocket handling
- Authentication and authorization for secure connections
- Message queuing for handling offline connections
- Scaling considerations for multiple concurrent sessions