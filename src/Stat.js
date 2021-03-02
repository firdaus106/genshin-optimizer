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
  baseATK: (o) => <span>{f(o, "characterATK")} + {f(o, "weaponATK")} </span>,
  finalATK: (o) => <span>{f(o, "baseATK")} * ( 1 + {f(o, "atk_")} ) + {f(o, "atk")}</span>,
  finalHP: (o) => <span>{f(o, "characterHP")} * ( 1 + {f(o, "hp_")} ) + {f(o, "hp")}</span>,
  findlDEF: (o) => <span>{f(o, "characterDEF")} * ( 1 + {f(o, "def_")} ) + {f(o, "def")}</span>,

  enemyLevel_multi: (o) => <span>( 100 + {f(o, "characterLevel")}) / ( 100 + {f(o, "enemyLevel")} + 100 + {f(o, "characterLevel")})</span>,

  // Elemental Reactions
  overloaded_hit: (o) => <span>( 1 + {f(o, "overloaded_dmg_")} ) * {f(o, "eleMasY")} * {f(o, "overloaded_multi")} * {f(o, "pyro_enemyRes_multi")}</span>,
  electrocharged_hit: (o) => <span>( 1 + {f(o, "electrocharged_dmg_")} ) * {f(o, "eleMasY")} * {f(o, "electrocharged_multi")} * {f(o, "electro_enemyRes_multi")}</span>,

  superconduct_hit: (o) => <span>( 1 + {f(o, "superconduct_dmg_")} ) * {f(o, "eleMasY")} * {f(o, "superconduct_multi")} * {f(o, "cryo_enemyRes_multi")}</span>,
  // burning_hit:
  swirl_hit: (o) => <span>( 1 + {f(o, "swirl_dmg_")} ) * {f(o, "eleMasY")} * {f(o, "swirl_multi")} * {f(o, "anemo_enemyRes_multi")}</span>,
  shattered_hit: (o) => <span>( 1 + {f(o, "shattered_dmg_")} ) * {f(o, "eleMasY")} * {f(o, "shattered_multi")} * {f(o, "physical_enemyRes_multi")}</span>,
  crystalize_hit: (o) => <span>( 1 + {f(o, "crystalize_dmg_")} ) * {f(o, "eleMasZ")} * {f(o, "crystalize_multi")}</span>,

  // Elemental DMG multipliers
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
  FormulaText[`final_${move}_critRate_`] = (o) => <span>Min[( {f(o, "critRate_")} + {f(o, `${move}_critRate_`)} ), 100%]</span>
})

Object.entries(hitElements).forEach(([ele, {name: eleName}]) => {
  // DONT CHANGE. needed for screenshot parsing

  FormulaText[`${ele}_hit`] = (o) => <span>{f(o, `finalATK`)} * (1 + {f(o, `dmg_`)} * {f(o, `${ele}_dmg_`)}) * {f(o, `enemyLevel_multi`)} * {f(o, `${ele}_enemyRes_multi`)}</span>
  FormulaText[`${ele}_critHit`] = (o) => <span>{f(o, `${ele}_hit`)} * (1 + {f(o, `critDMG_`)})</span>
  FormulaText[`${ele}_avgHit`] = (o) => <span>{f(o, `${ele}_hit`)} * (1 + {f(o, `critDMG_`)} * {f(o, `critRate_`)})</span>

  FormulaText[`${ele}_enemyRes_multi`] = (o) => {
    if (o.stats[`${ele}_enemyImmunity`])
      return <span>0 (immune)</span>
    let res = (o.stats[`${ele}_enemyRes_`] || 0) / 100
    if (res < 0) return <span> 1 - {f(o, `${ele}_enemyRes_`)} / 2</span>
    else if (res >= 0.75) return <span> 1 / ( {f(o, `${ele}_enemyRes_`)} * 4 + 1)</span>
    return <span> 1 - {f(o, `${ele}_enemyRes_`)} </span>
  }
})

Object.entries(hitMoves).forEach(([move, moveName]) => {
  Object.entries(hitElements).forEach(([ele, {name: eleName}]) => {
    FormulaText[`${ele}_${move}_hit`] = (o) => <span>{f(o, `finalATK`)} * (1 + {f(o, `dmg_`)} + {f(o, `${ele}_dmg_`)} + {f(o, `${move}_dmg_`)}) * {f(o, `enemyLevel_multi`)} * {f(o, `${ele}_enemyRes_multi`)})</span>
    FormulaText[`${ele}_${move}_critHit`] = (o) => <span>{f(o, `${ele}_${move}_hit`)} * (1 + {f(o, `critDMG_`)})</span>
    FormulaText[`${ele}_${move}_avgHit`] = (o) => <span>{f(o, `${ele}_${move}_hit`)} * (1 + {f(o, `critDMG_`)} * {f(o, `final_${move}_critRate_`)})</span>
  })
})

Object.entries(transformativeReactions).forEach(([reaction, [ele, reactionName]]) => {
  if (ReactionMatrix[reaction])
    FormulaText[`${reaction}_multi`] = (o) => ReactionMatrix[reaction].map((val, i) => reactionMatrixElementRenderer(o, val, i))
})

Object.entries(amplifyingReactions).forEach(([reaction, variants]) => {
  Object.entries(variants).forEach(([ele, reactionName]) => {
    Object.entries(hitTypes).forEach(([type, typeName]) => {
      FormulaText[`${ele}_${reaction}_${type}`] = (o) => <span>{f(o, `${ele}_${reaction}_multi`)} * {f(o, `${ele}_${type}`)}</span>
      Object.entries(hitMoves).forEach(([move, moveName]) => {
        FormulaText[`${ele}_${reaction}_${type}`] = (o) => <span>{f(o, `${ele}_${reaction}_multi`)} * {f(o, `${ele}_${move}_${type}`)}</span>
      })
    })
  })
})


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
