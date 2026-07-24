export const DEPARTMENTS = [
  "Production", "QA/QC", "Engineering", "Procurement",
  "Research & Development", "Business Intelligence", "Tech",
  "Sales & Marketing", "Regulatory", "Finance", "HR & Admin", "Supply Chain"
];

export const SKILL_TAGS = [
  "leadership", "problem-solving", "cross-functional",
  "qa", "technical", "commercial", "trade", "process"
];

export const MILESTONE_STATUSES = ["Planned", "In progress", "Done", "Delayed", "Blocked"];

export const HEALTH_STYLES = {
  "On track": { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  "At risk": { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  "Blocked": { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
};

export const MILESTONE_STYLES = {
  "Done": { dot: "bg-emerald-500", text: "text-emerald-700" },
  "In progress": { dot: "bg-orange-500", text: "text-orange-700" },
  "Delayed": { dot: "bg-amber-500", text: "text-amber-700" },
  "Blocked": { dot: "bg-red-500", text: "text-red-700" },
  "Planned": { dot: "bg-slate-400", text: "text-slate-500" },
};

export const PETAL_STYLES = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200",
  neutral: "bg-stone-100 text-stone-500 border-stone-200",
};

export const PROJECT_CATEGORIES = [
  { value: "Micro", maxMonths: 6 },
  { value: "Pilot", maxMonths: 6 },
  { value: "Standard", maxMonths: 12 },
  { value: "Strategic", maxMonths: 18 },
];

export const APPROVAL_STYLES = {
  "Pending": { bg: "bg-amber-100", text: "text-amber-700" },
  "Approved": { bg: "bg-emerald-100", text: "text-emerald-700" },
  "Rejected": { bg: "bg-red-100", text: "text-red-700" },
};

export const PROJECT_STATUSES = ["Not Started", "Ongoing", "Delayed", "Done", "Suspended"];

export const PROJECT_STATUS_STYLES = {
  "Not Started": { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  "Ongoing": { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  "Delayed": { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  "Done": { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  "Suspended": { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
};

export const CHALLENGE_TYPE_STYLES = {
  "Revenue": { bg: "bg-emerald-100", text: "text-emerald-700" },
  "Cost saving": { bg: "bg-blue-100", text: "text-blue-700" },
  "Improves efficiency": { bg: "bg-amber-100", text: "text-amber-700" },
};