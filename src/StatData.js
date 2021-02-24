import ElementalData from "./Data/ElementalData";
import { clamp, deepClone } from "./Util/Util";

const StatData = {
  //HP
  base_hp: { name: "HP", pretty: "HP Base" },
  hp: { name: "HP", pretty: "HP Flat" },//flat hp
  hp_: { name: "HP", unit: "%", pretty: "HP Percent" },
  final_hp: { name: "HP", pretty: "HP Final" },
  //ATK
  character_atk: { name: "ATK", pretty: "ATK Character Base" },
  base_atk: { name: "ATK", pretty: "ATK Base" },//character atk + weapon atk
  atk: { name: "ATK", pretty: "ATK Flat" },
  atk_: { name: "ATK", unit: "%", pretty: "ATK Percent" },
  final_atk: { name: "ATK", pretty: "ATK Final" },
  weapon_atk: { name: "Weapon ATK", pretty: "ATK Weapon" },
  //DEF
  base_def: { name: "DEF", pretty: "DEF Base" },
  def: { name: "DEF", pretty: "DEF Flat" },
  def_: { name: "DEF", unit: "%", pretty: "DEF Percent" },
  final_def: { name: "DEF", pretty: "DEF Final" },

  ele_mas: { name: "Elemental Mastery", },
  ener_rech_: { name: "Energy Recharge", unit: "%" },
  crit_rate_: { name: "CRIT Rate", unit: "%" },
  crit_dmg_: { name: "CRIT DMG", unit: "%" },
  heal_: { name: "Healing Bonus", unit: "%" },
  stam: { name: "Stamina" },
  inc_heal_: { name: "Incoming Healing Bonus", unit: "%" },
  pow_shield_: { name: "Powerful Shield", unit: "%" },

  // % DMG Bonus
  normal_dmg_: { name: "Normal Attack DMG Bonus", unit: "%" },
  charged_dmg_: { name: "Charged Attack DMG Bonus", unit: "%" },
  plunging_dmg_: { name: "Plunging Attack DMG Bonus", unit: "%" },
  skill_dmg_: { name: "Ele. Skill DMG Bonus", unit: "%" },
  burst_dmg_: { name: "Ele. Burst DMG Bonus", unit: "%" },
  // Crit Rate
  normal_crit_rate_: { name: "Nomral Attack CRIT Rate", unit: "%" },
  charged_crit_rate_: { name: "Charged Attack CRIT Rate", unit: "%" },
  skill_crit_rate_: { name: "Ele. Skill CRIT Rate", unit: "%" },
  burst_crit_rate_: { name: "Ele. Burst CRIT Rate", unit: "%" },
  // Multi
  normal_crit_multi: { name: "Normal Attack Crit Multiplier", unit: "multi" },
  charged_crit_multi: { name: "Charged Attack Crit Multiplier", unit: "multi" },
  skill_crit_multi: { name: "Ele. Skill Crit Multiplier", unit: "multi" },
  burst_crit_multi: { name: "Ele. Burst Crit Multiplier", unit: "multi" },
  crit_dmg_multi: { name: "Crit Hit Multiplier", unit: "multi" },
  crit_multi: { name: "Crit Multiplier", unit: "multi" },
  amp_reaction_base_multi: { name: "Amplifying Reaction Base Multiplier", unit: "multi" },

  // CD
  cd_red_: { name: "CD Red.", unit: "%" },
  skill_cd_red: { name: "Ele. Skill CD Red.", unit: "%" },
  burst_cd_red: { name: "Ele. Burst CD Red.", unit: "%" },

  dmg_: { name: "All DMG Bonus", unit: "%" },//general all damage increase
  move_spd_: { name: "Movement SPD", unit: "%" },
  atk_spd_: { name: "ATK SPD", unit: "%" },
  weakspot_dmg_: { name: "Weakspot DMG", unit: "%" },
  stamina_dec_: { name: "Stamina Consumption Dec.", unit: "%" },
  stamina_gliding_dec_: { name: "Gliding Stamina Consumption Dec.", unit: "%" },
  stamina_charged_dec_: { name: "Charged Attack Stamina Consumption Dec.", unit: "%" },

  // Elemental interaction
  melt_dmg_: { name: "Melt DMG Bonus", unit: "%", variant: "melt" },
  vaporize_dmg_: { name: "Vaporize DMG Bonus", unit: "%", variant: "vaporize" },

  ele_mas_x: { name: "Elemental Mastery Multiplier X", unit: "multi" },
  ele_mas_y: { name: "Elemental Mastery Multiplier Y", unit: "multi" },
  ele_mas_z: { name: "Elemental Mastery Multiplier Z", unit: "multi" },

  // Character stuff
  character_ele: { name: "Character Element Key", default: "anemo" },
  character_level: { name: "Character Level", default: 1 },
  // Enemy
  enemy_level: { name: "Enemy Level" },
  enemy_level_multi: { name: "Enemy Level Multiplier", unit: "multi" },
}
const eleStatData = {
  // DMG
  normal_dmg: { name: "Normal Attack DMG" },
  charged_dmg: { name: "Charged Attack DMG" },
  plunging_dmg: { name: "Plunging Attack DMG" },
  skill_dmg: { name: "Ele. Skill DMG" },
  burst_dmg: { name: "Ele. Burst DMG" },
  phy_ele_dmg: { name: "Physical Attack DMG" },
  ele_dmg: { name: "Elemental Attack DMG" },
  // Crit DMG
  normal_crit_dmg: { name: "Normal Attack CRIT Hit DMG" },
  charged_crit_dmg: { name: "Charged Attack CRIT Hit DMG" },
  plunging_crit_dmg: { name: "Plunging Attack CRIT Hit DMG" },
  skill_crit_dmg: { name: "Ele. Skill CRIT Hit DMG" },
  burst_crit_dmg: { name: "Ele. Burst CRIT Hit DMG" },
  phy_ele_crit_dmg: { name: "Physical Attack CRIT Hit DMG" },
  ele_crit_dmg: { name: "Elemental Attack CRIT Hit DMG" },
  // Avg DMG
  normal_avg_dmg: { name: "Normal Attack Avg. DMG" },
  charged_avg_dmg: { name: "Charged Attack Avg. DMG" },
  plunging_avg_dmg: { name: "Plunging Attack Avg. DMG" },
  skill_avg_dmg: { name: "Ele. Skill Avg. DMG" },
  burst_avg_dmg: { name: "Ele. Burst Avg. DMG" },
  phy_ele_avg_dmg: { name: "Physical Attack Avg. DMG" },
  ele_avg_dmg: { name: "Elemental Attack Avg. DMG" },
  // Bonus Multi
  normal_bonus_multi: { name: "Normal Attack Bonus DMG Multiplier", unit: "multi" },
  charged_bonus_multi: { name: "Charged Attack Bonus DMG Multiplier", unit: "multi" },
  plunging_bonus_multi: { name: "Plunging Attack Bonus DMG Multiplier", unit: "multi" },
  skill_bonus_multi: { name: "Ele. Skill Bonus DMG Multiplier", unit: "multi" },
  burst_bonus_multi: { name: "Ele. Burst Bonus DMG Multiplier", unit: "multi" },
  
  ele_dmg_: { name: "DMG Bonus", unit: "%" },//will expand to "Anemo DMG Bonus" DONT CHANGE needed for screenshot parsing
  ele_res_: { name: "DMG RES", unit: "%" },//will expand to "Anemo DMG RES"
  ele_bonus_multi: { name: "Elemental Attack Bonus DMG Multiplier", unit: "multi" },
  enemy_ele_res_: { name: "Enemy Elemental RES", unit: "%", default: 10 },
  enemy_ele_res_multi: { name: "Enemy Elemental RES Multiplier", unit: "multi" },
  enemy_ele_immunity: { name: "Enemy Elemental Immunity", default: false },  
}
function resMultiplier(res) {
  res = res / 100
  if (res < 0) return 1 - res / 2
  else if (res >= 0.75) return 1 / (res * 4 + 1)
  return 1 - res
}
const ElementToReactionKeys = {
  physical: [],
  anemo: ["swirl_dmg"],
  geo: ["crystalize_dmg", "shatter_dmg"],
  electro: ["overloaded_dmg", "electrocharged_dmg", "superconduct_dmg"],
  hydro: ["electrocharged_dmg", "shatter_dmg"],//"hydro_vaporize_multi",
  pyro: ["overloaded_dmg"],// "burning_dmg","pyro_vaporize_multi", "pyro_melt_multi", 
  cryo: ["shatter_dmg", "superconduct_dmg"],//"cryo_melt_multi", 
  // dendro: { name: "Dendro" }
}
const ReactionMatrix = {
  overloaded: [37.4371542286, -4.3991155718, 0.9268181504, -0.0314790536, 0.0005189440, -0.0000027646],
  superconduct: [7.4972486411, -0.4750909512, 0.1836799174, -0.0064237710, 0.0001110078, -0.0000006038],
  electrocharged: [20.8340255487, -1.6987232790, 0.4742385201, -0.0162160738, 0.0002746679, -0.0000014798],
  shattered: [31.2160750111, -3.7397755267, 0.7174530144, -0.0239673351, 0.0003895953, -0.0000020555],
  swirl: [13.5157684329, -1.7733381829, 0.3097567417, -0.0103922088, 0.0001679502, -0.0000008854],
  crystalize: [83.06561, -4.42541, 0.5568372, -0.01637168, 0.0002253889, -0.000001088197]
}
function ampliBase(ele_mas) {
  return 1 + 0.189266831 * ele_mas * Math.exp(-0.000505 * ele_mas) / 100
}
//formulas for calculating
const Formulas = {
  //HP
  final_hp: (s) => s.base_hp * (1 + s.hp_ / 100) + s.hp,
  //ATK
  base_atk: (s) => s.character_atk + s.weapon_atk,
  final_atk: (s) => s.base_atk * (1 + s.atk_ / 100) + s.atk,
  //DEF
  final_def: (s) => s.base_def * (1 + s.def_ / 100) + s.def,

  // Multi
  normal_crit_multi: (s) => (1 + (clamp(s.crit_rate_ + s.normal_crit_rate_, 0, 100) / 100) * s.crit_dmg_ / 100),
  charged_crit_multi: (s) => (1 + (clamp(s.crit_rate_ + s.charged_crit_rate_, 0, 100) / 100) * s.crit_dmg_ / 100),
  skill_crit_multi: (s) => (1 + (clamp(s.crit_rate_ + s.skill_crit_rate_, 0, 100) / 100) * s.crit_dmg_ / 100),
  burst_crit_multi: (s) => (1 + (clamp(s.crit_rate_ + s.burst_crit_rate_, 0, 100) / 100) * s.crit_dmg_ / 100),
  crit_multi: (s) => (1 + (clamp(s.crit_rate_, 0, 100) / 100) * (s.crit_dmg_ / 100)),
  crit_dmg_multi: (s) => (1 + s.crit_dmg_ / 100),

  enemy_level_multi: (s) => (100 + s.character_level) / (100 + s.enemy_level + 100 + s.character_level),
  physical_enemy_ele_res_multi: (s) => s.physical_enemy_ele_immunity ? 0 : resMultiplier(s.physical_enemy_ele_res_),

  //Elemental Reactions
  overloaded_dmg: (s) => (1 + s.overloaded_dmg_ / 100) * s.ele_mas_y * s.overloaded_multi * s.pyro_enemy_ele_res_multi,
  overloaded_multi: (s) => ReactionMatrix.overloaded.reduce((accu, val, i) => accu + val * Math.pow(s.character_level, i), 0),
  electrocharged_dmg: (s) => (1 + s.electrocharged_dmg_ / 100) * s.ele_mas_y * s.electrocharged_multi * s.electro_enemy_ele_res_multi,
  electrocharged_multi: (s) => ReactionMatrix.electrocharged.reduce((accu, val, i) => accu + val * Math.pow(s.character_level, i), 0),
  superconduct_dmg: (s) => (1 + s.superconduct_dmg_ / 100) * s.ele_mas_y * s.superconduct_multi * s.cryo_enemy_ele_res_multi,
  superconduct_multi: (s) => ReactionMatrix.superconduct.reduce((accu, val, i) => accu + val * Math.pow(s.character_level, i), 0),

  // burning_dmg: (s) => "NO_FORMULA",//(1 + s.burning_dmg_ / 100)
  swirl_dmg: (s) => (1 + s.swirl_dmg_ / 100) * s.ele_mas_y * s.swirl_multi * s.anemo_enemy_ele_res_multi,
  swirl_multi: (s) => ReactionMatrix.swirl.reduce((accu, val, i) => accu + val * Math.pow(s.character_level, i), 0),
  shatter_dmg: (s) => (1 + s.shatter_dmg_ / 100) * s.ele_mas_y * s.shatter_multi * s.physical_enemy_ele_res_multi,
  shatter_multi: (s) => ReactionMatrix.shattered.reduce((accu, val, i) => accu + val * Math.pow(s.character_level, i), 0),
  crystalize_dmg: (s) => (1 + s.crystalize_dmg_ / 100) * s.ele_mas_z * s.crystalize_multi,
  crystalize_multi: (s) => ReactionMatrix.crystalize.reduce((accu, val, i) => accu + val * Math.pow(s.character_level, i), 0),

  pyro_vaporize_multi: (s) => (1 + s.vaporize_dmg_ / 100) * 1.5 * s.amp_reaction_base_multi,
  hydro_vaporize_multi: (s) => (1 + s.vaporize_dmg_ / 100) * 2 * s.amp_reaction_base_multi,

  pyro_melt_multi: (s) => (1 + s.melt_dmg_ / 100) * 2 * s.amp_reaction_base_multi,
  cryo_melt_multi: (s) => (1 + s.melt_dmg_ / 100) * 1.5 * s.amp_reaction_base_multi,
  amp_reaction_base_multi: (s) => ampliBase(s.ele_mas),

  ele_mas_x: (s) => (1 + (25 / 9 * s.ele_mas / (1401 + s.ele_mas))),
  ele_mas_y: (s) => (1 + (60 / 9 * s.ele_mas / (1401 + s.ele_mas))),
  ele_mas_z: (s) => (1 + (40 / 9 * s.ele_mas / (1401 + s.ele_mas))),
}

