// UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { fetchDataFromApi, putDataToApi } from '../api/api';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    childName: '',
    childClass: '',
    childRoll: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      // Fetch additional profile data
      fetchUserProfile(parsedUser.id);
    }
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const response = await fetchDataFromApi(`/users/${userId}?populate=*`);
      setProfile({
        childName: response.childName || '',
        childClass: response.childClass || '',
        childRoll: response.childRoll || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      await putDataToApi(`/users/${user.id}`, {
        childName: profile.childName,
        childClass: profile.childClass,
        childRoll: profile.childRoll
      });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">User Profile</h2>
      <form onSubmit={updateProfile} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Child's Name</label>
          <input
            type="text"
            value={profile.childName}
            onChange={(e) => setProfile({...profile, childName: e.target.value})}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Class</label>
          <input
            type="number"
            value={profile.childClass}
            onChange={(e) => setProfile({...profile, childClass: e.target.value})}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Roll Number</label>
          <input
            type="number"
            value={profile.childRoll}
            onChange={(e) => setProfile({...profile, childRoll: e.target.value})}
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Update Profile
        </button>
      </form>
    </div>
  );
};

export default UserProfile;