import React, { useState, useMemo, useEffect } from "react";
import { format, eachDayOfInterval, isFriday, isSaturday } from "date-fns";
import { Calendar } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { HebrewCalendar, flags } from "@hebcal/core";
import { X, Settings } from "lucide-react";

const WORKDAY = "💼 עבודה";
const WEEKEND = "🏖️ סוף שבוע";
const HOLIDAY = "🕯️ חג";

export default function App() {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [userType, setUserType] = useState(
    localStorage.getItem("userType") || "citizen"
  );

  useEffect(() => {
    localStorage.setItem("userType", userType);
  }, [userType]);

  const holidays = useMemo(() => {
    const h = HebrewCalendar.calendar({
      year: new Date().getFullYear(),
      isHebrewYear: false,
      candlelighting: false,
      sedrot: false,
      il: true,
      locale: "he",
    });

    const SOLDIER_HOLIDAYS = {
      "Purim": 1,
      "Erev Pesach": 1,
      "Pesach VI": 1,
      "Lag BaOmer": 1,
      "Erev Shavuot": 0.5,
      "Erev Rosh Hashana": 0.5,
      "Erev Yom Kippur": 1,
      "Erev Sukkot": 0.5,
      "Sukkot VII (Hoshana Raba)": 0.5,
    };
    const KEVAH_HOLIDAYS = {
      "Erev Shavuot": 1,
      "Erev Rosh Hashana": 1,
      "Erev Sukkot": 1,
      "Sukkot VII (Hoshana Raba)": 1,
    };

    let SPECIAL_HOLIDAYS = {};
    if (userType === "soldier") SPECIAL_HOLIDAYS = SOLDIER_HOLIDAYS;
    else if (userType === "kevah") SPECIAL_HOLIDAYS = { ...SOLDIER_HOLIDAYS, ...KEVAH_HOLIDAYS };

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
      "Ben-Gurion Day",
    ];

    let daysOff = h.filter(
      (ev) =>
        (ev.getFlags() & (flags.CHAG | flags.MODERN_HOLIDAY)) ||
        SPECIAL_HOLIDAYS[ev.desc]
    ).filter((ev) => !NoVacationHolidays.includes(ev.desc));

    return daysOff.reduce((acc, holiday) => {
      const dateStr = format(holiday.getDate().greg(), "yyyy-MM-dd");
      acc[dateStr] = {
        name: holiday.render("he"),
        cost: SPECIAL_HOLIDAYS[holiday.desc] || 1,
      };
      return acc;
    }, {});
  }, [userType]);

  const days = useMemo(() => {
    if (!startDate || !endDate) return [];
    return eachDayOfInterval({ start: startDate, end: endDate }).map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      let type = WORKDAY;
      if (isFriday(day) || isSaturday(day)) type = WEEKEND;
      if (holidays[dateStr]) type = `${HOLIDAY} ${holidays[dateStr].name}`;
      return { date: format(day, "EEE dd/MM/yyyy"), type, holidayCost: holidays[dateStr]?.cost || 0 };
    });
  }, [startDate, endDate, holidays]);

  const vacationDays = days.filter((d) => d.type === WORKDAY).length;
  const weekendDays = days.filter((d) => d.type === WEEKEND).length;
  const holidayDays = days.reduce((sum, d) => sum + d.holidayCost, 0);

  const getHolidayLabel = (cost) => {
    if (userType === "soldier" && cost < 1) return "🪖 (חצי)";
    if (userType === "soldier") return "🪖";
    if (userType === "kevah") return "🪖 קבע";
    return "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 text-gray-800">
      <header className="bg-blue-700 text-white py-6 shadow-md flex justify-between items-center px-6">
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold">🏖️ חופשלי</h1>
          <p className="text-sm opacity-90">כמה ימי חופש צריך</p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="ml-auto bg-blue-600 hover:bg-blue-800 rounded-full p-2 shadow-lg"
          aria-label="הגדרות"
        >
          <Settings className="w-6 h-6 text-white" />
        </button>
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
              {userType !== "citizen" && (
                <span className="ml-2 text-sm text-gray-600">
                  {userType === "soldier" ? "🪖 (חייל)" : "🪖 קבע"}
                </span>
              )}
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
                      holidayCost: day.holidayCost,
                    };
                  } else if (tempGroup.baseType === dayType) {
                    tempGroup.end = day.date;
                    tempGroup.holidayCost += day.holidayCost;
                  } else {
                    grouped.push({ ...tempGroup });
                    tempGroup = {
                      start: day.date,
                      end: day.date,
                      type: day.type,
                      baseType: dayType,
                      holidayCost: day.holidayCost,
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
                      {d.holidayCost > 0 && d.type.includes(HOLIDAY)
                        ? ` (${d.holidayCost} ${getHolidayLabel(d.holidayCost)})`
                        : ""}
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

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 relative">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold mb-4">⚙️ הגדרות</h2>

            {/* Radio Buttons */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="citizen"
                  checked={userType === "citizen"}
                  onChange={(e) => setUserType(e.target.value)}
                  className="h-4 w-4"
                />
                <span>👤 אזרח</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="soldier"
                  checked={userType === "soldier"}
                  onChange={(e) => setUserType(e.target.value)}
                  className="h-4 w-4"
                />
                <span>🪖 סדיר</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="kevah"
                  checked={userType === "kevah"}
                  onChange={(e) => setUserType(e.target.value)}
                  className="h-4 w-4"
                />
                <span>🪖 קבע</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
