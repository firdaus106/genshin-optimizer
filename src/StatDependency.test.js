import { GetDependencies, GetFormulaDependency } from "./StatDependency"
import { StatData } from "./StatData"

expect.extend({
  /**
    * Test that the object respects the dependencies
    * @param {statKey[]} received - The sorted list of stat keys
    * @param {Object.<statKey, statKeys[]>} expected - The list of dependencies, all values must preceed its key to pass this test.
    */
  toBeDependent(received, expected) {
    for (const pivot in expected) {
      const index = received.indexOf(pivot)
      if (index === -1) return {
        message: () => `expected ${this.utils.printReceived(received)} to contain ${this.utils.printExpected(pivot)}`,
        pass: false,
      }
      const prefix = new Set(received.slice(0, index))
      for (const item of expected[pivot]) {
        if (!prefix.has(item)) return {
          message: () => `expected ${this.utils.printReceived(received)} to contain ${this.utils.printExpected(item)} before ${this.utils.printExpected(pivot)}`,
          pass: false
        }
      }
    }

    return {
      message: () => `expected ${this.utils.printReceived(received)} to break dependency of ${this.utils.printExpected(expected)}`,
      pass: true
    }
  },
})

describe('Testing StatDependency', () => {
  describe('GetFormulaDependency()', () => {
    test('should get dependencies from formula', () => {
      let operation = (s) => s.atk + s.def * s.hp
      expect(GetFormulaDependency(operation).sort()).toEqual(["atk", "def", "hp"].sort())
    })
  })
  describe('GetDependencies()', () => {
    test('should get dependencies from database', () => {
      expect(GetDependencies({}, ["final_def"])).toBeDependent({ final_def: ["base_def", "def_", "def"] })
    })
    test('should recursively get dependencies from database', () => {
      const expected = expect(GetDependencies({}, ["phy_ele_dmg"]))
      expected.toBeDependent({
        phy_ele_dmg: ["final_atk", "phy_bonus_multi", "enemy_level_multi", "enemy_phy_ele_res_multi"],
        final_atk: ["base_atk", "atk_", "atk"],
        phy_bonus_multi: ["phy_ele_dmg_", "dmg_"],
        enemy_level_multi: ["character_level", "enemy_level"],
        enemy_phy_ele_res_multi: ["enemy_phy_immunity", "enemy_phy_ele_res_"],
        base_atk: ["character_atk", "weapon_atk"],
      })
    })
    test('should add all dependencies from keys', () => {
      const expected = expect(GetDependencies({}, ["final_def", "ener_rech_"]))
      expected.toBeDependent({
        final_def: ["base_def", "def_", "def"],
        ener_rech_: []
      })
    })
    test(`should add all formulas' dependencies by default`, () => {
      expect(GetDependencies()).toEqual(expect.arrayContaining(Object.keys(StatData)))
    })
    test('should add modifiers if keys exists', () => {
      const keys = ["ener_rech_"]
      let modifiers = { ener_rech_: { crit_rate_: 10 } }
      //should add crit_rate_ to dependency
      expect(GetDependencies(modifiers, keys)).toBeDependent({ ener_rech_: ["crit_rate_"] })
      modifiers = { atk: { crit_rate_: 10 } }
      //should not add crit_rate_ to dependency, since its not part of the original dependency
      expect(GetDependencies(modifiers, keys)).toEqual(expect.not.arrayContaining(["atk"]))
    })
    test('should respect modifiers for chained dependencies', () => {
      const modifiers = { hp: { def: 10 }, def: { ener_rech_: 0 }, final_atk: { hp: 10 } }
      const expected = expect(GetDependencies(modifiers, ["final_atk"]))
      expected.toBeDependent({
        final_atk: ["hp"],
        hp: ["def"],
        def: ["ener_rech_"],
      })
    })
    test('should contains unique dependencies', () => {
      const received = GetDependencies()
      expect([...new Set(received)]).toEqual(received)
    })
    test('should handle non-algebraic dependencies', () => {
      expect(GetDependencies({}, ["normal_crit_multi"])).toBeDependent({
        normal_crit_multi: ["crit_rate_", "normal_crit_rate_", "crit_dmg_"]
      })
      expect(GetDependencies({}, ["charged_crit_multi"])).toBeDependent({
        charged_crit_multi: ["crit_rate_", "charged_crit_rate_", "crit_dmg_"]
      })
      expect(GetDependencies({}, ["crit_multi"])).toBeDependent({
        crit_multi: ["crit_rate_", "crit_dmg_"]
      })
      expect(GetDependencies({}, ["skill_crit_multi"])).toBeDependent({
        skill_crit_multi: ["crit_rate_", "skill_crit_rate_", "crit_dmg_"]
      })
      expect(GetDependencies({}, ["burst_crit_multi"])).toBeDependent({
        burst_crit_multi: ["crit_rate_", "burst_crit_rate_", "crit_dmg_"]
      })
      expect(GetDependencies({}, ["enemy_phy_ele_res_multi"])).toBeDependent({
        enemy_phy_ele_res_multi: ["enemy_phy_immunity", "enemy_phy_ele_res_"]
      })
      expect(GetDependencies({}, ["amp_reaction_base_multi"])).toBeDependent({
        amp_reaction_base_multi: ["ele_mas"]
      })

      const test_multi = (s) => {
        expect(GetDependencies({}, [s])).toBeDependent(Object.fromEntries([[s, ["character_level"]]]))
      }
      test_multi("overloaded_multi")
      test_multi("electrocharged_multi")
      test_multi("superconduct_multi")
      test_multi("swirl_multi")
      test_multi("shatter_multi")
      test_multi("crystalize_multi")
    })
  })
})
