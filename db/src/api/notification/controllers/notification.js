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

      // Find the child
      const child = await strapi.db.query('api::child.child').findOne({
        where: { id: childId },
        populate: ['parent'],
      });

      if (!child || !child.parent) {
        return ctx.notFound('Child or parent not found');
      }

      // Create notification
      const notification = await strapi.db.query('api::notification.notification').create({
        data: {
          child: child.id,
          parent: child.parent.id,
          route: routeId || null,
          type,
          message,
          timestamp: new Date(),
          notification_status: 'sent',
        },
      });

      return ctx.send({ notification, message: 'Notification sent successfully' });
    } catch (err) {
      console.error(err);
      return ctx.internalServerError('Failed to send notification');
    }
  },

  // Parent fetches their child's notifications
  async getNotifications(ctx) {
    try {
      const userId = ctx.state.user.id;

      const notifications = await strapi.db.query('api::notification.notification').findMany({
        where: { parent: userId },
        populate: ['child', 'route'],
        orderBy: { timestamp: 'desc' },
      });

      return ctx.send({ notifications });
    } catch (err) {
      console.error(err);
      return ctx.internalServerError('Failed to fetch notifications');
    }
  },

}));
