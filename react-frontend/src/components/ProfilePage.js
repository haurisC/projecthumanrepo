import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

const ProfilePage = () => {
  const { userId } = useParams();
  const [isFollowing, setIsFollowing] = useState(false);// assume unfollowed
  const handleFollowToggle = () => {
    setIsFollowing(prev => !prev);
  };

  return (
    <div className="p-6">
      <div className="h-40 bg-gray-300 mb-6 flex items-center justify-center text-gray-700">
        Cover Photo Placeholder
      </div>
      <div className="flex flex-col items-center gap-4">
        <img
          src="https://via.placeholder.com/100"
          alt="Profile"
          className="rounded-full w-24 h-24"
        />
        <h2 className="text-xl font-semibold">Display Name Placeholder</h2>
        <p className="text-gray-600">Bio Placeholder</p>

        {/* Follow/Unfollow button */}
        <button
          onClick={handleFollowToggle}
          className={`px-4 py-2 rounded ${
            isFollowing ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
          }`}
        >
          {isFollowing ? 'Unfollow' : 'Follow'}
        </button>

        <div className="flex gap-4">
          <span>Followers: --</span>
          <span>Following: --</span>
        </div>
        <p className="text-sm text-gray-500">User ID from URL: {userId}</p>
      </div>
    </div>
  );
};

export default ProfilePage;
