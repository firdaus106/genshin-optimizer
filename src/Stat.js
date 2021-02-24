import ElementalData from "./Data/ElementalData";
import { ReactionMatrix, Formulas, StatData } from "./StatData";

export default class Stat {
  //do not instantiate.
  constructor() {
    if (this instanceof Stat)
      throw Error('A static class cannot be instantiated.');
  }
  static getStatName = (key, defVal = "") =>
    (htmlStatsData[key] || StatData[key]?.name) || defVal
  static getStatNamePretty = (key, defVal = "") =>
    (htmlStatsData[key] || StatData[key]?.pretty || StatData[key]?.name) || defVal
  static getStatNameRaw = (key, defVal = "") =>
    StatData[key]?.name || defVal
  static getStatNameWithPercent = (key, defVal = "") => {
    let name = this.getStatName(key, defVal)
    if (name !== defVal && (key === "hp_" || key === "atk_" || key === "def_"))
      name += "%"
    return name;
  }
  static getStatVariant = (key, defVal = "") =>
    StatData[key]?.variant || defVal
  static getStatUnit = (key, defVal = "") =>
    StatData[key]?.unit === "multi" ? defVal : (StatData[key]?.unit || defVal)

  static fixedUnit = (key) => {
    if (StatData[key]?.unit === "multi") return 3
    let unit = Stat.getStatUnit(key)
    return unit === "%" ? 1 : 0
  }
  static printStat = (statKey, stats) =>
    f({ stats, expand: false }, statKey)

  static getPrintableFormulaStatKeyList = (statList = [], modifiers = {}) => {
    let formulaKeys = Object.keys(FormulaText)
    let modifiersKeys = Object.keys(modifiers)
    return statList.filter(statKey => formulaKeys.includes(statKey) || modifiersKeys.includes(statKey))
  }

  static printFormula = (statKey, stats, modifiers = {}, expand = true) => {
    const modifierText = Object.entries(modifiers?.[statKey] ?? []).map(([mkey, multiplier]) =>
      <span key={statKey + mkey} className="text-nowrap"> + {this.printStat(mkey, stats)} * {multiplier?.toFixed?.(3) ?? multiplier}</span>)
    if (typeof FormulaText?.[statKey] === "function")
      return <span>{FormulaText[statKey]({ stats, expand })}{modifierText}</span>
    else
      return <span>Basic Stats from artifacts/weapon{modifierText}</span>
  }
}
//generate html tags based on tagged variants of the statData
const htmlStatsData = Object.fromEntries(Object.entries(StatData).filter(([key, obj]) => obj.variant).map(([key, obj]) => [key, (<span className={`text-${obj.variant} text-nowrap`}>{obj.name}</span>)]))

function f(options, statKey) {
  let { stats, expand = true } = options
  if (!stats) return
  if (expand && FormulaText?.[statKey])
    return <span>( {FormulaText[statKey](options)} )</span>
  let statName = Stat.getStatNamePretty(statKey)
  let statUnit = Stat.getStatUnit(statKey)
  let fixedUnit = Stat.fixedUnit(statKey)
  let value = stats?.[statKey]?.toFixed?.(fixedUnit) || stats?.[statKey]
  return <span className="text-nowrap"><b>{statName}</b> <span className="text-info">{value}{statUnit}</span></span>
}

