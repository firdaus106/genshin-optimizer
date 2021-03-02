import ElementalData from "./Data/ElementalData";
import { clamp } from "./Util/Util";

const StatData = {
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
  hp: { name: "HP", pretty: "HP Flat" },//flat hp
  hp_: { name: "HP", unit: "%", pretty: "HP Percent" },
  atk: { name: "ATK", pretty: "ATK Flat" },
  atk_: { name: "ATK", unit: "%", pretty: "ATK Percent" },
  def: { name: "DEF", pretty: "DEF Flat" },
  def_: { name: "DEF", unit: "%", pretty: "DEF Percent" },
  dmg_: { name: "All DMG Bonus", unit: "%" },

  // Attack-related Character, Weapon & Artifact Stats
  finalHP: { name: "HP", pretty: "HP Final" },
  finalATK: { name: "ATK", pretty: "ATK Final" },
  findlDEF: { name: "DEF", pretty: "DEF Final" },

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

  // Multi
  ampReactionBase_multi: { name: "Amplifying Reaction Base Multiplier", unit: "multi" },

  // Elemental interaction
  melt_dmg_: { name: "Melt DMG Bonus", unit: "%", variant: "melt" },
  vaporize_dmg_: { name: "Vaporize DMG Bonus", unit: "%", variant: "vaporize" },

  eleMasX: { name: "Elemental Mastery Multiplier X", unit: "multi" },
  eleMasY: { name: "Elemental Mastery Multiplier Y", unit: "multi" },
  eleMasZ: { name: "Elemental Mastery Multiplier Z", unit: "multi" },

  // Enemy
  enemyLevel: { name: "Enemy Level" },
  enemyLevel_multi: { name: "Enemy Level Multiplier", unit: "multi" },
}
const Formulas = {
  // Basic Stats
  baseATK: (s) => s.characterATK + s.weaponATK,
  finalATK: (s) => s.baseATK * (1 + s.atk_ / 100) + s.atk,
  finalHP: (s) => s.characterHP * (1 + s.hp_ / 100) + s.hp,
  findlDEF: (s) => s.characterDEF * (1 + s.def_ / 100) + s.def,

  enemyLevel_multi: (s) => (100 + s.characterLevel) / (100 + s.enemyLevel + 100 + s.characterLevel),

  // Elemental Reactions
  overloaded_hit: (s) => (1 + s.overloaded_dmg_ / 100) * s.eleMasY * s.overloaded_multi * s.pyro_enemyRes_multi,
  electrocharged_hit: (s) => (1 + s.electrocharged_dmg_ / 100) * s.eleMasY * s.electrocharged_multi * s.electro_enemyRes_multi,
  superconduct_hit: (s) => (1 + s.superconduct_dmg_ / 100) * s.eleMasY * s.superconduct_multi * s.cryo_enemyRes_multi,
  // burning_hit: (s) => "NO_FORMULA",//(1 + s.burning_dmg_ / 100)
  swirl_hit: (s) => (1 + s.swirl_dmg_ / 100) * s.eleMasY * s.swirl_multi * s.anemo_enemyRes_multi,
  shattered_hit: (s) => (1 + s.shattered_dmg_ / 100) * s.eleMasY * s.shattered_multi * s.physical_enemyRes_multi,
  crystalize_hit: (s) => (1 + s.crystalize_dmg_ / 100) * s.eleMasZ * s.crystalize_multi,

  // Elemental DMG multipliers
  pyro_vaporize_multi: (s) => (1 + s.vaporize_dmg_ / 100) * 1.5 * s.ampReactionBase_multi,
  hydro_vaporize_multi: (s) => (1 + s.vaporize_dmg_ / 100) * 2 * s.ampReactionBase_multi,
  pyro_melt_multi: (s) => (1 + s.melt_dmg_ / 100) * 2 * s.ampReactionBase_multi,
  cryo_melt_multi: (s) => (1 + s.melt_dmg_ / 100) * 1.5 * s.ampReactionBase_multi,
  ampReactionBase_multi: (s) => ampliBase(s.eleMas),

  eleMasX: (s) => (1 + (25 / 9 * s.eleMas / (1401 + s.eleMas))),
  eleMasY: (s) => (1 + (60 / 9 * s.eleMas / (1401 + s.eleMas))),
  eleMasZ: (s) => (1 + (40 / 9 * s.eleMas / (1401 + s.eleMas))),
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
const ReactionMatrix = {
  overloaded: [37.4371542286, -4.3991155718, 0.9268181504, -0.0314790536, 0.0005189440, -0.0000027646],
  superconduct: [7.4972486411, -0.4750909512, 0.1836799174, -0.0064237710, 0.0001110078, -0.0000006038],
  electrocharged: [20.8340255487, -1.6987232790, 0.4742385201, -0.0162160738, 0.0002746679, -0.0000014798],
  shattered: [31.2160750111, -3.7397755267, 0.7174530144, -0.0239673351, 0.0003895953, -0.0000020555],
  swirl: [13.5157684329, -1.7733381829, 0.3097567417, -0.0103922088, 0.0001679502, -0.0000008854],
  crystalize: [83.06561, -4.42541, 0.5568372, -0.01637168, 0.0002253889, -0.000001088197]
}
function ampliBase(eleMas) {
  return 1 + 0.189266831 * eleMas * Math.exp(-0.000505 * eleMas) / 100
}

const hitTypes = { hit: "DMG", avgHit: "Avg. DMG", critHit: "CRIT Hit DMG" }
const hitMoves = { normal: "Normal Attack", charged: "Charged Attack", plunging: "Plunging Attack", skill: "Ele. Skill", burst: "Ele. Burst" }
const hitElements = ElementalData
const transformativeReactions = {
  overloaded: [ "pyro", "Overloaded" ],
  shattered: [ "physical", "Shattered" ],
  electrocharged: [ "electro", "Electro-Charged" ],
  superconduct: [ "cryo", "Superconduct" ],
  swirl: [ "anemo", "Swirl" ],
  burning: [ null, "Burning" ],
  crystalize: [ null, "Crystalize" ],
}
const amplifyingReactions = { vaporize: { pyro: "Vaporized (Pyro)", hydro: "Vaporized (Hydro)" }, melt: { pyro: "Melt (Pyro)", cryo: "Melt (Cryo)" } }

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
    StatData[`${ele}_${type}`] = { name: `${eleName} Attack ${typeName}`, ...opt }
  })

  Formulas[`${ele}_hit`] = (s) => s.finalATK * (1 + s.dmg_ + s[`${ele}_dmg_`]) * s.enemyLevel_multi * s[`${ele}_enemyRes_multi`]
  Formulas[`${ele}_critHit`] = (s) => s[`${ele}_hit`] * (1 + s.critDMG_ / 100)
  Formulas[`${ele}_avgHit`] = (s) => s[`${ele}_hit`] * (1 + s.critDMG_ * s[`critRate_`] / 100)

  Formulas[`${ele}_enemyRes_multi`] = (s) => s[`${ele}_enemyImmunity`] ? 0 : resMultiplier(s[`${ele}_enemyRes_`])
})

