module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/notifications/send-notification',
      handler: 'notification.sendNotification',
      config: { auth: { scope: ['authenticated'] } },
    },
    {
      method: 'GET',
      path: '/notifications/get-notifications',
      handler: 'notification.getNotifications',
      config: { auth: { scope: ['authenticated'] } },
    },
  ],
};
