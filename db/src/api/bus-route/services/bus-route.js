'use strict';

/**
 * bus-route service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::bus-route.bus-route');
