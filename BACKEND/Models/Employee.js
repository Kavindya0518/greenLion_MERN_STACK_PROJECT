const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  employee_id: { type: String, required: true, unique: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  dob: { type: Date },
  phone: { type: String },
  job_title: { type: String, required: true },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /.+\@.+\..+/,
  },
  address: { type: String },
  status: { type: String, default: "Active" },
  department: { type: String },
  account_number: { type: String },
  hire_date: { type: Date },
  emergency_contact: { type: String },
  basic_salary: { type: Number, required: true },
  password: { type: String, required: true }, 
  profileImage: { type: String ,default: "https://www.google.com/imgres?q=transparent%20profile%20icon&imgurl=https%3A%2F%2Fimages.rawpixel.com%2Fimage_png_800%2FcHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTAxL3JtNjA5LXNvbGlkaWNvbi13LTAwMi1wLnBuZw.png&imgrefurl=https%3A%2F%2Fwww.rawpixel.com%2Fsearch%2Fprofile%2520icon&docid=-QpGQOw4ca8j3M&tbnid=pKpenKglHKtPuM&vet=12ahUKEwjy3-6q9-yPAxVub_UHHYZ1AAEQM3oECCcQAA..i&w=800&h=800&hcb=2&ved=2ahUKEwjy3-6q9-yPAxVub_UHHYZ1AAEQM3oECCcQAA" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Employee", employeeSchema);
