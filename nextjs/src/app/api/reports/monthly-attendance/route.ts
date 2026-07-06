import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth";
import PDFDocument from "pdfkit";
import { calculateAggregates } from "@/lib/attendance";


export async function GET(req: NextRequest) {
  const { user, response } = await checkAuth(req, ["ADMIN", "MANAGER", "EMPLOYEE"]);
  if (response) return response;

  try {
    const searchParams = req.nextUrl.searchParams;
    const employeeId = searchParams.get("employeeId");
    const monthStr = searchParams.get("month");
    const yearStr = searchParams.get("year");

    if (!employeeId || !monthStr || !yearStr) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const month = parseInt(monthStr);
    const year = parseInt(yearStr);

    const employee = await prisma.users.findUnique({
      where: { id: employeeId },
      include: { clients: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Determine start and end date of the month
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    const daysInMonth = end.getUTCDate();

    // Fetch timesheet logs
    const logs = await prisma.timesheets.findMany({
      where: {
        user_id: employeeId,
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        attendance_sessions: {
          orderBy: { clock_in: "asc" },
        },
      },
    });

    // Fetch active holidays
    const activeHolidays = await prisma.holidays.findMany({
      where: { is_active: true },
    });

    // Map holidays
    const holidayMap = new Map();
    activeHolidays.forEach((h) => {
      holidayMap.set(h.holiday_date.toISOString().split("T")[0], h.holiday_name);
    });

    // Fetch employee approved leaves
    const leaves = await prisma.leaves.findMany({
      where: {
        user_id: employeeId,
        start_date: { lte: end },
        end_date: { gte: start },
      },
    });

    // Map logs
    const logMap = new Map();
    logs.forEach((l) => {
      const dateKey = l.date.toISOString().split("T")[0];
      if (!logMap.has(dateKey)) {
        logMap.set(dateKey, []);
      }
      logMap.get(dateKey).push(l);
    });

    // Generate PDF using pdfkit
    const doc = new PDFDocument({ size: "A4", margin: 30 });

    // Convert PDFDocument stream to Buffer
    const chunks: any[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));

    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
    });

    // Draw header
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Vergil Remnant Consultant Services Pvt Ltd", 30, 30);
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#777777")
      .text("Vergil Tempo Workforce Time Management System", 30, 50);

    // Section title
    doc.fontSize(12).font("Helvetica-Bold").fillColor("#FF7A00").text("MONTHLY EMPLOYEE ATTENDANCE REPORT", 30, 80);

    // Metadata panel
    const monthLabel = start.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    const clientCompany = employee.clients ? employee.clients.name : "N/A";

    doc.fontSize(9).font("Helvetica-Bold").fillColor("#111111");
    doc.text(`Month/Year: `, 30, 105, { continued: true }).font("Helvetica").text(monthLabel);
    doc.font("Helvetica-Bold").text(`Employee Name: `, 30, 120, { continued: true }).font("Helvetica").text(employee.name);

    doc.font("Helvetica-Bold").text(`Client Company: `, 300, 105, { continued: true }).font("Helvetica").text(clientCompany);
    doc.font("Helvetica-Bold").text(`Generated Date: `, 300, 120, { continued: true }).font("Helvetica").text(new Date().toISOString().split("T")[0]);

    // Table Headers configuration
    const tableTop = 150;
    const columns = [
      { label: "Date", width: 55, align: "center" },
      { label: "Day", width: 60, align: "center" },
      { label: "Log In", width: 45, align: "center" },
      { label: "Log Out", width: 45, align: "center" },
      { label: "Hours", width: 45, align: "center" },
      { label: "Employee Name", width: 120, align: "left" },
      { label: "Client Company", width: 110, align: "left" },
      { label: "Status", width: 60, align: "center" },
    ];

    let currentY = tableTop;

    // Draw header background
    doc.rect(30, currentY, 535, 20).fill("#111111");

    // Draw header text
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8);
    let currentX = 30;
    columns.forEach((col) => {
      doc.text(col.label, currentX, currentY + 6, { width: col.width, align: col.align as any });
      currentX += col.width;
    });

    currentY += 20;

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let dayVal = 1; dayVal <= daysInMonth; dayVal++) {
      const dateObj = new Date(Date.UTC(year, month - 1, dayVal));
      const dateStr = dateObj.toISOString().split("T")[0];
      const displayDateStr = `${String(dayVal).padStart(2, "0")}-${String(month).padStart(2, "0")}-${year}`;
      const dayName = dayNames[dateObj.getUTCDay()];
      const isWeekend = dateObj.getUTCDay() === 0 || dateObj.getUTCDay() === 6;
      const isHoliday = holidayMap.has(dateStr);

      let logInStr = "-";
      let logOutStr = "-";
      let hoursStr = "-";
      let statusStr = "";

      const dayLogs = logMap.get(dateStr);

      const leaveToday = leaves.find((lf) => {
        const startStr = lf.start_date.toISOString().split("T")[0];
        const endStr = lf.end_date.toISOString().split("T")[0];
        return dateStr >= startStr && dateStr <= endStr;
      });

      if (dateObj > today) {
        // Future date
        statusStr = "";
      } else if (dayLogs && dayLogs.length > 0) {
        statusStr = "Present";
        let earliestClockIn: Date | null = null;
        let latestClockOut: Date | null = null;
        let dayTotalHours = 0;

        dayLogs.forEach((l: any) => {
          const { clockIn, clockOut, hours } = calculateAggregates(
            l.attendance_sessions || [],
            l.clock_in,
            l.clock_out,
            l.hours
          );

          if (clockIn) {
            if (!earliestClockIn || clockIn < earliestClockIn) {
              earliestClockIn = clockIn;
            }
          }
          if (clockOut) {
            if (!latestClockOut || clockOut > latestClockOut) {
              latestClockOut = clockOut;
            }
          }
          if (hours) {
            dayTotalHours += Number(hours);
          }
        });

        const formatTime = (d: Date | null) => (d ? d.toISOString().split("T")[1].slice(0, 5) : "-");
        logInStr = formatTime(earliestClockIn);
        logOutStr = formatTime(latestClockOut);
        hoursStr = dayTotalHours > 0 ? dayTotalHours.toFixed(2) : "-";
      } else if (isWeekend) {
        statusStr = "Weekend";
      } else if (isHoliday) {
        statusStr = holidayMap.get(dateStr);
      } else if (leaveToday) {
        statusStr = `Leave: ${leaveToday.leave_type}`;
      } else {
        statusStr = "ABSENT";
      }

      // Draw row background for weekends/holidays/leaves (light gray)
      if (isWeekend || isHoliday || leaveToday) {
        doc.rect(30, currentY, 535, 18).fill("#F5F5F5");
      }

      // Draw border lines
      doc
        .strokeColor("#DDDDDD")
        .lineWidth(0.5)
        .moveTo(30, currentY + 18)
        .lineTo(565, currentY + 18)
        .stroke();

      // Draw row text
      doc.fontSize(8).font("Helvetica").fillColor(isWeekend || isHoliday || leaveToday ? "#777777" : "#333333");

      let rowX = 30;
      const rowData = [
        displayDateStr,
        dayName,
        logInStr,
        logOutStr,
        hoursStr,
        isWeekend || isHoliday || leaveToday ? "-" : employee.name,
        isWeekend || isHoliday || leaveToday ? "-" : clientCompany,
        statusStr,
      ];

      rowData.forEach((val, idx) => {
        const col = columns[idx];
        let textColor = isWeekend || isHoliday || leaveToday ? "#777777" : "#333333";
        let textFont = "Helvetica";

        if (idx === 7) {
          // Status column coloring
          if (val === "Present") {
            textColor = "#1B5E20";
            textFont = "Helvetica-Bold";
          } else if (val === "ABSENT") {
            textColor = "#B71C1C";
            textFont = "Helvetica-Bold";
          } else if (val.startsWith("Leave") || val.startsWith("LEAVE")) {
            textColor = "#FF7A00";
            textFont = "Helvetica-Bold";
          }
        }

        doc
          .font(textFont)
          .fillColor(textColor)
          .text(val, rowX, currentY + 5, { width: col.width, align: col.align as any });
        rowX += col.width;
      });

      currentY += 18;

      // Handle page break if content exceeds A4 height
      if (currentY > 740 && dayVal < daysInMonth) {
        doc.addPage();
        currentY = 30;

        // Redraw table headers on new page
        doc.rect(30, currentY, 535, 20).fill("#111111");
        doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8);
        let headerX = 30;
        columns.forEach((col) => {
          doc.text(col.label, headerX, currentY + 6, { width: col.width, align: col.align as any });
          headerX += col.width;
        });
        currentY += 20;
      }
    }

    doc.end();

    const pdfBuffer = await pdfPromise;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=Vergil_Tempo_Attendance_${employee.name.replace(/\s+/g, "_")}_${year}-${String(month).padStart(2, "0")}.pdf`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
