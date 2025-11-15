'use strict';

/**
 * notification controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::notification.notification', ({ strapi }) => ({
  
  // Driver sends notification
  async sendNotification(ctx) {
    try {
      const { childId, type, message, routeId } = ctx.request.body;

      if (!childId || !type || !message) {
        return ctx.badRequest('childId, type, and message are required');
      }

      // Find the child with populated parent
      const child = await strapi.db.query('api::child.child').findOne({
        where: { id: childId },
        populate: ['parent'],
      });

      console.log('🔍 Child found:', child);
      console.log('🔍 Child parent:', child?.parent);

      if (!child || !child.parent) {
        return ctx.notFound('Child or parent not found');
      }

      // Create notification - FIX: Use the actual parent object
      const notification = await strapi.db.query('api::notification.notification').create({
        data: {
          child: child.id,
          parent: child.parent.id, // This should be the User ID
          route: routeId || null,
          type,
          message,
          timestamp: new Date(),
          notification_status: 'sent',
        },
      });

      console.log('✅ Notification created:', notification);

      return ctx.send({ notification, message: 'Notification sent successfully' });
    } catch (err) {
      console.error('❌ Error in sendNotification:', err);
      return ctx.internalServerError('Failed to send notification');
    }
  },

  // Parent fetches their notifications - FIXED VERSION
  async getNotifications(ctx) {
    try {
      const userId = ctx.state.user.id;
      console.log('👤 Getting notifications for user ID:', userId);

      // FIX: Query only notifications for this user directly in the database
      const userNotifications = await strapi.db.query('api::notification.notification').findMany({
        where: {
          parent: userId
        },
        populate: ['child', 'parent', 'route'],
        orderBy: { timestamp: 'desc' },
      });

      console.log('✅ USER NOTIFICATIONS:', userNotifications.length);
      console.log('📋 Notifications found:', userNotifications);

      return ctx.send({ notifications: userNotifications });
    } catch (err) {
      console.error('❌ Error in getNotifications:', err);
      return ctx.internalServerError('Failed to fetch notifications');
    }
  },

}));