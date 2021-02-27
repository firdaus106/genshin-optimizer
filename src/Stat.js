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
  finalHP: (o) => <span>{f(o, "characterHP")} * ( 1 + {f(o, "hp_")} ) + {f(o, "hp")}</span>,
  //ATK
  baseATK: (o) => <span>{f(o, "characterATK")} + {f(o, "weaponATK")} </span>,
  finalATK: (o) => <span>{f(o, "baseATK")} * ( 1 + {f(o, "atk_")} ) + {f(o, "atk")}</span>,
  //DEF
  findlDEF: (o) => <span>{f(o, "characterDEF")} * ( 1 + {f(o, "def_")} ) + {f(o, "def")}</span>,

  normal_crit_multi: (o) => <span>( 1 + Min[( {f(o, "critRate_")} + {f(o, "normal_critRate_")} ), 100%] * {f(o, "critDMG_")} )</span>,
  charged_crit_multi: (o) => <span>( 1 + Min[( {f(o, "critRate_")} + {f(o, "charged_critRate_")} ), 100%] * {f(o, "critDMG_")} )</span>,
  skill_crit_multi: (o) => <span>( 1 + Min[( {f(o, "critRate_")} + {f(o, "skill_critRate_")} ), 100%] * {f(o, "critDMG_")} )</span>,
  burst_crit_multi: (o) => <span>( 1 + Min[( {f(o, "critRate_")} + {f(o, "burst_critRate_")} ), 100%] * {f(o, "critDMG_")} )</span>,
  critDMG_multi: (o) => <span>( 1 + {f(o, "critDMG_")} )</span>,
  crit_multi: (o) => <span>( 1 + Min[ {f(o, "critRate_")} , 100%] * {f(o, "critDMG_")} )</span>,

  enemyLevel_multi: (o) => <span>( 100 + {f(o, "characterLevel")}) / ( 100 + {f(o, "enemyLevel")} + 100 + {f(o, "characterLevel")})</span>,
  // physical_enemyRes_multi: (s) => s.physical_enemyImmunity ? 0 : resMultiplier(s.physical_enemyRes_)
  physical_enemyRes_multi: (o) => {
    let im = o.stats.physical_enemyImmunity
    if (im)
      return <span>0 due to immunity</span>
    let res = (o.stats.physical_enemyRes_ || 0) / 100
    if (res < 0) return <span> 1 - {f(o, "physical_enemyRes_")} / 2</span>
    else if (res >= 0.75) return <span> 1 / ( {f(o, "physical_enemyRes_")} * 4 + 1)</span>
    return <span> 1 - {f(o, "physical_enemyRes_")} </span>
  },

  //Elemental Reactions
  overloaded_hit: (o) => <span>( 1 + {f(o, "overloaded_dmg_")} ) * {f(o, "eleMasY")} * {f(o, "overloaded_multi")} * {f(o, "pyro_enemyRes_multi")}</span>,
  overloaded_multi: (o) => ReactionMatrix.overloaded.map((val, i) => reactionMatrixElementRenderer(o, val, i)),
  electrocharged_hit: (o) => <span>( 1 + {f(o, "electrocharged_dmg_")} ) * {f(o, "eleMasY")} * {f(o, "electrocharged_multi")} * {f(o, "electro_enemyRes_multi")}</span>,
  electrocharged_multi: (o) => ReactionMatrix.electrocharged.map((val, i) => reactionMatrixElementRenderer(o, val, i)),
  superconduct_hit: (o) => <span>( 1 + {f(o, "superconduct_dmg_")} ) * {f(o, "eleMasY")} * {f(o, "superconduct_multi")} * {f(o, "cryo_enemyRes_multi")}</span>,
  superconduct_multi: (o) => ReactionMatrix.superconduct.map((val, i) => reactionMatrixElementRenderer(o, val, i)),
  // burning_hit:
  swirl_hit: (o) => <span>( 1 + {f(o, "swirl_dmg_")} ) * {f(o, "eleMasY")} * {f(o, "swirl_multi")} * {f(o, "anemo_enemyRes_multi")}</span>,
  swirl_multi: (o) => ReactionMatrix.swirl.map((val, i) => reactionMatrixElementRenderer(o, val, i)),
  shattered_hit: (o) => <span>( 1 + {f(o, "shattered_dmg_")} ) * {f(o, "eleMasY")} * {f(o, "shattered_multi")} * {f(o, "physical_enemyRes_multi")}</span>,
  shattered_multi: (o) => ReactionMatrix.shattered.map((val, i) => reactionMatrixElementRenderer(o, val, i)),
  crystalize_hit: (o) => <span>( 1 + {f(o, "crystalize_dmg_")} ) * {f(o, "eleMasZ")} * {f(o, "crystalize_multi")}</span>,
  crystalize_multi: (o) => ReactionMatrix.crystalize.map((val, i) => reactionMatrixElementRenderer(o, val, i)),

  pyro_vaporize_multi: (o) => <span>( 1 + {f(o, "vaporize_dmg_")} )* 1.5 * {f(o, "ampReactionBase_multi")}</span>,
  hydro_vaporize_multi: (o) => <span>( 1 + {f(o, "vaporize_dmg_")} )* 2 * {f(o, "ampReactionBase_multi")}</span>,

  pyro_melt_multi: (o) => <span>( 1 + {f(o, "melt_dmg_")} ) * 2 * {f(o, "ampReactionBase_multi")}</span>,
  cryo_melt_multi: (o) => <span>( 1 + {f(o, "melt_dmg_")} ) * 1.5 * {f(o, "ampReactionBase_multi")}</span>,
  ampReactionBase_multi: (o) => <span>1 + 0.189266831 * {f(o, "eleMas")} * exp^(-0.000505 * {f(o, "eleMas")}) / 100 </span>,

  eleMasX: (o) => <span> 1 + (25 / 9 * {f(o, "eleMas")} / (1401 + {f(o, "eleMas")} ))</span>,
  eleMasY: (o) => <span> 1 + (60 / 9 * {f(o, "eleMas")} / (1401 + {f(o, "eleMas")} ))</span>,
  eleMasZ: (o) => <span> 1 + (40 / 9 * {f(o, "eleMas")} / (1401 + {f(o, "eleMas")} ))</span>,
}
function reactionMatrixElementRenderer(o, val, i) {
  let sign = val < 0 ? " - " : " + ";
  let disVal = Math.abs(val)
  let powerText = ""
  if (i > 1) powerText = <span> * ( {f(o, "characterLevel")} )^{i}</span>
  if (i === 1) powerText = <span> * {f(o, "characterLevel")}</span>
  return <span key={i}>{sign}{disVal}{powerText}</span>
}