//The formulas here will generate formulas for every element, for example pyro_skill_avg_dmg from skill_avg_dmg
const eleFormulas = {
  normal_dmg: (s, ele) => s.final_atk * s[`${ele}_normal_bonus_multi`] * s.enemy_level_multi * s[`${ele}_enemy_ele_res_multi`],
  normal_crit_dmg: (s, ele) => s[`${ele}_normal_dmg`] * s.crit_dmg_multi,
  normal_avg_dmg: (s, ele) => s[`${ele}_normal_dmg`] * s.normal_crit_multi,
  normal_bonus_multi: (s, ele) => (1 + (s[`${ele}_ele_dmg_`] + s.normal_dmg_ + s.dmg_) / 100),

  charged_dmg: (s, ele) => s.final_atk * s[`${ele}_charged_bonus_multi`] * s.enemy_level_multi * s[`${ele}_enemy_ele_res_multi`],
  charged_crit_dmg: (s, ele) => s[`${ele}_charged_dmg`] * s.crit_dmg_multi,
  charged_avg_dmg: (s, ele) => s[`${ele}_charged_dmg`] * s.charged_crit_multi,
  charged_bonus_multi: (s, ele) => (1 + (s[`${ele}_ele_dmg_`] + s.charged_dmg_ + s.dmg_) / 100),

  plunging_dmg: (s, ele) => s.final_atk * s[`${ele}_plunging_bonus_multi`] * s.enemy_level_multi * s[`${ele}_enemy_ele_res_multi`],
  plunging_crit_dmg: (s, ele) => s[`${ele}_plunging_dmg`] * s.crit_dmg_multi,
  plunging_avg_dmg: (s, ele) => s[`${ele}_plunging_dmg`] * s.crit_multi,
  plunging_bonus_multi: (s, ele) => (1 + (s[`${ele}_ele_dmg_`] + s.plunging_dmg_ + s.dmg_) / 100),

  ele_dmg: (s, ele) => s.final_atk * s[`${ele}_ele_bonus_multi`] * s.enemy_level_multi * s[`${ele}_enemy_ele_res_multi`],
  ele_crit_dmg: (s, ele) => s[`${ele}_ele_dmg`] * s.crit_dmg_multi,
  ele_avg_dmg: (s, ele) => s[`${ele}_ele_dmg`] * s.crit_multi,
  ele_bonus_multi: (s, ele) => (1 + (s[`${ele}_ele_dmg_`] + s.dmg_) / 100),

  skill_dmg: (s, ele) => s.final_atk * s[`${ele}_skill_bonus_multi`] * s.enemy_level_multi * s[`${ele}_enemy_ele_res_multi`],
  skill_crit_dmg: (s, ele) => s[`${ele}_skill_dmg`] * s.crit_dmg_multi,
  skill_avg_dmg: (s, ele) => s[`${ele}_skill_dmg`] * s.skill_crit_multi,
  skill_bonus_multi: (s, ele) => (1 + (s[`${ele}_ele_dmg_`] + s.skill_dmg_ + s.dmg_) / 100),

  burst_dmg: (s, ele) => s.final_atk * s[`${ele}_burst_bonus_multi`] * s.enemy_level_multi * s[`${ele}_enemy_ele_res_multi`],
  burst_crit_dmg: (s, ele) => s[`${ele}_burst_dmg`] * s.crit_dmg_multi,
  burst_avg_dmg: (s, ele) => s[`${ele}_burst_dmg`] * s.burst_crit_multi,
  burst_bonus_multi: (s, ele) => (1 + (s[`${ele}_ele_dmg_`] + s.burst_dmg_ + s.dmg_) / 100),

  enemy_ele_res_multi: (s, ele) => s[`${ele}_enemy_ele_immunity`] ? 0 : resMultiplier(s[`${ele}_enemy_ele_res_`]),
};
//nontransformation reactions  
[["overloaded", "Overloaded"], ["electrocharged", "Electro-Charged"], ["superconduct", "Superconduct"], ["burning", "Burning"], ["swirl", "Swirl"], ["shatter", "Shattered"], ["crystalize", "Crystalize"]].forEach(([reactionKey, reactionName]) =>
  [["dmg", "DMG"], ["dmg_", "DMG Bonus", { unit: "%" }], ["multi", "Multiplier", { unit: "multi" }]].forEach(([dmgKey, dmgName, props = {}]) => {
    StatData[`${reactionKey}_${dmgKey}`] = {
      name: `${reactionName} ${dmgName}`,
      variant: reactionKey,
      ...props
    };
  }));

