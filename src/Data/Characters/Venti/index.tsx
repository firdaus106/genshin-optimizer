import card from './Character_Venti_Card.jpg'
import thumb from './Character_Venti_Thumb.png'
import c1 from './Constellation_Splitting_Gales.png'
import c2 from './Constellation_Breeze_of_Reminiscence.png'
import c3 from './Constellation_Ode_to_Thousand_Winds.png'
import c4 from './Constellation_Hurricane_of_Freedom.png'
import c5 from './Constellation_Concerto_dal_Cielo.png'
import c6 from './Constellation_Storm_of_Defiance.png'
import normal from './Talent_Divine_Marksmanship.png'
import skill from './Talent_Skyward_Sonnet.png'
import burst from './Talent_Wind\'s_Grand_Ode.png'
import passive1 from './Talent_Embrace_of_Winds.png'
import passive2 from './Talent_Stormeye.png'
import passive3 from './Talent_Windrider.png'
import ElementalData from '../../ElementalData'
import Stat from '../../../Stat'
import formula, { data } from './data'
import { getTalentStatKey, getTalentStatKeyVariant } from "../../../Build/Build"
import { IConditionals, IConditionalValue } from '../../../Types/IConditional'
import { ICharacterSheet } from '../../../Types/character'
const conditionals: IConditionals = {
  c2: { // BreezeOfReminiscence
    name: <b>Skyward Sonnet</b>,
    canShow: stats => stats.constellation >= 2,
    states: {
      hit: {
        name: <span>Opponent hit</span>,
        stats: {
          anemo_enemyRes_: -12,
          physical_enemyRes_: -12
        },
      },
      launch: {
        name: <span>Opponent launched</span>,
        stats: {
          anemo_enemyRes_: -24,
          physical_enemyRes_: -24
        },
      }
    }
  },
  q: { // Absorption
    name: "Elemental Absorption",
    states: Object.fromEntries(["hydro", "pyro", "cryo", "electro"].map(eleKey => [eleKey, {
      name: <span className={`text-${eleKey}`}><b>{ElementalData[eleKey].name}</b></span>,
      fields: [{
        canShow: stats => {
          const value = stats.conditionalValues?.character?.venti?.q as IConditionalValue | undefined
          if (!value) return false
          const [num, condEleKey] = value
          if (!num || condEleKey !== eleKey) return false
          return true
        },
        text: "Absorption DoT",
        formulaText: stats => <span>{(data.burst.hit[stats.tlvl.burst] / 2)?.toFixed(2)}% {Stat.printStat(`${eleKey}_burst_${stats.hitMode}`, stats)}</span>,
        formula: formula.burst[`${eleKey}_hit`],
        variant: eleKey
      }, {
        canShow: stats => stats.ascension >= 4,
        text: <span>Regen 15 Energy to all <span className={`text-${eleKey}`}>{ElementalData[eleKey].name}</span> characters.</span>,
      }],
      stats: stats => ({
        ...stats.constellation >= 6 && { [`${eleKey}_enemyRes_`]: -20 }
      })
    }]))
  },
  c4: { // HurricaneOfFreedom
    canShow: stats => stats.constellation >= 4,
    name: "Venti picks up an Elemental Orb or Particle",
    stats: { anemo_dmg_: 25 },
    fields: [{
      text: "Duration",
      value: "10s",
    }]
  }
}
const char: ICharacterSheet = {
  name: "Venti",
  cardImg: card,
  thumbImg: thumb,
  star: 5,
  elementKey: "anemo",
  weaponTypeKey: "bow",
  gender: "M",
  constellationName: "Carmen Dei",
  titles: ["Windborne Bard", "Tone-Deaf Bard"],
  baseStat: data.baseStat,
  specializeStat: data.specializeStat,
  formula,
  conditionals,
  talent: {
    auto: {
      name: "Divine Marksmanship",
      img: normal,
      document: [{
        text: <span><strong>Normal Attack</strong> Perform up to 6 consecutive shots with a bow. <small><i>Note: the 1st and 4th attack hits twice.</i></small></span>,
        fields: data.normal.hitArr.map((percentArr, i) =>
        ({
          text: `${i + 1}-Hit DMG${i === 0 || i === 3 ? " (2 Hits)" : ""}`,
          formulaText: stats => <span>{percentArr[stats.tlvl.auto]}% {Stat.printStat(getTalentStatKey("normal", stats), stats)}</span>,
          formula: formula.normal[i],
          variant: stats => getTalentStatKeyVariant("normal", stats),
        }))
      }, {
        text: <span><strong>Charged Attack</strong> Perform a more precise Aimed Shot with increased DMG. While aiming, favorable winds will accumulate on the arrowhead. A fully charged wind arrow will deal <span className="text-anemo">Anemo DMG</span>.</span>,
        fields: [{
          text: `Aimed Shot DMG`,
          formulaText: stats => <span>{data.charged.hit[stats.tlvl.auto]}% {Stat.printStat(getTalentStatKey("charged", stats), stats)}</span>,
          formula: formula.charged.hit,
          variant: stats => getTalentStatKeyVariant("charged", stats),
        }, {
          text: <span>Fully-Charged Aimed Shot DMG</span>,
          formulaText: stats => <span>{data.charged.full[stats.tlvl.auto]}% {Stat.printStat(getTalentStatKey("charged", stats, "anemo"), stats)}</span>,
          formula: formula.charged.full,
          variant: stats => getTalentStatKeyVariant("charged", stats, "anemo"),
        },]
      }, {
        canShow: stats => stats.constellation >= 1,
        text: <span><strong>Splitting Gales: </strong> Fires 2 additional split arrows per Aimed Shot</span>,
        fields: [{
          text: `Additional Aimed Shot DMG`,
          formulaText: stats => <span>{(data.charged.hit[stats.tlvl.auto] * 0.33)?.toFixed(2)}% {Stat.printStat(getTalentStatKey("charged", stats), stats)}</span>,
          formula: formula.charged.hit_bonus,
          variant: stats => getTalentStatKeyVariant("charged", stats),
        }, {
          text: `Additional Full-Charged Aimed Shot DMG`,
          formulaText: stats => <span>{(data.charged.full[stats.tlvl.auto] * 0.33)?.toFixed(2)}% {Stat.printStat(getTalentStatKey("charged", stats, "anemo"), stats)}</span>,
          formula: formula.charged.full_bonus,
          variant: stats => getTalentStatKeyVariant("charged", stats, "anemo"),
        }]
      }, {
        text: <span><strong>Plunging Attack</strong> Fires off a shower of arrows in mid-air before falling and striking the ground, dealing AoE DMG upon impact.</span>,
        fields: [{
          text: `Plunge DMG`,
          formulaText: stats => <span>{data.plunging.dmg[stats.tlvl.auto]}% {Stat.printStat(getTalentStatKey("plunging", stats), stats)}</span>,
          formula: formula.plunging.dmg,
          variant: stats => getTalentStatKeyVariant("plunging", stats),
        }, {
          text: `Low Plunge DMG`,
          formulaText: stats => <span>{data.plunging.low[stats.tlvl.auto]}% {Stat.printStat(getTalentStatKey("plunging", stats), stats)}</span>,
          formula: formula.plunging.low,
          variant: stats => getTalentStatKeyVariant("plunging", stats),
        }, {
          text: `High Plunge DMG`,
          formulaText: stats => <span>{data.plunging.high[stats.tlvl.auto]}% {Stat.printStat(getTalentStatKey("plunging", stats), stats)}</span>,
          formula: formula.plunging.high,
          variant: stats => getTalentStatKeyVariant("plunging", stats),
        }]
      }],
    },
    skill: {
      name: "Skyward Sonnet",
      img: skill,
      document: [{
        text: <span>
          <p className="mb-2">O wind upon which all hymns and songs fly, bear these earth-walkers up into the sky!</p>
          <p className="mb-2"><strong>Press:</strong> Summons a Wind Domain at the opponent's location, dealing AoE Anemo DMG and launching opponents into the air.</p>
          <p className="mb-2"><strong>Hold:</strong> Summons an even larger Wind Domain with Venti as the epicenter, dealing AoE Anemo DMG and launching affected opponents into the air. After unleashing the Hold version of this ability, Venti rides the wind into the air.</p>
          <p className="mb-2">Opponents hit by Skyward Sonnet will fall to the ground slowly.</p>
          <p className="mb-0">Generate 3/4 elemental particles for press/hold when it hit at least 1 target.</p>
        </span>,
        fields: [{
          text: "Press DMG",
          formulaText: stats => <span>{data.skill.press[stats.tlvl.skill]}% {Stat.printStat(getTalentStatKey("skill", stats), stats)}</span>,
          formula: formula.skill.press,
          variant: stats => getTalentStatKeyVariant("skill", stats),
        }, {
          text: "Press CD",
          value: "6s",
        }, {
          text: "Hold DMG",
          formulaText: stats => <span>{data.skill.hold[stats.tlvl.skill]}% {Stat.printStat(getTalentStatKey("skill", stats), stats)}</span>,
          formula: formula.skill.hold,
          variant: stats => getTalentStatKeyVariant("skill", stats),
        }, {
          text: "Hold CD",
          value: "15s",
        }, {
          canShow: stats => stats.ascension >= 1,
          text: "Upcurrent Duration",
          value: "20s",
        }],
        conditional: conditionals.c2
      }],
    },
    burst: {
      name: "Wind's Grand Ode",
      img: burst,
      document: [{
        text: <span>
          <p className="mb-2">Fires off an arrow made of countless coalesced winds, creating a huge Stormeye that sucks in objects and opponents and deals continuous <span className="text-anemo">Anemo DMG</span>.</p>
          <p className="mb-2"><strong>Elemental Absorption:</strong> If the Stormeye comes into contact with <span className="text-hydro">Hydro</span>/<span className="text-pyro">Pyro</span>/<span className="text-cryo">Cryo</span>/<span className="text-electro">Electro</span> elements, it will deal 50% additional elemental DMG of that type. Elemental Absorption may only occur once per use.</p>
        </span>,
        fields: [{
          text: "DoT",
          formulaText: stats => <span>{data.burst.hit[stats.tlvl.burst]}% {Stat.printStat(getTalentStatKey("burst", stats), stats)}</span>,
          formula: formula.burst.hit,
          variant: stats => getTalentStatKeyVariant("burst", stats),
        }, {
          text: "Duration",
          value: "8s",
        }, {
          text: "CD",
          value: "15s",
        }, {
          text: "Energy Cost",
          value: 60,
        }, {
          canShow: stats => stats.ascension >= 4,
          text: <span>Regen 15 Energy to Venti after effect ends.</span>,
        }, {
          canShow: stats => stats.constellation >= 6,
          text: <span>Enemy <span className="text-anemo">Anemo RES</span> decrease</span>,//TODO stats
          value: "20%"
        }],
        conditional: conditionals.q
      }, {
        canShow: stats => Boolean(stats.conditionalValues?.character?.venti?.q),
        text: <span>
          <h6>Full Elemental Burst DMG</h6>
          <p className="mb-2">This calculates the total Elemental Burst DMG, including swirl. This calculation assumes:</p>
          <ul>
            <li>20 ticks of Burst DMG</li>
            <li>15 ticks of absorption DMG</li>
            <li>7 ticks of Swirl, for one enemy, OR,</li>
            <li>14 ticks of Swirl, for multiple enemy, that Swirls eachother.</li>
          </ul>
        </span>,
        fields: ["hydro", "pyro", "cryo", "electro"].flatMap(eleKey => ([7, 14].map(swirlTicks => ({
          canShow: stats => {
            const value = stats.conditionalValues?.character?.venti?.q
            if (!value) return false
            const [num, condEleKey] = value
            if (!num || condEleKey !== eleKey) return false
            return true
          },
          text: <span>Total DMG(<span className={`text-${eleKey}`}>{swirlTicks} Swirl ticks</span>)</span>,
          formula: formula.burst[`${eleKey}_tot_${swirlTicks}`],
          formulaText: stats => <span>20 * {data.burst.hit[stats.tlvl.burst]}% {Stat.printStat(getTalentStatKey("burst", stats), stats)} + 15 * {(data.burst.hit[stats.tlvl.burst] / 2)?.toFixed(2)}% {Stat.printStat(`${eleKey}_burst_${stats.hitMode}`, stats)} + {swirlTicks} * {Stat.printStat(`${eleKey}_swirl_hit`, stats)}</span>
        }))))
      }],
    },
    passive1: {
      name: "Embrace of Winds",
      img: passive1,
      document: [{ text: <span>Holding <b>Skyward Sonnet</b> creates an upcurrent that lasts for 20s.</span> }],
    },
    passive2: {
      name: "Stormeye",
      img: passive2,
      document: [{ text: <span>Regenerates 15 Energy for Venti after the effects of <b>Wind's Grand Ode</b> end. If an Elemental Absorption occurred, this also restores 15 Energy to all characters of that corresponding element.</span> }],
    },
    passive3: {
      name: "Windrider",
      img: passive3,
      document: [{
        text: <span>
          Decreases gliding Stamina consumption for your own party members by 20%.
          Not stackable with Passive Talents that provide the exact same effects.
      </span>
      }],
      stats: {
        staminaGlidingDec_: 20,
      }
    },
    constellation1: {
      name: "Splitting Gales",
      img: c1,
      document: [{ text: <span>Fires 2 additional split arrows per Aimed Shot, each dealing 33% of the original arrow's DMG.</span> }],
    },
    constellation2: {
      name: "Breeze of Reminiscence",
      img: c2,
      document: [{ text: <span>Skyward Sonnet decreases enemy <span className="text-anemo">Anemo RES</span> by 12% for 10s. Enemies launched by Skyward Sonnet suffer an additional 12% <span className="text-anemo">Anemo RES</span> and <span className="text-physical">Physical RES</span> penalty when airborne.</span> }],
    },
    constellation3: {
      name: "Ode to Thousand Winds",
      img: c3,
      document: [{ text: <span>Increases the level of <b>Wind's Grand Ode</b> by 3. Maximum upgrade level is 15.</span> }],
      stats: { burstBoost: 3 }
    },
    constellation4: {
      name: "Hurricane of Freedom",
      img: c4,
      document: [{
        text: <span>When Venti picks up an Elemental Orb or Particle, he receives a 25% Anemo DMG Bonus for 10s.</span>,
        conditional: conditionals.c4
      }],
    },
    constellation5: {
      name: "Concerto dal Cielo",
      img: c5,
      document: [{ text: <span>Increases the level of <b>Skyward Sonnet</b> by 3. Maximum upgrade level is 15.</span> }],
      stats: { skillBoost: 3 }
    },
    constellation6: {
      name: "Storm of Defiance",
      img: c6,
      document: [{ text: <span>Targets who take DMG from Wind's Grand Ode have their <span className="text-anemo">Anemo RES</span> decreased by 20%. If an Elemental Absorption occurred, then their RES towards the corresponding Element is also decreased by 20%.</span> }],
    }
  },
};
export default char;