//Add Vaporize and Melt stats
[["pyro_vaporize", "pyro"], ["hydro_vaporize", "hydro"], ["pyro_melt", "pyro"], ["cryo_melt", "cryo"]].forEach(([reactionKey, baseEle]) => {
  [["normal", "Nomal Attack"], ["charged", "Charged Attack"], ["plunging", "Plunging Attack"], ["skill", "Ele. Skill"], ["burst", "Ele. Burst"], ["ele", "Elemental"]].forEach(([atkType, atkTypeName]) =>
    ["hit", "avgHit", "critHit"].forEach(hitMode => {
      let reactionDMGKey = `${reactionKey}_${atkType}_${hitMode}`
      let baseHit = `${baseEle}_${atkType}_${hitMode}`
      FormulaText[reactionDMGKey] = (o) => <span>{f(o, `${reactionKey}_multi`)} * {f(o, baseHit)}</span>
    }));
});
const eleFormulaText = {
  normal_hit: (o, ele) => <span>{f(o, `finalATK`)} * {f(o, `${ele}_normal_bonus_multi`)} * {f(o, `enemyLevel_multi`)} * {f(o, `${ele}_enemyRes_multi`)}</span>,
  normal_critHit: (o, ele) => <span>{f(o, `${ele}_normal_hit`)} * {f(o, `critDMG_multi`)}</span>,
  normal_avgHit: (o, ele) => <span>{f(o, `${ele}_normal_hit`)} * {f(o, `normal_crit_multi`)}</span>,
  normal_bonus_multi: (o, ele) => <span>( 1 + {f(o, `${ele}_dmg_`)} + {f(o, `normal_dmg_`)} + {f(o, `dmg_`)} )</span>,

  charged_hit: (o, ele) => <span>{f(o, `finalATK`)} * {f(o, `${ele}_charged_bonus_multi`)} * {f(o, `enemyLevel_multi`)} * {f(o, `${ele}_enemyRes_multi`)}</span>,
  charged_critHit: (o, ele) => <span>{f(o, `${ele}_charged_hit`)} * {f(o, `critDMG_multi`)}</span>,
  charged_avgHit: (o, ele) => <span>{f(o, `${ele}_charged_hit`)} * {f(o, `charged_crit_multi`)}</span>,
  charged_bonus_multi: (o, ele) => <span>( 1 + {f(o, `${ele}_dmg_`)} + {f(o, `charged_dmg_`)} + {f(o, `dmg_`)} )</span>,

  plunging_hit: (o, ele) => <span>{f(o, `finalATK`)} * {f(o, `${ele}_plunging_bonus_multi`)} * {f(o, `enemyLevel_multi`)} * {f(o, `${ele}_enemyRes_multi`)}</span>,
  plunging_critHit: (o, ele) => <span>{f(o, `${ele}_plunging_hit`)} * {f(o, `critDMG_multi`)}</span>,
  plunging_avgHit: (o, ele) => <span>{f(o, `${ele}_plunging_hit`)} * {f(o, `crit_multi`)}</span>,
  plunging_bonus_multi: (o, ele) => <span>( 1 + {f(o, `${ele}_dmg_`)} + {f(o, `plunging_dmg_`)} + {f(o, `dmg_`)} )</span>,

  ele_hit: (o, ele) => <span>{f(o, `finalATK`)} * {f(o, `${ele}_bonus_multi`)} * {f(o, `enemyLevel_multi`)} * {f(o, `${ele}_enemyRes_multi`)}</span>,
  ele_critHit: (o, ele) => <span>{f(o, `${ele}_hit`)} * {f(o, `critDMG_multi`)}</span>,
  ele_avgHit: (o, ele) => <span>{f(o, `${ele}_hit`)} * {f(o, `crit_multi`)}</span>,
  ele_bonus_multi: (o, ele) => <span>( 1 + {f(o, `${ele}_dmg_`)} + {f(o, `dmg_`)} )</span>,

  skill_hit: (o, ele) => <span>{f(o, `finalATK`)} * {f(o, `${ele}_skill_bonus_multi`)} * {f(o, `enemyLevel_multi`)} * {f(o, `${ele}_enemyRes_multi`)}</span>,
  skill_critHit: (o, ele) => <span>{f(o, `${ele}_skill_hit`)} * {f(o, `critDMG_multi`)}</span>,
  skill_avgHit: (o, ele) => <span>{f(o, `${ele}_skill_hit`)} * {f(o, `skill_crit_multi`)}</span>,
  skill_bonus_multi: (o, ele) => <span>( 1 + {f(o, `${ele}_dmg_`)} + {f(o, `skill_dmg_`)} + {f(o, `dmg_`)} )</span>,

  burst_hit: (o, ele) => <span>{f(o, `finalATK`)} * {f(o, `${ele}_burst_bonus_multi`)} * {f(o, `enemyLevel_multi`)} * {f(o, `${ele}_enemyRes_multi`)}</span>,
  burst_critHit: (o, ele) => <span>{f(o, `${ele}_burst_hit`)} * {f(o, `critDMG_multi`)}</span>,
  burst_avgHit: (o, ele) => <span>{f(o, `${ele}_burst_hit`)} * {f(o, `burst_crit_multi`)}</span>,
  burst_bonus_multi: (o, ele) => <span>( 1 + {f(o, `${ele}_dmg_`)} + {f(o, `burst_dmg_`)} + {f(o, `dmg_`)} )</span>,

  enemyRes_multi: (o, ele) => {
    let im = o.stats[`${ele}_enemyImmunity`]
    if (im)
      return <span>0 due to immunity</span>
    let res = (o.stats[`${ele}_enemyRes_`] || 0) / 100
    if (res < 0) return <span> 1 - {f(o, `${ele}_enemyRes_`)} / 2</span>
    else if (res >= 0.75) return <span> 1 / ( {f(o, `${ele}_enemyRes_`)} * 4 + 1)</span>
    return <span> 1 - {f(o, `${ele}_enemyRes_`)} </span>
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
