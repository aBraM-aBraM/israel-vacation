import React, { useState, useMemo } from "react";
import { format, eachDayOfInterval, isFriday, isSaturday } from "date-fns";
import { Calendar } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { HebrewCalendar, flags } from "@hebcal/core";

const WORKDAY = "💼 עבודה";
const WEEKEND = "🏖️ סוף שבוע";
const HOLIDAY = "🕯️ חג";

export default function App() {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(true);

  // Holidays that are actually days off in Israel
  const holidays = useMemo(() => {
    const h = HebrewCalendar.calendar({
      year: new Date().getFullYear(),
      isHebrewYear: false,
      candlelighting: false,
      sedrot: false,
      il: true,
      locale: "he",
    });

    // Keep only Yom Tov + official modern holidays (e.g. Independence Day)
    let daysOff = h.filter(
      (ev) => ev.getFlags() & (flags.CHAG | flags.MODERN_HOLIDAY)
    );

    const NoVacationHolidays = [
      "Yom Yerushalayim",
      "Yom HaAliyah",
      "Pesach II",
      "Pesach VIII",
      "Yom HaShoah",
      "Yom HaZikaron",
      "Shavuot II",
      "Sukkot II",
      "Sigd",
      "Hebrew Language Day",
      "Family Day",
      "Herzl Day",
      "Jabotinsky Day",
      "Yom HaAliyah School Observance",
      "Yitzhak Rabin Memorial Day",
      "Ben-Gurion Day"
    ]

    daysOff = daysOff.filter(
      (ev) => !NoVacationHolidays.includes(ev.desc)
    );
    console.log(daysOff.map(ev => `${ev.desc}`));

    return daysOff.reduce((acc, holiday) => {
      const dateStr = format(holiday.getDate().greg(), "yyyy-MM-dd");
      acc[dateStr] = holiday.render("he");
      return acc;
    }, {});
  }, []);

  const days = useMemo(() => {
    if (!startDate || !endDate) return [];
    return eachDayOfInterval({ start: startDate, end: endDate }).map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      let type = WORKDAY;
      if (isFriday(day) || isSaturday(day)) type = WEEKEND;
      if (holidays[dateStr]) type = `${HOLIDAY} (${holidays[dateStr]})`;
      return { date: format(day, "EEE dd/MM/yyyy"), type };
    });
  }, [startDate, endDate, holidays]);

  const vacationDays = days.filter((d) => d.type === WORKDAY).length;
  const weekendDays = days.filter((d) => d.type === WEEKEND).length;
  const holidayDays = days.filter((d) => d.type.includes(HOLIDAY)).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 text-gray-800">
      <header className="bg-blue-700 text-white py-6 shadow-md text-center">
        <h1 className="text-3xl font-bold">🏖️ חופשלי</h1>
        <p className="text-sm opacity-90">כמה ימי חופש צריך</p>
      </header>

      <main className="flex flex-col items-center p-6">
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg transition"
        >
          {startDate && endDate
            ? ` תאריכים: ${format(startDate, "dd/MM/yyyy")} → ${format(
              endDate,
              "dd/MM/yyyy"
            )}`
            : "בחירת תאריכים"}
        </button>

        {showCalendar && (
          <div className="mt-6 bg-white rounded-xl shadow-xl p-4">
            <Calendar
              date={startDate || new Date()}
              onChange={(date) => {
                if (!startDate || (startDate && endDate)) {
                  setStartDate(date);
                  setEndDate(null);
                } else {
                  if (date < startDate) {
                    setEndDate(startDate);
                    setStartDate(date);
                  } else {
                    setEndDate(date);
                  }
                  setShowCalendar(false);
                }
              }}
            />
          </div>
        )}

        {days.length > 0 && (
          <div className="mt-8 w-full max-w-lg bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-3">חישוב</h2>
            <p className="mb-4 text-lg">
              ימי חופש דרושים:{" "}
              <span className="font-bold text-red-600">{vacationDays}</span>
            </p>

            {/* Receipt */}
            <div className="border-t divide-y text-sm">
              {(() => {
                const grouped = [];
                let tempGroup = null;

                for (const day of days) {
                  const isHoliday = day.type.includes(HOLIDAY);
                  const isWeekend = day.type === WEEKEND;

                  const dayType = isHoliday
                    ? HOLIDAY
                    : isWeekend
                      ? WEEKEND
                      : WORKDAY;

                  if (!tempGroup) {
                    tempGroup = {
                      start: day.date,
                      end: day.date,
                      type: day.type,
                      baseType: dayType,
                    };
                  } else if (tempGroup.baseType === dayType) {
                    tempGroup.end = day.date;
                  } else {
                    grouped.push({ ...tempGroup });
                    tempGroup = {
                      start: day.date,
                      end: day.date,
                      type: day.type,
                      baseType: dayType,
                    };
                  }
                }

                if (tempGroup) grouped.push(tempGroup);

                return grouped.map((d, i) => (
                  <div
                    key={i}
                    className="flex justify-between py-2 hover:bg-gray-50"
                  >
                    <span>
                      {d.start !== d.end ? `${d.start} - ${d.end}` : d.start}
                    </span>
                    <span
                      className={
                        d.type.includes(HOLIDAY)
                          ? "text-green-600 font-medium"
                          : d.type === WEEKEND
                            ? "text-blue-600 font-medium"
                            : "text-gray-700"
                      }
                    >
                      {d.type}
                    </span>
                  </div>
                ));
              })()}
            </div>

            {/* Summary Cards */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="bg-gray-100 rounded-xl p-4 text-center shadow-md">
                <div className="text-gray-700 font-bold">{WORKDAY}</div>
                <div className="text-gray-700 text-lg">{vacationDays}</div>
              </div>
              <div className="bg-blue-100 rounded-xl p-4 text-center shadow-md">
                <div className="text-blue-600 font-bold">{WEEKEND}</div>
                <div className="text-blue-600 text-lg">{weekendDays}</div>
              </div>
              <div className="bg-green-100 rounded-xl p-4 text-center shadow-md">
                <div className="text-green-600 font-bold">{HOLIDAY}</div>
                <div className="text-green-600 text-lg">{holidayDays}</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
