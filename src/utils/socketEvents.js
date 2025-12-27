module.exports = {
  // Client emits
  CLIENT: {
    JOIN_RESTAURANT: 'join_restaurant',
    LEAVE_RESTAURANT: 'leave_restaurant',
    LOCK_TABLE: 'lock_table',
    RELEASE_TABLE: 'release_table',
    PING: 'ping',
  },

  // Server emits
  SERVER: {
    TABLE_LOCKED: 'table_locked',
    TABLE_RELEASED: 'table_released',
    RESERVATION_UPDATE: 'reservation_update',
    TABLE_STATUS: 'table_status',
    LOCK_CONFIRMED: 'lock_confirmed',
    LOCK_ERROR: 'lock_error',
    PONG: 'pong',
  },

  // Room prefixes
  ROOMS: {
    RESTAURANT: id => `restaurant:${id}`,
    USER: id => `user:${id}`,
  },
};
