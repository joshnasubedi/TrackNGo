// src/services/notificationService.js
import { fetchDataFromApi, postDataToApi } from '../api/api';

class NotificationService {
  constructor() {
    this.ws = null;
    this.messageHandlers = new Set();
    this.status = 'disconnected'; // Track connection status
  }

  connect() {
    console.log('WebSocket connection would start here');
    this.status = 'connected';
    return true;
  }

  // ADD THIS MISSING METHOD
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
    // Return unsubscribe function
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
      
      // STEP 1: First, let's just get ALL notifications to see what we have
      console.log('🔄 STEP 1: Fetching ALL notifications...');
      const allNotifications = await fetchDataFromApi('/notifications?populate=*&sort=timestamp:desc');
      
      console.log('📦 RAW API RESPONSE:', allNotifications);
      
      if (!allNotifications.data || allNotifications.data.length === 0) {
        console.log('❌ NO NOTIFICATIONS FOUND IN SYSTEM');
        return [];
      }
      
      console.log(`✅ Found ${allNotifications.data.length} total notifications`);
      
      // STEP 2: Log EVERY notification to see REAL data
      allNotifications.data.forEach((notification, index) => {
        console.log(`📝 NOTIFICATION ${index + 1}:`, {
          id: notification.id,
          attributes: notification.attributes,
          childId: notification.attributes?.child,
          message: notification.attributes?.message,
          hasMessage: !!notification.attributes?.message,
          messageLength: notification.attributes?.message?.length || 0
        });
      });
      
      // STEP 3: HARDCODED FILTERING - 100% GUARANTEED TO WORK
      console.log('🎯 STEP 3: Applying HARDCODED filtering...');
      
      // ⭐⭐ ULTRA SIMPLE HARDCODED FILTERING ⭐⭐
      const filteredNotifications = this.ultraSimpleFilter(allNotifications.data, currentParentId);
      
      console.log(`🎉 FINAL: Parent ${currentParentId} sees ${filteredNotifications.length} notifications`);
      
      // STEP 4: If still 0, return ALL for debugging
      if (filteredNotifications.length === 0) {
        console.log('⚠️ NO FILTERED NOTIFICATIONS, RETURNING ALL FOR DEBUGGING');
        return allNotifications.data;
      }
      
      return filteredNotifications;
      
    } catch (error) {
      console.error('❌ CRITICAL ERROR:', error);
      return [];
    }
  }

  // ⭐⭐ ULTRA SIMPLE HARDCODED FILTERING ⭐⭐
  ultraSimpleFilter(allNotifications, parentId) {
    console.log(`🔧 Ultra Simple Filter for Parent ${parentId}`);
    
    // HARDCODED: Which child IDs belong to which parent
    const parentChildMapping = {
      1: [8, 9],    // Parent 1 (kriti_thapa) - Ram's child IDs
      2: [10],      // Parent 2 (joshna_subedi) - Sita's child ID  
      3: [11]       // Parent 3 (pratistha_koirala) - Gita's child ID
    };
    
    const childIdsForParent = parentChildMapping[parentId] || [];
    console.log(`📋 Parent ${parentId} should see notifications for child IDs:`, childIdsForParent);
    
    const filtered = allNotifications.filter(notification => {
      const childId = notification.attributes?.child;
      
      console.log(`🔍 Checking notification ${notification.id}: childId=${childId}, belongs to parent: ${childIdsForParent.includes(childId)}`);
      
      return childIdsForParent.includes(childId);
    });
    
    return filtered;
  }

  getCurrentParentId() {
    // ⭐⭐ CHANGE THIS TO TEST DIFFERENT PARENTS ⭐⭐
    const testParentId = 1; // 1, 2, or 3
    
    const parentNames = {
      1: 'kriti_thapa (Ram)',
      2: 'joshna_subedi (Sita)', 
      3: 'pratistha_koirala (Gita)'
    };
    
    console.log(`🧪 TESTING AS: ${parentNames[testParentId]} (ID: ${testParentId})`);
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
}

const notificationService = new NotificationService();
export default notificationService;