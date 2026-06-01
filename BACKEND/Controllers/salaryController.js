const Salary = require("../Models/Salary");
const Employee = require("../Models/Employee");
const Attendance = require("../Models/Attendance");
const { v4: uuidv4 } = require("uuid");
const PDFDocument = require("pdfkit")
const fs = require("fs");
const path = require("path");
const moment = require("moment");

const standardHours = 8;      
const epfRate = 0.08;         
const otRate = 1.5;         

function shortId() {
  return Math.random().toString(36).substr(2, 6).toUpperCase(); 
}

// Generate salaries for a given month/year (or return existing)
exports.getSalaries = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ error: "Month and year are required" });

    const monthNames = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];

    const monthIndex = monthNames.findIndex(m => m.toLowerCase() === month.toLowerCase());
    if (monthIndex === -1) return res.status(400).json({ error: "Invalid month name" });

    const employees = await Employee.find();
    let salaries = [];

    for (const emp of employees) {
      const existingSalary = await Salary.findOne({
        empId: emp.employee_id,
        month,
        year
      });

      if (existingSalary) {
        salaries.push(existingSalary);
        continue;
      }

      // Attendance for this employee & month
      const attendanceRecords = await Attendance.find({
        empId: emp.employee_id,
        $expr: {
          $and: [
            { $eq: [{ $month: "$date" }, monthIndex + 1] },
            { $eq: [{ $year: "$date" }, parseInt(year)] }
          ]
        }
      });

      let totalWorkingDays = 0;
      let totalWorkedHours = 0;

      attendanceRecords.forEach(rec => {
        if (rec.status === "Present") totalWorkingDays += 1;
        else if (rec.status === "Half Day") totalWorkingDays += 0.5;
        totalWorkedHours += rec.hours;
      });

      if (totalWorkingDays === 0) continue;

      const hourlyRate = emp.basic_salary / totalWorkingDays / standardHours;
      const otHours = Math.max(totalWorkedHours - totalWorkingDays * standardHours, 0);
      const otPay = otHours * hourlyRate * otRate;
      const grossSalary = emp.basic_salary + otPay;
      const epf = emp.basic_salary * epfRate;
      const loan = emp.loan || 0;
      const netSalary = grossSalary - (epf + loan);

      const salaryData = new Salary({
        salaryId: `SAL-${shortId()}`,
        empId: emp.employee_id,
        name: emp.first_name,
        month,
        year,
        basic: Math.round(emp.basic_salary),
        allowance: Math.round(otPay),
        deduction: Math.round(epf + loan),
        net: Math.round(netSalary),
        status: "Pending",
        date: "-"
      });

      await salaryData.save();
      salaries.push(salaryData);
    }

    res.json(salaries);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Fetch all salaries
