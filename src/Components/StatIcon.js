import { faDice, faDiceD20, faFirstAid, faFistRaised, faMagic, faShieldAlt, faSync, faTint } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const StatIcon = {
  character_hp: faTint,
  final_hp: faTint,
  hp_: faTint,
  hp: faTint,

  base_atk: faFistRaised,
  character_atk: faFistRaised,
  final_atk: faFistRaised,
  atk_: faFistRaised,
  atk: faFistRaised,

  character_def: faShieldAlt,
  final_def: faShieldAlt,
  def_: faShieldAlt,
  def: faShieldAlt,

  ele_mas: faMagic,
  crit_rate_: faDice,
  crit_dmg_: faDiceD20,
  ener_rech_: faSync,
  heal_: faFirstAid,
}

const StatIconEle = (statKey) =>
  StatIcon[statKey] ? <FontAwesomeIcon icon={StatIcon[statKey]} className="fa-fw" /> : null

export default StatIcon

export {
  StatIconEle
}