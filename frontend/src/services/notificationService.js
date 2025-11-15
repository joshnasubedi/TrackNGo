// src/services/notificationService.js
import { fetchDataFromApi, postDataToApi } from '../api/api';

class NotificationService {
  constructor() {
    this.ws = null;
    this.messageHandlers = new Set();
    this.status = 'disconnected';
  }

  connect() {
    console.log('WebSocket connection would start here');
    this.status = 'connected';
    return true;
  }

  getStatus() {
    return this.status;
  }

  handleMessage(data) {
    this.messageHandlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  onMessage(handler) {
    this.messageHandlers.add(handler);
    return () => this.offMessage(handler);
  }

  offMessage(handler) {
    this.messageHandlers.delete(handler);
  }

  disconnect() {
    console.log('WebSocket disconnected');
    this.messageHandlers.clear();
    this.status = 'disconnected';
  }

async getUserNotifications() {
  try {
    console.log('🔔 === STARTING NOTIFICATION FETCH ===');
    
    const currentParentId = this.getCurrentParentId();
    console.log('👤 Current Parent ID:', currentParentId);
    
    // STEP 1: Fetch notifications
    console.log('🔄 STEP 1: Fetching notifications...');
    const response = await fetchDataFromApi('/notifications/get-notifications');
    
    console.log('📦 RAW API RESPONSE:', response);
    
    // ⭐⭐ FIX: The response is { notifications: [...] } 
    const notifications = response.notifications || [];
    
    console.log(`✅ Found ${notifications.length} notifications from API`);
    
    if (notifications.length === 0) {
      console.log('❌ NO NOTIFICATIONS FOUND IN SYSTEM');
      return [];
    }
    
    // STEP 2: Log notifications
    notifications.forEach((notification, index) => {
      console.log(`📝 NOTIFICATION ${index + 1}:`, {
        id: notification.id,
        message: notification.message,
        type: notification.type,
        timestamp: notification.timestamp,
        status: notification.notification_status,
        child: notification.child?.name || 'Unknown child'
      });
    });
    
    // ⭐⭐ FIX: Return the notifications directly - no need for filtering
    // Your Strapi controller already filters by parent
    console.log(`🎉 FINAL: Returning ${notifications.length} notifications`);
    
    return notifications;

  } catch (error) {
    console.error('❌ CRITICAL ERROR:', error);
    return [];
  }
}

// In notificationService.js - UPDATE the ultraSimpleFilter function:
// async ultraSimpleFilter(allNotifications, parentId) {
//   console.log(`🔧 Dynamic Filter for Parent ${parentId}`);
  
//   try {
//     // Get the actual children for this parent from the database
//     const parentChildren = await fetchDataFromApi(`/children?filters[parent][id][$eq]=${parentId}&fields=id`);
//     const childIdsForParent = parentChildren.data?.map(child => child.id) || [];
    
//     console.log(`📋 Parent ${parentId} has children with IDs:`, childIdsForParent);
    
//     const filtered = allNotifications.filter(notification => {
//       const childId = notification.child?.id;
//       const isMatch = childIdsForParent.includes(parseInt(childId));
      
//       console.log(`🔍 Notification ${notification.id} - Child ID: ${childId} - Match: ${isMatch}`);
      
//       return isMatch;
//     });
    
//     console.log(`✅ Filtered ${filtered.length} notifications for parent ${parentId}`);
//     return filtered;
    
//   } catch (error) {
//     console.error('❌ Error filtering notifications:', error);
//     // Return all notifications if filtering fails
//     return allNotifications;
//   }
// }
// Add this method to your NotificationService class in notificationService.js
async debugFindActualChildIds() {
  try {
    console.log('🔍 === DEBUG: FINDING ACTUAL CHILD IDs ===');
    
    const parents = [1, 2, 3];
    
    for (const parentId of parents) {
      console.log(`\n👤 Checking Parent ${parentId}:`);
      
      // Get children for this parent
      const response = await fetchDataFromApi(
        `/children?filters[parent][id][$eq]=${parentId}&fields=id,name`
      );
      
      const children = response.data || [];
      const childIds = children.map(child => child.id);
      const childNames = children.map(child => child.attributes?.name || 'Unknown');
      
      console.log(`   Parent ${parentId} has ${children.length} children:`);
      children.forEach((child, index) => {
        console.log(`   👶 ${childNames[index]} - ID: ${child.id}`);
      });
      
      console.log(`   📋 Child IDs for mapping: [${childIds.join(', ')}]`);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}
// Add this to your notificationService.js
async debugFindParentChildRelationships() {
  try {
    console.log('🔍 === DEBUG: FINDING PARENT-CHILD RELATIONSHIPS ===');
    
    // Get ALL children to see their structure
    const allChildren = await fetchDataFromApi('/children?populate=*');
    
    console.log('👶 ALL CHILDREN WITH FULL DATA:');
    allChildren.data?.forEach(child => {
      console.log(`📋 CHILD: ${child.name} - ID: ${child.id}`, {
        fullData: child,
        attributes: child.attributes,
        hasParent: !!child.attributes?.parent,
        parentData: child.attributes?.parent
      });
    });
    
    // Check if there's any parent field with different name
    if (allChildren.data && allChildren.data.length > 0) {
      const firstChild = allChildren.data[0];
      console.log('🔍 FIRST CHILD KEYS:', Object.keys(firstChild));
      console.log('🔍 FIRST CHILD ATTRIBUTES KEYS:', firstChild.attributes ? Object.keys(firstChild.attributes) : 'No attributes');
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

//debugg
// Add this to your notificationService.js for debugging
async debugApiResponse() {
  try {
    console.log('🔍 === DEBUGGING API RESPONSE STRUCTURE ===');
    const response = await fetchDataFromApi('/notifications/get-notifications');
    console.log('📦 FULL API RESPONSE:', response);
    console.log('🔍 Response keys:', Object.keys(response));
    console.log('🔍 Response has data?:', !!response.data);
    console.log('🔍 Response has notifications?:', !!response.notifications);
    console.log('🔍 Is array?:', Array.isArray(response));
    
    return response;
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}
  // ✅ FIXED: Proper function syntax
  getCurrentParentId() {
    // ⭐⭐ FIXED: Use actual logged-in user
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.id) {
        console.log(`👤 Using ACTUAL user: ${user.username} (ID: ${user.id})`);
        return user.id;
      }
    } catch (error) {
      console.error('Error getting user from localStorage:', error);
    }
    
    // Fallback - but this should rarely happen
    console.log('⚠️ No user found in localStorage, checking parent-child mapping...');
    
    // Try to find the parent ID based on available notifications
    const parentNames = {
      1: 'kriti_thapa (Ram)',
      2: 'joshna_subedi (Sita)', 
      3: 'pratistha_koirala (Gita)'
    };
    
    // Use parent 1 as default for testing
    const testParentId = 1;
    console.log(`🧪 Using test ID: ${testParentId} (${parentNames[testParentId]})`);
    return testParentId;
  }

  async markAsRead(notificationId) {
    try {
      console.log('📝 Marking notification as read:', notificationId);
      
      const response = await postDataToApi(`/notifications/${notificationId}`, {
        data: {
          notification_status: 'read'
        }
      });
      
      console.log('✅ Notification marked as read:', response);
      return { success: true, data: response.data };
      
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  }

  async sendNotification(notificationData) {
    try {
      console.log('Sending notification:', notificationData);
      return { success: true };
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // ✅ FIXED: Proper function syntax
  async clearAllNotifications() {
    try {
      console.log('🗑️ === STARTING CLEAR ALL NOTIFICATIONS ===');
      
      const currentParentId = this.getCurrentParentId();
      console.log('👤 Clearing notifications for parent:', currentParentId);
      
      // Get current user's notifications using the SAME method as getUserNotifications
      console.log('🔄 Getting user notifications...');
      const userNotifications = await this.getUserNotifications();
      
      console.log(`📋 User has ${userNotifications.length} notifications to clear`);
      
      if (userNotifications.length === 0) {
        console.log('✅ No notifications to clear');
        return { success: true, cleared: 0 };
      }
      
      // Log what we're about to delete
      console.log('🗑️ NOTIFICATIONS TO DELETE:', userNotifications.map(n => ({
        id: n.id,
        message: n.attributes?.message || n.message,
        childId: n.attributes?.child || n.child
      })));
      
      // Delete each notification
      console.log('🗑️ Deleting notifications...');
      let clearedCount = 0;
      
      for (const notification of userNotifications) {
        try {
          console.log(`🗑️ Deleting notification ${notification.id}...`);
          await this.deleteNotification(notification.id);
          clearedCount++;
          console.log(`✅ Successfully deleted notification ${notification.id}`);
        } catch (error) {
          console.error(`❌ Failed to delete notification ${notification.id}:`, error);
          // Continue with next notification even if one fails
        }
      }
      
      console.log(`🎉 CLEAR ALL COMPLETE: ${clearedCount}/${userNotifications.length} deleted`);
      return { 
        success: true, 
        cleared: clearedCount,
        total: userNotifications.length
      };
      
    } catch (error) {
      console.error('❌ CRITICAL ERROR clearing all notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // ✅ FIXED: Proper function syntax
  async deleteNotification(notificationId) {
    try {
      console.log(`🗑️ === DELETING NOTIFICATION ${notificationId} ===`);
      
      // Use the same API method as fetchDataFromApi for consistency
      const token = localStorage.getItem('token');
      console.log('🔑 Using token:', token ? 'Yes' : 'No');
      
      const response = await fetch(`http://localhost:1337/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📡 DELETE Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ DELETE failed: ${response.status} - ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log(`✅ Notification ${notificationId} deleted successfully`);
      return { success: true };
      
    } catch (error) {
      console.error(`❌ Error deleting notification ${notificationId}:`, error);
      throw error;
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;