exports.getAllSalaries = async (req, res) => {
  try {
    const salaries = await Salary.find().sort({ year: -1, month: -1 });
    res.json(salaries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Count pending salaries
exports.countPendingSalaries = async (req, res) => {
  try {
    const pendingCount = await Salary.countDocuments({ status: /pending/i });
    res.json({ pending: pendingCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark salary as Paid
exports.paySalary = async (req, res) => {
  try {
    const { salaryId } = req.params;
    let salary = await Salary.findOne({ salaryId });

    if (!salary) return res.status(404).json({ message: "Salary not found" });

    salary.status = "Paid";
    salary.date = new Date().toISOString().split("T")[0];
    await salary.save();

    res.json(salary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete salary record
exports.deleteSalary = async (req, res) => {
  try {
    const { salaryId } = req.params;
    const deleted = await Salary.findOneAndDelete({ salaryId });

    if (!deleted) return res.status(404).json({ message: "Salary record not found" });

    res.json({ message: "Salary record deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get logged-in employee salaries
exports.getMySalaries = async (req, res) => {
  try {
    const employeeId = req.employeeId; 
    const salaries = await Salary.find({ empId: employeeId }).sort({ year: -1, month: -1 });

    if (!salaries.length) {
      return res.status(404).json({ message: "No salary records found for your account" });
    }

    res.json(salaries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.downloadSalarySlip = async (req, res) => {
  try {
    const { salaryId } = req.params;
    const salary = await Salary.findOne({ salaryId });

    if (!salary) return res.status(404).json({ message: "Salary not found" });

    // Ensure employee can only access their own slip
    if (salary.empId !== req.employeeId) {
      return res.status(403).json({ message: "Not authorized to access this salary slip" });
    }

    // Fetch employee details
    const employee = await Employee.findOne({ employee_id: req.employeeId });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=salary-${salary.salaryId}.pdf`);
    doc.pipe(res);

    // Modern header card
    const headerTop = 30;
    const headerHeight = 90;
    const marginX = 30;
    const cardWidth = doc.page.width - marginX * 2;
    // Dark rounded card
    doc.save();
    doc.roundedRect(marginX, headerTop, cardWidth, headerHeight, 12).fill('#0f172a');
    // Accent bar
    doc.rect(marginX, headerTop, cardWidth, 6).fill('#22c55e');
    doc.restore();

    // Try to draw Green Lion logo (optional) inside a white circle
    let drewLogo = false;
    try {
      const logoCandidates = [
        path.join(__dirname, "..", "assets", "logo1.png"),
        path.join(__dirname, "..", "assets", "logo1.jpg"),
  
      ];
      const logoPath = logoCandidates.find(p => fs.existsSync(p));
      const logoCx = marginX + 60; // circle center X
      const logoCy = headerTop + 50; // circle center Y
      const logoR = 26;
      // white circle backdrop
      doc.save();
      doc.circle(logoCx, logoCy, logoR + 6).fill('#ffffff');
      if (logoPath) {
        doc.image(logoPath, logoCx - logoR, logoCy - logoR, { width: logoR * 2, height: logoR * 2, fit: [logoR * 2, logoR * 2] });
        drewLogo = true;
      }
      doc.restore();
    } catch (_) {
      // ignore
    }

    // Title and subtitle on the right area inside the card
    const textLeft = marginX + 110;
    doc.fillColor('white').fontSize(18).text("Green Lion Business Management System", textLeft, headerTop + 26, { width: cardWidth - 140, align: 'left' });
    doc.fontSize(12).fillColor('#e2e8f0').text("Salary Slip", textLeft, headerTop + 54, { width: cardWidth - 140, align: 'left' });
    doc.fillColor('black');

    // Position content after header card
    doc.y = headerTop + headerHeight + 16;

    // Employer & Employee Info Section
    const fmt = (v) => (Number(v) || 0).toLocaleString('en-IN');
    const infoTop = doc.y;
    doc.rect(50, infoTop, 500, 100).fill('#f8fafc').stroke('#e5e7eb');
    // Employer block (left)
    doc.fillColor('#0f172a').fontSize(12).text('Employer', 60, infoTop + 10);
    doc.fillColor('#334155').fontSize(10).text('Green Lion Pvt Ltd', 60, infoTop + 28);
    doc.text('No. 123, Business Park, Colombo', 60, infoTop + 42);
    doc.text('hotline@greenlion.lk | +94 11 234 5678', 60, infoTop + 56);
    // Employee block (right)
    doc.fillColor('#0f172a').fontSize(12).text('Employee', 330, infoTop + 10);
    doc.fillColor('#334155').fontSize(10).text(`Name: ${employee?.first_name || salary.name} ${employee?.last_name || ''}`, 330, infoTop + 28);
    doc.text(`ID  : ${salary.empId}`, 330, infoTop + 42);
    doc.text(`Dept: ${employee?.department || 'N/A'}`, 330, infoTop + 56);
    doc.text(`Role: ${employee?.job_title || 'N/A'}`, 330, infoTop + 70);
    doc.fillColor('black');

    // Period & slip meta row
    const metaTop = infoTop + 110;
    doc.rect(50, metaTop, 500, 28).fill('#eef2ff').stroke('#e5e7eb');
    doc.fillColor('#111827').fontSize(11).text(`Salary ID: ${salary.salaryId}`, 60, metaTop + 8);
    doc.text(`Period: ${salary.month} ${salary.year}`, 260, metaTop + 8);
    doc.text(`Status: ${salary.status}`, 440, metaTop + 8);
    doc.fillColor('black');

    // Single 3-column table (Description | Earnings | Deductions)
    const tableTop = metaTop + 40;
    const descX = 50, earnX = 350, dedX = 470;
    const descW = 300, earnW = 100, dedW = 80;
    const headerH = 24, rowH = 22;

    // Header row
    doc.rect(descX, tableTop, descW, headerH).fill('#e5e7eb').stroke('#cbd5e1');
    doc.rect(earnX, tableTop, earnW, headerH).fill('#e5e7eb').stroke('#cbd5e1');
    doc.rect(dedX, tableTop, dedW, headerH).fill('#e5e7eb').stroke('#cbd5e1');
    doc.fillColor('#111827').fontSize(11).text('Description', descX + 10, tableTop + 6);
    doc.text('Earnings', earnX + 10, tableTop + 6);
    doc.text('Deductions', dedX + 10, tableTop + 6);
    doc.fillColor('black');

    // Data rows (map available fields)
    let y = tableTop + headerH;
    const earnTotal = (Number(salary.basic) || 0) + (Number(salary.allowance) || 0);
    const dedTotal = (Number(salary.deduction) || 0);

    const rows = [
      { desc: 'Basic Salary', earn: fmt(salary.basic), ded: '' },
      { desc: 'Allowance (OT)', earn: fmt(salary.allowance), ded: '' },
      { desc: 'EPF + Loan', earn: '', ded: fmt(salary.deduction) },
    ];
    rows.forEach(r => {
      doc.rect(descX, y, descW, rowH).stroke('#e5e7eb');
      doc.rect(earnX, y, earnW, rowH).stroke('#e5e7eb');
      doc.rect(dedX, y, dedW, rowH).stroke('#e5e7eb');
      doc.text(r.desc, descX + 10, y + 6);
      if (r.earn) doc.text(`Rs. ${r.earn}`, earnX + 5, y + 6, { width: earnW - 10, align: 'right' });
      if (r.ded) doc.text(`Rs. ${r.ded}`, dedX + 5, y + 6, { width: dedW - 10, align: 'right' });
      y += rowH;
    });

    // Total row
    doc.rect(descX, y, descW, rowH).fill('#f8fafc').stroke('#cbd5e1');
    doc.rect(earnX, y, earnW, rowH).fill('#f8fafc').stroke('#cbd5e1');
    doc.rect(dedX, y, dedW, rowH).fill('#f8fafc').stroke('#cbd5e1');
    doc.fillColor('#111827').text('Total', descX + 10, y + 6);
    doc.text(`Rs. ${fmt(earnTotal)}`, earnX + 5, y + 6, { width: earnW - 10, align: 'right' });
    doc.text(`Rs. ${fmt(dedTotal)}`, dedX + 5, y + 6, { width: dedW - 10, align: 'right' });
    doc.fillColor('black');

    // NET PAY band
    const netBandTop = y + rowH + 12;
    doc.rect(descX, netBandTop, earnW + dedW + descW, 30).fill('#e2f7e9').stroke('#86efac');
    doc.fillColor('#065f46').fontSize(12).text('NET PAY', descX + 10, netBandTop + 8);
    doc.fontSize(14).fillColor('#16a34a').text(`Rs. ${fmt(salary.net)}`, earnX, netBandTop + 6, { width: earnW + dedW, align: 'right' });
    doc.fillColor('black');

    // Payment details block
    const payTop = netBandTop + 40;
    doc.rect(descX, payTop, descW + earnW + dedW, 80).stroke('#e5e7eb');
    doc.fontSize(10).fillColor('#334155');
    doc.text(`Payment Date : ${salary.date ? moment(salary.date).format('DD MMM YYYY') : '-'}`, descX + 10, payTop + 10);
    doc.text(`Bank Name    : ${employee?.bank_name || 'N/A'}`, descX + 10, payTop + 28);
    doc.text(`Bank Account : ${employee?.first_name || salary.name} ${employee?.last_name || ''}`, descX + 10, payTop + 46);
    doc.text(`Account No.  : ${employee?.account_number || 'N/A'}`, descX + 10, payTop + 64);
    doc.fillColor('black');

    // Divider before signatures
    const statusTop = payTop + 90;
    doc.moveTo(50, statusTop).lineTo(550, statusTop).stroke('#e5e7eb');
    doc.moveDown(1);

    // Signature Section
    const sigY = doc.y + 30;
    doc.text("____________________", 80, sigY);
    doc.text("____________________", 350, sigY);
    doc.text("Employee Signature", 95, sigY + 15);
    doc.text("Authorized Signatory", 365, sigY + 15);

    doc.moveDown(4);

    // Footer
    doc.fontSize(9).fillColor("gray").text("This is a system-generated slip. For queries, contact HR.", { align: "center" });

    doc.end();
  } catch (err) {
    console.error("PDF ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get full EPF/ETF report for all employees
exports.getEpfReport = async (req, res) => {
  try {
    // Fetch all employees
    const employees = await Employee.find();

    if (!employees.length) {
      return res.status(404).json({ message: "No employees found" });
    }

    // Build report (one line per employee)
    const report = employees.map((emp) => {
      const basic = emp.basic_salary || 0;
      const epf = Math.round(basic * 0.08); // 8% employee
      const etf = Math.round(basic * 0.12); // 12% employer

      return {
        empId: emp.employee_id,
        name: emp.first_name + " " + (emp.last_name || ""),
        basic,
        epf,
        etf,
      };
    });

    // Totals
    const totalEPF = report.reduce((sum, r) => sum + r.epf, 0);
    const totalETF = report.reduce((sum, r) => sum + r.etf, 0);

    res.json({
      report,
      totals: { totalEPF, totalETF },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};