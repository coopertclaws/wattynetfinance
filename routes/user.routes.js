module.exports = router => {
    const users = require("../controllers/user.controller.js");
   
    // Retrieve all Users
    router.get("/users", users.findAll);
  
    // Retrieve a single User with userId
    router.get("/users/:userId", users.findOne);

  };