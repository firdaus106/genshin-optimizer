import ElementalData from "../Data/ElementalData"

/**
 * Generate all set of artifacts-by-slots based on the filters
 * @param {Object.<slotKey, artifact[]>} artifactsBySlot - list of artifacts, separated by slots
 * @param {Object.<setKey, number>} setFilters - minimum number of artifacts in each set
 *
 */
export function artifactSetPermutations(artifactsBySlot, setFilters) {
  const setKeys = new Set(setFilters.map(i => i.key)), filteredArtifactsBySlot = {}
  const slotKeys = Object.keys(artifactsBySlot)

  for (const slotKey of slotKeys) {
    let artifactsBySet = {}
    for (const artifact of artifactsBySlot[slotKey]) {
      if (setKeys.has(artifact.setKey)) {
        if (artifactsBySet[artifact.setKey]) artifactsBySet[artifact.setKey].push(artifact)
        else artifactsBySet[artifact.setKey] = [artifact]
      } else {
        if (artifactsBySet[null]) artifactsBySet[null].push(artifact)
        else artifactsBySet[null] = [artifact]
      }
    }
    filteredArtifactsBySlot[slotKey] = Object.freeze(artifactsBySet)
  }

  const setCount = {}, accu = {}, result = []

  function slotPerm(index) {
    if (index >= slotKeys.length) {
      for (const { key, num } of setFilters)
        if ((setCount[key] ?? 0) < num)
          return
      result.push({ ...accu })
      return
    }

    const slotKey = slotKeys[index]
    let artifactsBySet = filteredArtifactsBySlot[slotKey]
    for (const setKey in artifactsBySet) {
      setCount[setKey] = (setCount[setKey] ?? 0) + 1
      accu[slotKey] = artifactsBySet[setKey]
      slotPerm(index + 1)
      setCount[setKey] -= 1
    }
  }

  slotPerm(0)
  return result
}

/**
 * Compute number of all artifact permutations based on the filters
 * @param {Object.<slotKey, artifact[]>} artifactsBySlot - list of artifacts, separated by slots
 * @param {Object.<setKey, number>} setFilters - minimum number of artifacts in each set
 */
export function calculateTotalBuildNumber(artifactsBySlot, setFilters) {
  return artifactSetPermutations(artifactsBySlot, setFilters).reduce((accu, artifactsBySlot) =>
    accu + Object.entries(artifactsBySlot).reduce((accu, artifacts) => accu * artifacts[1].length, 1)
    , 0)
}

/**
 * @callback artifactCallback
 * @param {Object.<artifactKey, artifact>} artifacts - the list of artifacts
 * @param {stats} stats - the total stats for the artifacts
 */

/**
 * Generate all artifact permutations and accumulate the stats
 * @param {stats} initialStats - initial stats before any artifact is added
 * @param {Object.<slotKey, artifact[]>} artifactsBySlot - list of artifacts, separated by slots
 * @param {Object.<setKey, Object.<number, Object.<statKey, statValue>>>} artifactSetEffects - the list of the set effects
 * @param {artifactCallback} callback - the functions called with each permutation
 */
export function artifactPermutations(initialStats, artifactsBySlot, artifactSetEffects, callback) {
  const slotKeys = Object.keys(artifactsBySlot), setCount = {}, accu = {}
  function slotPerm(index, stats) {
    if (index >= slotKeys.length) {
      callback(accu, stats)
      return
    }

    let slotKey = slotKeys[index]
    for (const artifact of artifactsBySlot[slotKey]) {
      let newStats = { ...stats }
      accumulate(slotKey, artifact, setCount, accu, newStats, artifactSetEffects)
      slotPerm(index + 1, newStats)
      setCount[artifact.setKey] -= 1
    }
  }

  slotPerm(0, initialStats)
}

function accumulate(slotKey, art, setCount, accu, stats, artifactSetEffects) {
  let setKey = art.setKey
  accu[slotKey] = art
  setCount[setKey] = (setCount[setKey] ?? 0) + 1

  // Add artifact stats
  if (art.mainStatKey in stats) stats[art.mainStatKey] += art.mainStatVal
  art.substats.forEach((substat) => {
    if (substat?.key in stats) stats[substat.key] += substat.value
  })

  // Add set effects
  let setEffect = artifactSetEffects[setKey]?.[setCount[setKey]]
  setEffect && Object.entries(setEffect).forEach(([statKey, val]) => {
    if (statKey in stats) stats[statKey] += val
  })
}

/**
  * Create statKey in the form of ${ele}_elemental_${type} for elemental DMG, ${ele}_${src}_${type} for talent DMG.
  * @param {string} skillKey - The DMG src. Can be "norm","skill". Use an elemental to specify a elemental hit "physical" -> physical_elemental_{type}. Use "elemental" here to specify a elemental hit of character's element/reactionMode
  * @param {*} stats - The character. Will extract hitMode, autoInfused...
  * @param {*} elemental - Override the hit to be the character's elemental, that is not part of infusion.
  */
export function getTalentStatKey(skillKey, stats, elemental = false) {
  const { hitMode = "", autoInfused = false, reactionMode = null, characterEle = "anemo", weaponType = "sword" } = stats
  if (Object.keys(ElementalData).includes(skillKey)) return `${skillKey}_elemental_${hitMode}`//elemental DMG
  if (!elemental) elemental = weaponType === "catalyst" || autoInfused
  let eleKey = "physical"
  if (skillKey === "elemental" || skillKey === "burst" || skillKey === "skill" || elemental)
    eleKey = (reactionMode ? reactionMode : characterEle)
  return `${eleKey}_${skillKey}_${hitMode}`
}

export function getTalentStatKeyVariant(skillKey, stats, elemental = false) {
  if (Object.keys(ElementalData).includes(skillKey)) return skillKey
  const { autoInfused = false, characterEle = "anemo", weaponType = "sword" } = stats
  let { reactionMode } = stats
  //reactionMode can be one of pyro_vaporize, pyro_melt, hydro_vaporize,cryo_melt
  if (["pyro_vaporize", "hydro_vaporize"].includes(reactionMode))
    reactionMode = "vaporize"
  else if (["pyro_melt", "cryo_melt"].includes(reactionMode))
    reactionMode = "melt"
  if (!elemental) elemental = weaponType === "catalyst" || autoInfused
  let eleKey = "physical"
  if (skillKey === "elemental" || skillKey === "burst" || skillKey === "skill" || elemental)
    eleKey = (reactionMode ? reactionMode : characterEle)
  return eleKey
}