import { clamp } from "./Util/Util";
import { ReactionMatrix, hitTypes, hitMoves, hitElements, transformativeReactions, amplifyingReactions } from "./StatConstants"

const StatData = {
  flat: { name: "", default: 1 },

  // Character Stats
  characterHP: { name: "HP", pretty: "Character Base HP" },
  characterDEF: { name: "DEF", pretty: "Character Base DEF" },
  characterATK: { name: "ATK", pretty: "Character Base ATK" },
  characterEle: { name: "Character Element Key", default: "anemo" },
  characterLevel: { name: "Character Level", default: 1 },

  // Weapon Stats
  weaponATK: { name: "Weapon ATK", pretty: "ATK Weapon" },
  
  // Character & Weapon Stats
  baseATK: { name: "ATK", pretty: "ATK Base" }, // characterATK + weaponATK

  // Weapon & Artifact Stats
  hp: { name: "HP", pretty: "Flat HP" },//flat hp
  hp_: { name: "HP", unit: "%", pretty: "HP Bonus" },
  atk: { name: "ATK", pretty: "Flat ATK" },
  atk_: { name: "ATK", unit: "%", pretty: "ATK Bonus" },
  def: { name: "DEF", pretty: "Flat DEF" },
  def_: { name: "DEF", unit: "%", pretty: "DEF Bonus" },
  dmg_: { name: "All DMG Bonus", unit: "%" },

  // Attack-related Character, Weapon & Artifact Stats
  finalHP: { name: "HP", pretty: "HP" },
  finalATK: { name: "ATK", pretty: "ATK" },
  finalDEF: { name: "DEF", pretty: "DEF" },

  eleMas: { name: "Elemental Mastery", },
  enerRech_: { name: "Energy Recharge", unit: "%" },
  critRate_: { name: "CRIT Rate", unit: "%" },

  critDMG_: { name: "CRIT DMG", unit: "%" },
  weakspotDMG_: { name: "Weakspot DMG", unit: "%" },

  // Misc. Stats
  heal_: { name: "Healing Bonus", unit: "%" },
  incHeal_: { name: "Incoming Healing Bonus", unit: "%" },
  powShield_: { name: "Powerful Shield", unit: "%" },
  cdRed_: { name: "CD Red.", unit: "%" },
  skillCDRed_: { name: "Ele. Skill CD Red.", unit: "%" },
  burstCDRed_: { name: "Ele. Burst CD Red.", unit: "%" },
  moveSPD_: { name: "Movement SPD", unit: "%" },
  atkSPD_: { name: "ATK SPD", unit: "%" },
  stamina: { name: "Stamina" },
  staminaDec_: { name: "Stamina Consumption Dec.", unit: "%" },
  staminaGlidingDec_: { name: "Gliding Stamina Consumption Dec.", unit: "%" },
  staminaChargedDec_: { name: "Charged Attack Stamina Consumption Dec.", unit: "%" },

  // Reaction
  amplificative_dmg_: { name: "Amplificative Reaction DMG Bonus", unit: "%" },
  transformative_dmg_: { name: "Transformative Reaction DMG Bonus", unit: "%" },
  crystalize_eleMas_: { name: "Crystalize Bonus (Elemental Mastery)", unit: "%", variant: "crystalize" },
  crystalize_multi: { name: "Crystalize Multiplier", unit: "multi", variant: "crystalize" } ,
  crystalize_dmg_: { name: "Crystalize Bonus", unit: "%", variant: "crystalize" },
  crystalize_hit: { name: "Crystalize Shield HP", variant: "crystalize" },

  // Enemy
  enemyLevel: { name: "Enemy Level" },
  enemyLevel_multi: { name: "Enemy Level RES Multiplier", unit: "multi" },
}
const Formulas = {
  // Basic Stats
  baseATK: (s) => s.characterATK + s.weaponATK,
  finalATK: (s) => s.baseATK * (1 + s.atk_ / 100) + s.atk,
  finalHP: (s) => s.characterHP * (1 + s.hp_ / 100) + s.hp,
  finalDEF: (s) => s.characterDEF * (1 + s.def_ / 100) + s.def,

  enemyLevel_multi: (s) => (100 + s.characterLevel) / (100 + s.enemyLevel + 100 + s.characterLevel),

  // Reactions
  amplificative_dmg_: (s) => 2500 / 9 * s.eleMas / (1400 + s.eleMas),
  transformative_dmg_: (s) => 6000 / 9 * s.eleMas / (1400 + s.eleMas),
  crystalize_eleMas_: (s) => 4000 / 9 * s.eleMas / (1400 + s.eleMas),
  crystalize_multi: (s) => ReactionMatrix["crystalize"].reduce((accu, val, i) => accu + val * Math.pow(s.characterLevel, i), 0),
  crystalize_hit: (s) => (100 + s.crystalize_dmg_ + s.crystalize_eleMas_) / 100 * s.crystalize_multi,
}

