/**
 * Compute stats by (university, problem) and medal summary by university from contest_teams.
 * Each team row: { university_name, problem, medal } (university_name from joined universities table).
 */

function universityName(team) {
  return team.university_name ?? team.university?.name ?? team.university ?? ''
}

export function computeStatsByProblem(teams) {
  const byKey = {}
  const byUni = {}
  for (const t of teams) {
    const name = universityName(t)
    const key = `${name}\n${t.problem}`
    if (!byKey[key]) {
      byKey[key] = { university: name, problem: t.problem, gold: 0, silver: 0, bronze: 0, acc: 0, total: 0 }
    }
    const row = byKey[key]
    if (t.medal === 'Gold') row.gold++
    else if (t.medal === 'Silver') row.silver++
    else if (t.medal === 'Bronze') row.bronze++
    else if (t.medal === 'Acc') row.acc++
    row.total++

    if (!byUni[name]) {
      byUni[name] = { gold: 0, silver: 0, bronze: 0, acc: 0, total: 0 }
    }
    const uni = byUni[name]
    if (t.medal === 'Gold') uni.gold++
    else if (t.medal === 'Silver') uni.silver++
    else if (t.medal === 'Bronze') uni.bronze++
    else if (t.medal === 'Acc') uni.acc++
    uni.total++
  }
  return Object.values(byKey).sort((a, b) => {
    const uA = byUni[a.university]
    const uB = byUni[b.university]
    if (uA && uB) {
      if (uB.gold !== uA.gold) return uB.gold - uA.gold
      if (uB.silver !== uA.silver) return uB.silver - uA.silver
      if (uB.bronze !== uA.bronze) return uB.bronze - uA.bronze
      if (uB.acc !== uA.acc) return uB.acc - uA.acc
      if (uB.total !== uA.total) return uB.total - uA.total
    }
    return a.university.localeCompare(b.university) || a.problem.localeCompare(b.problem)
  })
}

export function computeMedalSummary(teams) {
  const byUni = {}
  for (const t of teams) {
    const name = universityName(t)
    if (!byUni[name]) {
      byUni[name] = { university: name, gold: 0, silver: 0, bronze: 0, acc: 0, total: 0 }
    }
    const row = byUni[name]
    if (t.medal === 'Gold') row.gold++
    else if (t.medal === 'Silver') row.silver++
    else if (t.medal === 'Bronze') row.bronze++
    else if (t.medal === 'Acc') row.acc++
    row.total++
  }
  return Object.values(byUni).sort((a, b) => {
    if (b.gold !== a.gold) return b.gold - a.gold
    if (b.silver !== a.silver) return b.silver - a.silver
    if (b.bronze !== a.bronze) return b.bronze - a.bronze
    if (b.acc !== a.acc) return b.acc - a.acc
    if (b.total !== a.total) return b.total - a.total
    return a.university.localeCompare(b.university)
  })
}