//Add Vaporize and Melt stats
[["pyro_vaporize", "Vaporize(Pyro)", "vaporize", "pyro"], ["hydro_vaporize", "Vaporize(Hydro)", "vaporize", "hydro"], ["pyro_melt", "Melt(Pyro)", "melt", "pyro"], ["cryo_melt", "Melt(Cryo)", "melt", "cryo"]].forEach(([reactionKey, reactionName, variant, baseEle]) => {
  [["multi", "Multiplier", { unit: "multi" }]].forEach(([dmgKey, dmgName, props = {}]) => {
    StatData[`${reactionKey}_${dmgKey}`] = {
      name: `${reactionName} ${dmgName}`,
      variant,
      ...props
    };
  });
  [["normal", "Nomal Attack"], ["charged", "Charged Attack"], ["plunging", "Plunging Attack"], ["skill", "Ele. Skill"], ["burst", "Ele. Burst"], ["ele", "Elemental"]].forEach(([atkType, atkTypeName]) =>
    [["dmg", "DMG"], ["avg_dmg", "Avg. DMG"], ["crit_dmg", "CRIT Hit DMG"]].forEach(([dmgMode, dmgModeName]) => {
      let reactionDMGKey = `${reactionKey}_${atkType}_${dmgMode}`
      StatData[reactionDMGKey] = { name: `${reactionName} ${atkTypeName} ${dmgModeName}`, variant }
      let baseDmg = `${baseEle}_${atkType}_${dmgMode}`
      Formulas[reactionDMGKey] = (s) => s[`${reactionKey}_multi`] * s[baseDmg]
    }));
});

