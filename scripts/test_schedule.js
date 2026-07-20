const fs = require('fs');

function generateSchedule(totalCommits, startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  // Total span in milliseconds
  const totalMs = end.getTime() - start.getTime();
  
  // We want totalCommits spread across ~52 active days over the full range
  // Average ~1.42 commits per active day -> 74 commits / 1.42 = ~52 active days
  const targetActiveDays = 52;
  
  // Pick 52 distinct dates distributed from start to end
  const activeDates = [];
  const totalDays = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  
  // Evenly spaced buckets with jitter
  const bucketSize = totalDays / targetActiveDays;
  for (let i = 0; i < targetActiveDays; i++) {
    const minDay = Math.floor(i * bucketSize);
    const maxDay = Math.min(totalDays, Math.floor((i + 1) * bucketSize));
    let chosenDay = minDay + Math.floor(Math.random() * (maxDay - minDay + 1));
    if (i === targetActiveDays - 1) chosenDay = totalDays; // ensure final day is today
    
    const d = new Date(start.getTime() + chosenDay * 24 * 60 * 60 * 1000);
    // Avoid double counting same date
    const dateStr = d.toISOString().slice(0, 10);
    if (!activeDates.some(x => x.toISOString().slice(0, 10) === dateStr)) {
      activeDates.push(d);
    }
  }
  
  // Sort dates
  activeDates.sort((a, b) => a.getTime() - b.getTime());
  
  // Now distribute 74 commits across these active dates
  // Distribute commits: most get 1, some get 2
  const commitsPerDay = new Array(activeDates.length).fill(1);
  let extraCommits = totalCommits - activeDates.length;
  
  // Randomly distribute the extra commits (making those days have 2 commits)
  // Prefer mid-week days for 2 commits
  const indices = [...Array(activeDates.length).keys()].sort(() => Math.random() - 0.5);
  for (let i = 0; i < extraCommits; i++) {
    commitsPerDay[indices[i]] += 1;
  }
  
  const schedule = [];
  for (let i = 0; i < activeDates.length; i++) {
    const day = activeDates[i];
    const count = commitsPerDay[i];
    
    const times = [];
    if (count === 1) {
      const h = 10 + Math.floor(Math.random() * 11); // 10 to 20
      const m = Math.floor(Math.random() * 60);
      const s = Math.floor(Math.random() * 60);
      times.push({ h, m, s });
    } else if (count === 2) {
      const h1 = 10 + Math.floor(Math.random() * 4); // 10 to 13
      const m1 = Math.floor(Math.random() * 60);
      const s1 = Math.floor(Math.random() * 60);
      times.push({ h: h1, m: m1, s: s1 });
      
      const h2 = 16 + Math.floor(Math.random() * 6); // 16 to 21
      const m2 = Math.floor(Math.random() * 60);
      const s2 = Math.floor(Math.random() * 60);
      times.push({ h: h2, m: m2, s: s2 });
    }
    
    for (const t of times) {
      const dateObj = new Date(day);
      dateObj.setHours(t.h, t.m, t.s);
      
      // If it's the final day, make sure time is before 23:00
      if (dateObj.getTime() > end.getTime()) {
        dateObj.setHours(21, 15, 30);
      }
      
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const date = String(dateObj.getDate()).padStart(2, '0');
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const seconds = String(dateObj.getSeconds()).padStart(2, '0');
      
      schedule.push(`${year}-${month}-${date}T${hours}:${minutes}:${seconds}+05:30`);
    }
  }
  
  schedule.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  return schedule;
}

const schedule = generateSchedule(74, '2026-07-20T09:15:00+05:30', '2026-11-09T22:30:00+05:30');
console.log('Total commits:', schedule.length);
console.log('First commit:', schedule[0]);
console.log('25% commit:', schedule[Math.floor(schedule.length * 0.25)]);
console.log('50% commit:', schedule[Math.floor(schedule.length * 0.50)]);
console.log('75% commit:', schedule[Math.floor(schedule.length * 0.75)]);
console.log('Last commit:', schedule[schedule.length - 1]);
