// BACKEND/Controllers/suppliers.controller.js
const { z } = require("zod");
const Supplier = require("../Models/supplier.model");
const User = require("../Models/User");
const SupplierOrder = require("../Models/supplierOrder.model");
const categoryStockCtrl = require("./categoryStock.controller");

// Shared validation (for Supplier doc fields)
const baseSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  contactPerson: z.string().trim().min(2, "Contact person must be at least 2 characters"),
  email: z.string().trim().email("Invalid email"),
  phone: z.string().trim().min(5, "Phone must be at least 5 characters"),
  address: z.string().trim().min(5, "Address must be at least 5 characters"),
  category: z.string().min(1, "Main Category is required"),
  status: z.enum(["Active", "Inactive", "Pending"]).optional(),
});

// GET /suppliers (admin)
async function list(_req, res) {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.json({ ok: true, suppliers });
  } catch (e) {
    console.error("SUPPLIERS LIST error:", e);
    res.status(500).json({ ok: false, message: "Failed to load suppliers" });
  }
}

// POST /suppliers (admin) — create supplier + linked user
async function create(req, res) {
  try {
    console.log("Received supplier creation request body:", req.body); // Debug log
    // validate & normalize
    const body = baseSchema
      .extend({
        username: z.string().trim().min(3, "Username must be at least 3 chars"),
        password: z.string().trim().min(6, "Password must be at least 6 chars"),
      })
      .transform((b) => ({
        ...b,
        email: b.email.toLowerCase().trim(),
        username: b.username.trim(),
      }))
      .parse(req.body);

    // precise duplicate checks (friendlier messages)
    const byUsername = await User.findOne({ username: body.username });
    if (byUsername) {
      return res.status(409).json({ ok: false, message: "Username already exists" });
    }

    const byEmail = await User.findOne({ email: body.email });
    if (byEmail) {
      return res.status(409).json({ ok: false, message: "Email already exists" });
    }

    // create login user (role: supplier). Password should be hashed by the User pre-save hook.
    const user = await User.create({
      username: body.username,
      name: body.name,
      email: body.email,
      phone: body.phone,
      password: body.password,
      role: "supplier",
    });

    // create supplier profile
    const supplier = await Supplier.create({
      user: user._id,
      name: body.name,
      contactPerson: body.contactPerson,
      email: body.email,
      phone: body.phone,
      address: body.address,
      category: body.category,
      status: body.status || "Active",
    });

    res.status(201).json({
      ok: true,
      supplier,
      user: { id: user._id, username: user.username, email: user.email, role: user.role },
    });
  } catch (e) {
    // Mongo duplicate safety (race conditions)
    if (e && e.code === 11000) {
      const field = Object.keys(e.keyPattern || {})[0] || "Field";
      const msg = field === "username" ? "Username already exists" :
                  field === "email"    ? "Email already exists"    :
                  "Duplicate value";
      return res.status(409).json({ ok: false, message: msg });
    }

    // zod validation or other error
    const msg = e?.issues?.[0]?.message || e.message || "Failed to save supplier";
    const status = e?.issues ? 400 : 500; // 400 for validation, 500 otherwise
    console.error("SUPPLIER CREATE error:", e);
    res.status(status).json({ ok: false, message: msg });
  }
}

// PATCH /suppliers/:id (admin) — update supplier (NOT the user account)
async function update(req, res) {
  try {
    const supplierId = req.params.id;

    // allow partial updates, still validate types
    const payload = baseSchema.partial().transform((b) => ({
      ...b,
      email: b.email ? b.email.toLowerCase().trim() : undefined,
    })).parse(req.body);

    const supplier = await Supplier.findByIdAndUpdate(
      supplierId,
      payload,
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({ ok: false, message: "Supplier not found" });
    }

    res.json({ ok: true, supplier });
  } catch (e) {
    console.error("SUPPLIER UPDATE error:", e);
    const msg = e?.issues?.[0]?.message || e.message || "Update failed";
    const status = e?.issues ? 400 : 500;
    res.status(status).json({ ok: false, message: msg });
  }
}

// DELETE /suppliers/:id (admin)
async function remove(req, res) {
  try {
    const supplierId = req.params.id;
    const supplier = await Supplier.findByIdAndDelete(supplierId);
    if (!supplier) {
      return res.status(404).json({ ok: false, message: "Supplier not found" });
    }

    // Optional: also disable/delete the linked User account.
    // If you prefer to delete the user:
    // await User.findByIdAndDelete(supplier.user);
    // Or to just deactivate:
    // await User.findByIdAndUpdate(supplier.user, { status: "inactive" });

    res.json({ ok: true, message: "Supplier deleted" });
  } catch (e) {
    console.error("SUPPLIER DELETE error:", e);
    res.status(500).json({ ok: false, message: "Delete failed" });
  }
}

// GET /suppliers/orders (admin) — list all supplier orders
async function listAllOrders(_req, res) {
  try {
    const orders = await SupplierOrder.find()
      .populate({ path: "supplier", select: "name email phone category status" })
      .sort({ createdAt: -1 });

    res.json({ ok: true, orders });
  } catch (e) {
    console.error("SUPPLIER ORDERS LIST error:", e);
    res.status(500).json({ ok: false, message: "Failed to load orders" });
  }
}

// PATCH /suppliers/orders/:id/status (admin)
async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body; // "new" | "confirmed" | "rejected" | "supplier_accepted" | "delivered" | "completed"

    if (!["new", "confirmed", "rejected", "supplier_accepted", "delivered", "completed"].includes(status)) {
      return res.status(400).json({ ok: false, message: "Invalid status" });
    }

    const updateData = { status };
    
    // If rejecting, include rejection reason
    if (status === "rejected" && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const order = await SupplierOrder.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate({ path: "supplier", select: "name email phone contactPerson address category" });

    if (!order) {
      return res.status(404).json({ ok: false, message: "Order not found" });
    }

    // If status changed to "completed", automatically increase category stock
    if (status === "completed" && order.category && order.amount) {
      console.log(`Order ${order.orderId} confirmed. Updating category stock...`);
      const stockUpdated = await categoryStockCtrl.increaseStockFromOrder(
        order,
        order.category,
        order.amount
      );
      
      if (stockUpdated) {
        console.log(`✅ Stock updated for category ${order.category}: +${order.amount}`);
      } else {
        console.warn(`⚠️ Failed to update stock for category ${order.category}`);
      }
    }

    res.json({ ok: true, order });
  } catch (e) {
    console.error("SUPPLIER ORDER STATUS error:", e);
    res.status(500).json({ ok: false, message: "Failed to update order status" });
  }
}

module.exports = {
  list,
  create,
  update,
  remove,
  listAllOrders,
  updateOrderStatus,
};