const FormulaText = {
  //HP
  final_hp: (o) => <span>{f(o, "base_hp")} * ( 1 + {f(o, "hp_")} ) + {f(o, "hp")}</span>,
  //ATK
  base_atk: (o) => <span>{f(o, "character_atk")} + {f(o, "weapon_atk")} </span>,
  final_atk: (o) => <span>{f(o, "base_atk")} * ( 1 + {f(o, "atk_")} ) + {f(o, "atk")}</span>,
  //DEF
  final_def: (o) => <span>{f(o, "base_def")} * ( 1 + {f(o, "def_")} ) + {f(o, "def")}</span>,

  crit_dmg_multi: (o) => <span>( 1 + {f(o, "crit_dmg_")} )</span>,
  crit_multi: (o) => <span>( 1 + Min[ {f(o, "crit_rate_")} , 100%] * {f(o, "crit_dmg_")} )</span>,

  skill_crit_multi: (o) => <span>( 1 + Min[( {f(o, "crit_rate_")} + {f(o, "skill_crit_rate_")} ), 100%] * {f(o, "crit_dmg_")} )</span>,
  burst_crit_multi: (o) => <span>( 1 + Min[( {f(o, "crit_rate_")} + {f(o, "burst_crit_rate_")} ), 100%] * {f(o, "crit_dmg_")} )</span>,

  enemy_level_multi: (o) => <span>( 100 + {f(o, "character_level")}) / ( 100 + {f(o, "enemy_level")} + 100 + {f(o, "character_level")})</span>,
  // physical_enemy_ele_res_multi: (s) => s.physical_enemy_ele_immunity ? 0 : resMultiplier(s.physical_enemy_ele_res_)
  physical_enemy_ele_res_multi: (o) => {
    let im = o.stats.physical_enemy_ele_immunity
    if (im)
      return <span>0 due to immunity</span>
    let res = (o.stats.physical_enemy_ele_res_ || 0) / 100
    if (res < 0) return <span> 1 - {f(o, "physical_enemy_ele_res_")} / 2</span>
    else if (res >= 0.75) return <span> 1 / ( {f(o, "physical_enemy_ele_res_")} * 4 + 1)</span>
    return <span> 1 - {f(o, "physical_enemy_ele_res_")} </span>
  },

  //Elemental Reactions
  overloaded_dmg: (o) => <span>( 1 + {f(o, "overloaded_dmg_")} ) * {f(o, "ele_mas_y")} * {f(o, "overloaded_multi")} * {f(o, "pyro_enemy_ele_res_multi")}</span>,
  overloaded_multi: (o) => ReactionMatrix.overloaded.map((val, i) => reactionMatrixElementRenderer(o, val, i)),
  electrocharged_dmg: (o) => <span>( 1 + {f(o, "electrocharged_dmg_")} ) * {f(o, "ele_mas_y")} * {f(o, "electrocharged_multi")} * {f(o, "electro_enemy_ele_res_multi")}</span>,
  electrocharged_multi: (o) => ReactionMatrix.electrocharged.map((val, i) => reactionMatrixElementRenderer(o, val, i)),
  superconduct_dmg: (o) => <span>( 1 + {f(o, "superconduct_dmg_")} ) * {f(o, "ele_mas_y")} * {f(o, "superconduct_multi")} * {f(o, "cryo_enemy_ele_res_multi")}</span>,
  superconduct_multi: (o) => ReactionMatrix.superconduct.map((val, i) => reactionMatrixElementRenderer(o, val, i)),
  // burning_dmg:
  swirl_dmg: (o) => <span>( 1 + {f(o, "swirl_dmg_")} ) * {f(o, "ele_mas_y")} * {f(o, "swirl_multi")} * {f(o, "anemo_enemy_ele_res_multi")}</span>,
  swirl_multi: (o) => ReactionMatrix.swirl.map((val, i) => reactionMatrixElementRenderer(o, val, i)),
  shatter_dmg: (o) => <span>( 1 + {f(o, "shatter_dmg_")} ) * {f(o, "ele_mas_y")} * {f(o, "shatter_multi")} * {f(o, "physical_enemy_ele_res_multi")}</span>,
  shatter_multi: (o) => ReactionMatrix.shattered.map((val, i) => reactionMatrixElementRenderer(o, val, i)),
  crystalize_dmg: (o) => <span>( 1 + {f(o, "crystalize_dmg_")} ) * {f(o, "ele_mas_z")} * {f(o, "crystalize_multi")}</span>,
  crystalize_multi: (o) => ReactionMatrix.crystalize.map((val, i) => reactionMatrixElementRenderer(o, val, i)),

  pyro_vaporize_multi: (o) => <span>( 1 + {f(o, "vaporize_dmg_")} )* 1.5 * {f(o, "amp_reaction_base_multi")}</span>,
  hydro_vaporize_multi: (o) => <span>( 1 + {f(o, "vaporize_dmg_")} )* 2 * {f(o, "amp_reaction_base_multi")}</span>,

  pyro_melt_multi: (o) => <span>( 1 + {f(o, "melt_dmg_")} ) * 2 * {f(o, "amp_reaction_base_multi")}</span>,
  cryo_melt_multi: (o) => <span>( 1 + {f(o, "melt_dmg_")} ) * 1.5 * {f(o, "amp_reaction_base_multi")}</span>,
  amp_reaction_base_multi: (o) => <span>1 + 0.189266831 * {f(o, "ele_mas")} * exp^(-0.000505 * {f(o, "ele_mas")}) / 100 </span>,

  ele_mas_x: (o) => <span> 1 + (25 / 9 * {f(o, "ele_mas")} / (1401 + {f(o, "ele_mas")} ))</span>,
  ele_mas_y: (o) => <span> 1 + (60 / 9 * {f(o, "ele_mas")} / (1401 + {f(o, "ele_mas")} ))</span>,
  ele_mas_z: (o) => <span> 1 + (40 / 9 * {f(o, "ele_mas")} / (1401 + {f(o, "ele_mas")} ))</span>,
}
function reactionMatrixElementRenderer(o, val, i) {
  let sign = val < 0 ? " - " : " + ";
  let disVal = Math.abs(val)
  let powerText = ""
  if (i > 1) powerText = <span> * ( {f(o, "character_level")} )^{i}</span>
  if (i === 1) powerText = <span> * {f(o, "character_level")}</span>
  return <span key={i}>{sign}{disVal}{powerText}</span>
}

