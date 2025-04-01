function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Calculador vacaciones'); 
}

function calculateHolidayQuota(hiringDate, leaveDate, altaDate, location, extraDays) {
    const FULL_QUOTA = 23;
    
    let HOLIDAYS = {
        TFE: JSON.parse(PropertiesService.getScriptProperties().getProperty('holidays_TFE')) || ["2025-01-01", "2025-01-06", "2025-02-03", "2025-03-04", "2025-04-17", "2025-04-18", "2025-05-01", "2025-05-02", "2025-05-30", "2025-08-15", "2025-11-01", "2025-12-06", "2025-12-08", "2025-12-24", "2025-12-25", "2025-12-31"],
        LPA: JSON.parse(PropertiesService.getScriptProperties().getProperty('holidays_LPA')) || ["2025-01-01", "2025-01-06", "2025-03-04", "2025-04-17", "2025-04-18", "2025-05-01", "2025-05-30", "2025-06-24", "2025-08-15", "2025-09-08", "2025-11-01", "2025-12-06", "2025-12-08", "2025-12-24", "2025-12-25", "2025-12-31"]
    };

    let today = new Date();
    hiringDate = hiringDate ? new Date(hiringDate) : null;
    leaveDate = leaveDate ? new Date(leaveDate) : null;
    altaDate = altaDate ? new Date(altaDate) : today;

    let baseQuota = 0;
    if (hiringDate && !leaveDate) {
        let daysWorked = (today - hiringDate) / (1000 * 60 * 60 * 24);
        baseQuota = Math.round((FULL_QUOTA / 365) * daysWorked);
    } else if (!hiringDate && leaveDate) {
        let daysWorked = (leaveDate - new Date(leaveDate.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24);
        baseQuota = Math.round((FULL_QUOTA / 365) * daysWorked);
    } else if (hiringDate && leaveDate) {
        let daysWorked = (leaveDate - hiringDate) / (1000 * 60 * 60 * 24);
        baseQuota = Math.round((FULL_QUOTA / 365) * daysWorked);
    }

    let totalQuota = baseQuota + (extraDays || 0);
    let quotaString = extraDays > 0 ? `${baseQuota} + ${extraDays} extra ` : `${baseQuota}`;
    let coverageEndDate = calculateCoverageEnd(altaDate, totalQuota, HOLIDAYS[location]);

    return { quota: quotaString, coverageEndDate: coverageEndDate.toISOString().split('T')[0] };
}

function calculateCoverageEnd(startDate, days, holidays) {
    let date = new Date(startDate);
    let daysCounted = 0;
    while (daysCounted < days) {
        let dayOfWeek = date.getDay();
        let formattedDate = date.toISOString().split('T')[0];
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.includes(formattedDate)) {
            daysCounted++; // Count today if it's a working day
            if (daysCounted === days) break; // If reached desired days, break loop and return current date
        }
        date.setDate(date.getDate() + 1); // Move to next day only if still counting
    }
    return date;
}


function updateHolidays(password, holidaysTFE, holidaysLPA) {
    const CORRECT_PASSWORD = "NeverEdit"; // Set the correct password

    if (password !== CORRECT_PASSWORD) {
        return { success: false, message: "Incorrect password!" };
    }

    // Store the new holiday lists
    PropertiesService.getScriptProperties().setProperty('holidays_TFE', JSON.stringify(holidaysTFE));
    PropertiesService.getScriptProperties().setProperty('holidays_LPA', JSON.stringify(holidaysLPA));

    return { success: true, message: "Holidays updated successfully!" };
}