const ElementToReactionKeys = {
  physical: [],
  anemo: ["swirl_hit"],
  geo: ["crystalize_hit", "shattered_hit"],
  electro: ["overloaded_hit", "electrocharged_hit", "superconduct_hit"],
  hydro: ["electrocharged_hit", "shattered_hit"],//"hydro_vaporize_multi",
  pyro: ["overloaded_hit"],// "burning_hit","pyro_vaporize_multi", "pyro_melt_multi", 
  cryo: ["shattered_hit", "superconduct_hit"],//"cryo_melt_multi", 
  dendro: []
}
function resMultiplier(res) {
  res = res / 100
  if (res < 0) return 1 - res / 2
  else if (res >= 0.75) return 1 / (res * 4 + 1)
  return 1 - res
}

Object.entries(hitMoves).forEach(([move, moveName]) => {
  StatData[`${move}_dmg_`] = { name: `${moveName} DMG Bonus`, unit: "%" }
  StatData[`${move}_critRate_`] = { name: `${moveName} CRIT Rate Bonus`, unit: "%" }
  StatData[`final_${move}_critRate_`] = { name: `${moveName} CRIT Rate`, unit: "%" }

  Formulas[`final_${move}_critRate_`] = (s) => clamp(s.critRate_ + s[`${move}_critRate_`], 0, 100)
})

Object.entries(hitElements).forEach(([ele, {name: eleName}]) => {
  const opt = { variant: ele }
  // DONT CHANGE. needed for screenshot parsing
  StatData[`${ele}_dmg_`] = { name: `${eleName} DMG Bonus`, unit: "%", ...opt }
  StatData[`${ele}_res_`] = { name: `${eleName} DMG RES`, unit: "%", ...opt }

  StatData[`${ele}_enemyRes_`] = { name: `Enemy ${eleName} DMG RES`, unit: "%", default: 10, ...opt }
  StatData[`${ele}_enemyImmunity`] = { name: `Enemy ${eleName} Immunity`, default: false, ...opt }

  StatData[`${ele}_enemyRes_multi`] = { name: `Enemy ${eleName} RES Multiplier`, unit: "multi", ...opt }
  StatData[`${ele}_bonus_multi`] = { name: `${eleName} Attack Bonus DMG Multiplier`, unit: "multi", ...opt }

  Object.entries(hitTypes).forEach(([type, typeName]) => {
    StatData[`${ele}_elemental_${type}`] = { name: `${eleName} Attack ${typeName}`, ...opt }
    StatData[`${ele}_elemental_${type}_multi`] = { name: `${eleName} Attack ${typeName} Multiplier`, unit: "multi" }

    Formulas[`${ele}_elemental_${type}`] = (s) => s.finalATK * s[`${ele}_elemental_${type}_multi`]
  })

  Formulas[`${ele}_elemental_hit_multi`] = (s) => (1 + (s.dmg_ + s[`${ele}_dmg_`]) / 100) * s.enemyLevel_multi * s[`${ele}_enemyRes_multi`]
  Formulas[`${ele}_elemental_critHit_multi`] = (s) => s[`${ele}_elemental_hit_multi`] * (1 + s.critDMG_ / 100)
  Formulas[`${ele}_elemental_avgHit_multi`] = (s) => s[`${ele}_elemental_hit_multi`] * (1 + s.critDMG_ * s[`critRate_`] / 10000)

  Formulas[`${ele}_enemyRes_multi`] = (s) => s[`${ele}_enemyImmunity`] ? 0 : resMultiplier(s[`${ele}_enemyRes_`])
})

