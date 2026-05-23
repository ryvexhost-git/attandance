/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try {
    const record = app.findFirstRecordByData("admins", "email", "admin@attendance.com");
    record.setPassword("password123456");
    return app.save(record);
  } catch (e) {
    console.log("Error updating admin password:", e.message);
  }
}, (app) => {
  // No rollback needed
})
