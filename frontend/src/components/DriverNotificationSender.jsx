import React, { useState, useEffect } from 'react';
import { fetchDataFromApi, postDataToApi } from '../api/api';

const DriverNotificationSender = () => {
  const [selectedChild, setSelectedChild] = useState('');
  const [notificationType, setNotificationType] = useState('pickup');
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState([]);
  const [customMessage, setCustomMessage] = useState('');

  // Fetch children
  useEffect(() => {
    const fetchRouteChildren = async () => {
      try {
        const response = await fetchDataFromApi('/children?populate=parent');
        setChildren(response.data || []);
        console.log('👶 ALL CHILDREN:', response.data);
        
        // Log each child with their ID
        if (response.data) {
          response.data.forEach(child => {
            console.log(`📋 CHILD: ${child.attributes?.name || child.name} - ID: ${child.id}`);
          });
        }
      } catch (error) {
        console.error('Error fetching children:', error);
      }
    };
    fetchRouteChildren();
  }, []);

  const sendNotification = async () => {
  if (!selectedChild) {
    alert('Please select a child');
    return;
  }

  setLoading(true);
  try {
    const child = children.find(c => c.id === parseInt(selectedChild));
    if (!child) {
      alert('Child not found');
      return;
    }

    const childName = child.attributes?.name || child.name;
    const childId = child.id;

    // ✅ Get the parent ID from the populated data
    const parentId = child.attributes?.parent?.data?.id;
    if (!parentId) {
      alert(`No parent found for ${childName}`);
      return;
    }

    console.log(`🚨 Sending notification for ${childName} to parent ${parentId}`);

    const message = customMessage || getDefaultMessage(childName, notificationType);

    // ✅ Include parent ID in notification data
    const notificationData = {
      data: {
        child: childId,
        parent: parentId,  // 🎯 THIS IS THE KEY CHANGE
        type: notificationType,
        message: message,
        timestamp: new Date().toISOString(),
        notification_status: 'sent',
      },
    };

    console.log('📤 Sending notification data:', notificationData);
    const response = await postDataToApi('/notifications', notificationData);
    console.log('✅ API response:', response);

    alert(`✅ Notification sent for ${childName} to parent ${parentId}!`);

    setSelectedChild('');
    setCustomMessage('');
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    alert('Failed to send notification: ' + error.message);
  } finally {
    setLoading(false);
  }
};


  const getDefaultMessage = (childName, type) => {
    const messages = {
      pickup: `Your child ${childName} has been picked up from school`,
      dropoff: `Your child ${childName} has been dropped off at school`, 
      delay: `Bus delayed for ${childName}. 15 min late`,
      emergency: `Emergency alert for ${childName}`,
      default: `Notification for ${childName}`
    };
    
    return messages[type] || messages.default;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Send Notification to Parents</h3>
      
      
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Child
          </label>
          <select
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a child</option>
            {children.map(child => {
              const childName = child.attributes?.name || child.name;
              const childGrade = child.attributes?.grade || child.grade;
              
              return (
                <option key={child.id} value={child.id}>
                  {childName} - {childGrade} 
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notification Type
          </label>
          <select
            value={notificationType}
            onChange={(e) => {
              setNotificationType(e.target.value);
              setCustomMessage('');
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pickup">Picked Up</option>
            <option value="dropoff">Dropped Off</option>
            <option value="delay">Delayed</option>
            <option value="emergency">Emergency</option>
            <option value="custom">Custom Message</option>
          </select>
        </div>

        {notificationType === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Message
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter custom message..."
              rows="3"
            />
          </div>
        )}

        <button
          onClick={sendNotification}
          disabled={!selectedChild || loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Sending...' : 'Send Notification'}
        </button>

       
      </div>
    </div>
  );
};

export default DriverNotificationSender;