Object.entries(hitMoves).forEach(([move, moveName]) => {
  Object.entries(hitElements).forEach(([ele, {name: eleName}]) => {
    const opt = { variant: ele }
    Object.entries(hitTypes).forEach(([type, typeName]) => {
      StatData[`${ele}_${move}_${type}`] = { name: `${eleName} ${moveName} ${typeName}`, ...opt }
    })
    Formulas[`${ele}_${move}_hit`] = (s) => s.finalATK * (1 + s.dmg_ + s[`${ele}_dmg_`] + s[`${move}_dmg_`]) * s.enemyLevel_multi * s[`${ele}_enemyRes_multi`]
    Formulas[`${ele}_${move}_critHit`] = (s) => s[`${ele}_${move}_hit`] * (1 + s.critDMG_ / 100)
    Formulas[`${ele}_${move}_avgHit`] = (s) => s[`${ele}_${move}_hit`] * (1 + s.critDMG_ * s[`final_${move}_critRate_`] / 10000)
  })
})

Object.entries(transformativeReactions).forEach(([reaction, [ele, reactionName]]) => {
  let opt = {}
  if (ele) opt.variant = ele
  StatData[`${reaction}_dmg_`] = { name: `${reactionName} DMG Bonus`, unit: "%", ...opt }
  StatData[`${reaction}_multi`] = { name: `${reactionName} Multiplier`, unit: "multi", ...opt }

  if (ReactionMatrix[reaction])
    Formulas[`${reaction}_multi`] = (s) => ReactionMatrix[reaction].reduce((accu, val, i) => accu + val * Math.pow(s.characterLevel, i), 0)
})

Object.entries(amplifyingReactions).forEach(([reaction, variants]) => {
  Object.entries(variants).forEach(([ele, reactionName]) => {
    const opt = { variant: ele }
    StatData[`${ele}_${reaction}_multi`] = { name: `${reactionName} Multiplier`, unit: "multi", ...opt };
    Object.entries(hitTypes).forEach(([type, typeName]) => {
      StatData[`${ele}_${reaction}_${type}`] = { name: `${reactionName} ${typeName}`, ...opt }
      Formulas[`${ele}_${reaction}_${type}`] = (s) => s[`${ele}_${reaction}_multi`] * s[`${ele}_${type}`]
      Object.entries(hitMoves).forEach(([move, moveName]) => {
        StatData[`${ele}_${reaction}_${move}_${type}`] = { name: `${reactionName} ${moveName} ${typeName}`, ...opt }
        Formulas[`${ele}_${reaction}_${move}_${type}`] = (s) => s[`${ele}_${reaction}_multi`] * s[`${ele}_${move}_${type}`]
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
  ReactionMatrix,
  PreprocessFormulas,
}