//Add Vaporize and Melt stats
[["pyro_vaporize", "pyro"], ["hydro_vaporize", "hydro"], ["pyro_melt", "pyro"], ["cryo_melt", "cryo"]].forEach(([reactionKey, baseEle]) => {
  [["normal", "Nomal Attack"], ["charged", "Charged Attack"], ["plunging", "Plunging Attack"], ["skill", "Ele. Skill"], ["burst", "Ele. Burst"], ["ele", "Elemental"]].forEach(([atkType, atkTypeName]) =>
    ["dmg", "avg_dmg", "crit_dmg"].forEach(dmgMode => {
      let reactionDMGKey = `${reactionKey}_${atkType}_${dmgMode}`
      let baseDmg = `${baseEle}_${atkType}_${dmgMode}`
      FormulaText[reactionDMGKey] = (o) => <span>{f(o, `${reactionKey}_multi`)} * {f(o, baseDmg)}</span>
    }));
});
const eleFormulaText = {
  normal_dmg: (o, ele) => <span>{f(o, `final_atk`)} * {f(o, `${ele}_normal_bonus_multi`)} * {f(o, `enemy_level_multi`)} * {f(o, `${ele}_enemy_ele_res_multi`)}</span>,
  normal_crit_dmg: (o, ele) => <span>{f(o, `${ele}_normal_dmg`)} * {f(o, `crit_dmg_multi`)}</span>,
  normal_avg_dmg: (o, ele) => <span>{f(o, `${ele}_normal_dmg`)} * {f(o, `normal_crit_multi`)}</span>,
  normal_bonus_multi: (o, ele) => <span>( 1 + {f(o, `${ele}_ele_dmg_`)} + {f(o, `normal_dmg_`)} + {f(o, `dmg_`)} )</span>,

  charged_dmg: (o, ele) => <span>{f(o, `final_atk`)} * {f(o, `${ele}_charged_bonus_multi`)} * {f(o, `enemy_level_multi`)} * {f(o, `${ele}_enemy_ele_res_multi`)}</span>,
  charged_crit_dmg: (o, ele) => <span>{f(o, `${ele}_charged_dmg`)} * {f(o, `crit_dmg_multi`)}</span>,
  charged_avg_dmg: (o, ele) => <span>{f(o, `${ele}_charged_dmg`)} * {f(o, `charged_crit_multi`)}</span>,
  charged_bonus_multi: (o, ele) => <span>( 1 + {f(o, `${ele}_ele_dmg_`)} + {f(o, `charged_dmg_`)} + {f(o, `dmg_`)} )</span>,

  plunging_dmg: (o, ele) => <span>{f(o, `final_atk`)} * {f(o, `${ele}_plunging_bonus_multi`)} * {f(o, `enemy_level_multi`)} * {f(o, `${ele}_enemy_ele_res_multi`)}</span>,
  plunging_crit_dmg: (o, ele) => <span>{f(o, `${ele}_plunging_dmg`)} * {f(o, `crit_dmg_multi`)}</span>,
  plunging_avg_dmg: (o, ele) => <span>{f(o, `${ele}_plunging_dmg`)} * {f(o, `crit_multi`)}</span>,
  plunging_bonus_multi: (o, ele) => <span>( 1 + {f(o, `${ele}_ele_dmg_`)} + {f(o, `plunging_dmg_`)} + {f(o, `dmg_`)} )</span>,

  ele_dmg: (o, ele) => <span>{f(o, `final_atk`)} * {f(o, `${ele}_ele_bonus_multi`)} * {f(o, `enemy_level_multi`)} * {f(o, `${ele}_enemy_ele_res_multi`)}</span>,
  ele_crit_dmg: (o, ele) => <span>{f(o, `${ele}_ele_dmg`)} * {f(o, `crit_dmg_multi`)}</span>,
  ele_avg_dmg: (o, ele) => <span>{f(o, `${ele}_ele_dmg`)} * {f(o, `crit_multi`)}</span>,
  ele_bonus_multi: (o, ele) => <span>( 1 + {f(o, `${ele}_ele_dmg_`)} + {f(o, `dmg_`)} )</span>,

  skill_dmg: (o, ele) => <span>{f(o, `final_atk`)} * {f(o, `${ele}_skill_bonus_multi`)} * {f(o, `enemy_level_multi`)} * {f(o, `${ele}_enemy_ele_res_multi`)}</span>,
  skill_crit_dmg: (o, ele) => <span>{f(o, `${ele}_skill_dmg`)} * {f(o, `crit_dmg_multi`)}</span>,
  skill_avg_dmg: (o, ele) => <span>{f(o, `${ele}_skill_dmg`)} * {f(o, `skill_crit_multi`)}</span>,
  skill_bonus_multi: (o, ele) => <span>( 1 + {f(o, `${ele}_ele_dmg_`)} + {f(o, `skill_dmg_`)} + {f(o, `dmg_`)} )</span>,

  burst_dmg: (o, ele) => <span>{f(o, `final_atk`)} * {f(o, `${ele}_burst_bonus_multi`)} * {f(o, `enemy_level_multi`)} * {f(o, `${ele}_enemy_ele_res_multi`)}</span>,
  burst_crit_dmg: (o, ele) => <span>{f(o, `${ele}_burst_dmg`)} * {f(o, `crit_dmg_multi`)}</span>,
  burst_avg_dmg: (o, ele) => <span>{f(o, `${ele}_burst_dmg`)} * {f(o, `burst_crit_multi`)}</span>,
  burst_bonus_multi: (o, ele) => <span>( 1 + {f(o, `${ele}_ele_dmg_`)} + {f(o, `burst_dmg_`)} + {f(o, `dmg_`)} )</span>,

  enemy_ele_res_multi: (o, ele) => {
    let im = o.stats[`${ele}_enemy_ele_immunity`]
    if (im)
      return <span>0 due to immunity</span>
    let res = (o.stats[`${ele}_enemy_ele_res_`] || 0) / 100
    if (res < 0) return <span> 1 - {f(o, `${ele}_enemy_ele_res_`)} / 2</span>
    else if (res >= 0.75) return <span> 1 / ( {f(o, `${ele}_enemy_ele_res_`)} * 4 + 1)</span>
    return <span> 1 - {f(o, `${ele}_enemy_ele_res_`)} </span>
  },
}
//expand the eleFormulaText to elementals
Object.keys(ElementalData).forEach(eleKey =>
  Object.entries(eleFormulaText).forEach(([key, func]) =>
    Object.defineProperty(FormulaText, `${eleKey}_${key}`, {
      configurable: true,
      enumerable: true,
      writable: true,
      value: (obj) => (func)(obj, eleKey),
    })))

//checks for development
process.env.NODE_ENV === "development" && Object.keys(Formulas).forEach(key => {
  if (!FormulaText[key]) console.error(`Formula "${key}" does not have a corresponding entry in FormulaText`)
})
process.env.NODE_ENV === "development" && Object.keys(Formulas).forEach(key => {
  if (!StatData[key]) console.error(`Formula "${key}" does not have a corresponding entry in StatData`)
})

export {
  FormulaText,
};
