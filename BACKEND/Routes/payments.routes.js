const express = require("express");
const { auth, allowRoles } = require("../Middlewares/auth");
const ctrl = require("../Controllers/payment.controller");

const r = express.Router();

// ----- ADMIN FIRST -----
r.get("/admin/all",                 auth, allowRoles("admin"), ctrl.getAllPayments);
r.get("/admin/stats",               auth, allowRoles("admin"), ctrl.getPaymentStats);
r.get("/admin/:paymentId/bank-slip",auth, allowRoles("admin"), ctrl.getBankSlipImage);
r.put("/admin/:paymentId/approve",  auth, allowRoles("admin"), ctrl.approvePayment);
r.put("/admin/:paymentId/reject",   auth, allowRoles("admin"), ctrl.rejectPayment);

// ----- CUSTOMER -----
r.get("/",                    auth, ctrl.getUserPayments);
r.get("/:paymentId",          auth, ctrl.getPaymentDetails);
r.put("/:paymentId/resubmit", auth, ctrl.resubmitPayment);

module.exports = r;
