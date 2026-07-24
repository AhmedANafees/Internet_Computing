export function formatSchedule(schedule) {
  return (schedule ?? []).map((entry) => `${entry.day} ${entry.startTime}–${entry.endTime}`).join(', ');
}

export function buildRows(courses) {
  return (courses ?? []).flatMap((course) =>
    (course.sections ?? []).map((section) => ({ course, section }))
  );
}

// Parse time string in HH:MM format to minutes since midnight
function timeToMinutes(timeStr) {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Check if two time ranges overlap
function timesOverlap(start1, end1, start2, end2) {
  const min1 = timeToMinutes(start1);
  const min2 = timeToMinutes(end1);
  const min3 = timeToMinutes(start2);
  const min4 = timeToMinutes(end2);
  
  if (min1 === null || min2 === null || min3 === null || min4 === null) return false;
  return min1 < min4 && min3 < min2;
}

// Day order for comparison
const dayOrder = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4 };

// Detect time conflicts in cart
export function detectTimeConflicts(cartItems) {
  const conflicts = [];
  
  for (let i = 0; i < cartItems.length; i++) {
    for (let j = i + 1; j < cartItems.length; j++) {
      const item1 = cartItems[i];
      const item2 = cartItems[j];
      
      // Only check conflicts within the same term
      if (item1.section.term !== item2.section.term) continue;
      
      const schedule1 = item1.section.schedule || [];
      const schedule2 = item2.section.schedule || [];
      
      for (const slot1 of schedule1) {
        for (const slot2 of schedule2) {
          // Check if same day and time overlaps
          if (slot1.day === slot2.day && timesOverlap(slot1.startTime, slot1.endTime, slot2.startTime, slot2.endTime)) {
            conflicts.push({
              course1: item1.course,
              section1: item1.section,
              course2: item2.course,
              section2: item2.section,
              day: slot1.day,
              time1: `${slot1.startTime}-${slot1.endTime}`,
              time2: `${slot2.startTime}-${slot2.endTime}`,
            });
          }
        }
      }
    }
  }
  
  return conflicts;
}

// Group cart items by term
export function groupCartByTerm(cartItems) {
  const grouped = {};
  
  cartItems.forEach((item) => {
    const term = item.section.term || 'No Term';
    if (!grouped[term]) {
      grouped[term] = [];
    }
    grouped[term].push(item);
  });
  
  return grouped;
}
