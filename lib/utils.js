export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

export const formatDateShort = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const getDueDays = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getStatusColor = (status, COLORS) => {
  const map = {
    active: { bg: COLORS.statusActiveBg, text: COLORS.statusActive },
    overdue: { bg: COLORS.statusOverdueBg, text: COLORS.statusOverdue },
    returned: { bg: COLORS.statusReturnedBg, text: COLORS.statusReturned },
    pending: { bg: COLORS.statusPendingBg, text: COLORS.statusPending },
    approved: { bg: COLORS.statusApprovedBg, text: COLORS.statusApproved },
    rejected: { bg: COLORS.statusRejectedBg, text: COLORS.statusRejected },
  };
  return map[status] || { bg: "#F5F5F5", text: "#757575" };
};

export const truncate = (str, len = 40) =>
  str?.length > len ? str.substring(0, len) + "…" : str || "";

export const getGenreEmoji = (genre) => {
  const map = {
    CSE: "🧑‍💻", Science: "⚗️", Math: "📐", History: "📜",
    Geography: "🌍", Literature: "📖", General: "📚",
    Fiction: "✨", Biography: "👤", Engineering: "⚙️",
    Medical: "🏥", Business: "💼", Philosophy: "🧠",
  };
  return map[genre] || "📗";
};

export const getDueStatus = (dueDate) => {
  const days = getDueDays(dueDate);
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, type: "overdue" };
  if (days === 0) return { label: "Due today!", type: "today" };
  if (days <= 3) return { label: `${days}d left`, type: "warning" };
  return { label: `${days}d left`, type: "ok" };
};