//add Elemental entries to stats. we use the keys from eleFormulas before it gets expanded to elementals
["ele_dmg_", "ele_res_", "enemy_ele_res_", "enemy_ele_immunity", ...Object.keys(eleFormulas)].forEach(key => {
  let obj = eleStatData[key]
  Object.keys(ElementalData).forEach(eleKey => {
    let ele_key = `${eleKey}_${key}`
    StatData[ele_key] = deepClone(obj)
    if (key === "enemy_ele_res_")
      StatData[ele_key].name = `Enemy ${ElementalData[eleKey].name} RES`
    else if (key === "enemy_ele_res_multi")
      StatData[ele_key].name = `Enemy ${ElementalData[eleKey].name} RES Multiplier`
    else if (key === "enemy_ele_immunity")
      StatData[ele_key].name = `Enemy ${ElementalData[eleKey].name} Immunity`
    else
      StatData[ele_key].name = `${ElementalData[eleKey].name} ${obj.name}`
    StatData[ele_key].variant = eleKey
  })
  // delete StatData[key]
})
if (process.env.NODE_ENV === "development") console.log(StatData)

//expand the eleFormulas to elementals
Object.entries(eleFormulas).forEach(([key, func]) =>
  Object.keys(ElementalData).forEach(eleKey =>
    Object.defineProperty(Formulas, `${eleKey}_${key}`, {
      configurable: true,
      enumerable: true,
      writable: true,
      value: (obj) => (func)(obj, eleKey),
    })))

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
