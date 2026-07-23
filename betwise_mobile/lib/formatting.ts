export function fmtUGX(v: string | number) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return "UGX " + Math.round(n).toLocaleString();
}

export function fmtKickoff(iso: string) {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timePart = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return datePart + " · " + timePart;
}

export function fmtDateOnly(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function fmtKickoffLong(iso: string) {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const timePart = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return datePart + " at " + timePart;
}

export function isAtLeast18(dob: string) {
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 18;
}
