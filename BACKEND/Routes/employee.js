const express = require("express");
const router = express.Router();
const employeeController = require("../Controllers/employeeController");
const upload = require("../Middlewares/upload");
const authMiddleware = require("../Middlewares/empAuth");

// CREATE with profile image
router.post("/", upload.single("profileImage"), employeeController.createEmployee);

// READ ALL
router.get("/", employeeController.getAllEmployees);

// COUNT employees
router.get("/count/all", employeeController.getEmployeeCount);

// LOGIN
router.post("/login", employeeController.loginEmployee);

// GET LOGGED IN EMPLOYEE
router.get("/me", authMiddleware, employeeController.getMe);

// READ ONE by employee_id
router.get("/:employee_id", employeeController.getEmployeeById);

// UPDATE with profile image
router.put("/:employee_id", upload.single("profileImage"), employeeController.updateEmployee);

// DELETE by employee_id
router.delete("/:employee_id", employeeController.deleteEmployee);

module.exports = router;
