"use client";

import { useAuth } from '@/contexts/auth-context';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
          
          {user && (
            <div className="space-y-4">
              <div>
                <span className="font-medium">Name:</span> {user.display_name}
              </div>
              <div>
                <span className="font-medium">Email:</span> {user.email}
              </div>
              {user.avatar_url && (
                <div>
                  <span className="font-medium">Avatar:</span>
                  <img 
                    src={user.avatar_url} 
                    alt="Profile" 
                    className="mt-2 w-20 h-20 rounded-full"
                  />
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={signOut}
            className="mt-6 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Sign Out
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}