Object.entries(hitMoves).forEach(([move, moveName]) => {
  Object.entries(hitElements).forEach(([ele, {name: eleName}]) => {
    const opt = { variant: ele }
    Object.entries(hitTypes).forEach(([type, typeName]) => {
      StatData[`${ele}_${move}_${type}`] = { name: `${moveName} ${typeName}`, ...opt }
      StatData[`${ele}_${move}_${type}_multi`] = { name: `${moveName} ${typeName} Multiplier`, unit: "multi", ...opt }

      Formulas[`${ele}_${move}_${type}`] = (s) => s.finalATK * s[`${ele}_${move}_${type}_multi`]
    })

    Formulas[`${ele}_${move}_hit_multi`] = (s) => (1 + (s.dmg_ + s[`${ele}_dmg_`] + s[`${move}_dmg_`]) / 100) * s.enemyLevel_multi * s[`${ele}_enemyRes_multi`]
    Formulas[`${ele}_${move}_critHit_multi`] = (s) => s[`${ele}_${move}_hit_multi`] * (1 + s.critDMG_ / 100)
    Formulas[`${ele}_${move}_avgHit_multi`] = (s) => s[`${ele}_${move}_hit_multi`] * (1 + s.critDMG_ * s[`final_${move}_critRate_`] / 10000)
  })
})

Object.entries(transformativeReactions).forEach(([reaction, [reactionName, ele, baseMulti]]) => {
  let opt = {}
  if (ele) opt.variant = reaction
  StatData[`${reaction}_hit`] = { name: `${reactionName} DMG`, ...opt }
  StatData[`${reaction}_dmg_`] = { name: `${reactionName} DMG Bonus`, unit: "%", ...opt }
  StatData[`${reaction}_multi`] = { name: `${reactionName} Multiplier`, unit: "multi", ...opt }

  Formulas[`${reaction}_multi`] = (s) => ReactionMatrix[reaction].reduce((accu, val, i) => accu + val * Math.pow(s.characterLevel, i), 0)
  Formulas[`${reaction}_hit`] = (s) => (100 + s.transformative_dmg_ + s[`${reaction}_dmg_`]) / 100 * s[`${reaction}_multi`] * s[`${ele}_enemyRes_multi`]
})

Object.entries(amplifyingReactions).forEach(([reaction, [name, variants]]) => {
  const opt = { variant: reaction }
  StatData[`${reaction}_dmg_`] = { name: `${name} DMG Bonus`, unit: "%" }
  Object.entries(variants).forEach(([ele, baseMulti]) => {
    StatData[`${ele}_${reaction}_multi`] = { name: `${name} Multiplier`, unit: "multi", ...opt }
    Formulas[`${ele}_${reaction}_multi`] = (s) => baseMulti * (100 + s.amplificative_dmg_ + s[`${reaction}_dmg_`]) / 100
    Object.entries(hitTypes).forEach(([type, typeName]) => {
      StatData[`${ele}_${reaction}_elemental_${type}`] = { name: `${name} ${typeName}`, ...opt }
      Formulas[`${ele}_${reaction}_elemental_${type}`] = (s) => s[`${ele}_elemental_${type}`] * s[`${ele}_${reaction}_multi`]
      Object.entries(hitMoves).forEach(([move, moveName]) => {
        StatData[`${ele}_${reaction}_${move}_${type}`] = { name: `${name} ${moveName} ${typeName}`, ...opt }
        Formulas[`${ele}_${reaction}_${move}_${type}`] = (s) => s[`${ele}_${move}_${type}`] * s[`${ele}_${reaction}_multi`]
      })
    })
  })
})
if (process.env.NODE_ENV === "development") console.log(StatData)

//assume all the dependency for the modifiers are part of the dependencyKeys as well
function PreprocessFormulas(dependencyKeys, modifiers = {}) {
  const preFormulas = dependencyKeys.map(key => {
    if (modifiers[key]) {
      const modifierFunc = (stat, initial) => Object.entries(modifiers[key]).reduce((accu, [mkey, multiplier]) =>
        accu + stat[mkey] * multiplier, initial)
      if (key in Formulas) return [key, (s) => modifierFunc(s, Formulas[key](s))]
      return [key, (s) => modifierFunc(s, s[key] ?? StatData?.[key]?.default ?? 0)]
    } else {
      if (key in Formulas) return [key, Formulas[key]]
      return [key, (s) => (s[key] ?? StatData?.[key]?.default ?? 0)]
    }
  })
  return stat => preFormulas.forEach(([key, formula]) => stat[key] = formula(stat))
}

export {
  Formulas,
  StatData,
  ElementToReactionKeys,
  PreprocessFormulas,
}
