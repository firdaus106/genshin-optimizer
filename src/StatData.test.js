import { PreprocessFormulas } from "./StatData"
import { GetDependencies } from "./StatDependency"

describe(`Testing StatData`, () => {
  describe(`PreprocessFormulas()`, () => {
    test(`basic def`, () => {
      const stat = {
        characterDEF: 10,
        def_: 100,
        def: 15
      }, dependencyKeys = ["finalDEF", "characterDEF", "def_", "def"]
      PreprocessFormulas(dependencyKeys)(stat)
      expect(stat).toHaveProperty("finalDEF", 10 * 2 + 15);
    })
    test(`modifiers`, () => {
      const stat = {
        testVal: 10,
        depVal1: 15,
        depval2: 20,
      }, modifiers = {
        testVal: {
          depVal1: 2,
          depval2: 3
        }
      }
      PreprocessFormulas(["depVal1", "depval2", "testVal"], modifiers)(stat)
      expect(stat).toHaveProperty("testVal", 10 + 15 * 2 + 20 * 3);
    })
    test('should not add modifier if its not part of the dependency list', () => {
      const stat = {
        testVal: 10,
        depVal1: 15,
        depval2: 20,
      }, modifiers = {
        testVal: {
          depVal1: 2,
          depval2: 3
        }
      }
      PreprocessFormulas(["depVal1", "depval2"], modifiers)(stat)
      expect(stat).toHaveProperty("testVal", 10);
    })
    test('should compute correct result', () => {
      const stat = {
        characterHP: 9184, characterATK: 253, characterDEF: 576, critRate_: 5, enerRech_: 100 + 24 + 5.2 + 37.9,
        characterLevel: 80,

        weaponATK: 388, enemyLevel: 80,

        hp: 2342 + 269, atk: 152 + 18, atk_: 30.8 + 9.3 + 4.7, hydro_dmg_: 30.8 + (15), critDMG_: 50 + 43.7 + 7.8 + 6.2, critRate_: 5 + 3.1 + 3.5 + 9.3 + 5.4, def_: 6.6 + 5.8 + 7.3, eleMas: 44 + 19 + 42, hp_: 15.2, def: 21 + 39,
      }, modifiers = {
        hydro_dmg_: { enerRech_: 0.2 }
      }, targets = [
        "finalATK", "finalHP", "finalDEF",
        "hydro_normal_critHit", "hydro_normal_avgHit",
        "hydro_charged_critHit", "hydro_charged_avgHit",
        "hydro_skill_critHit", "hydro_skill_avgHit",
        "hydro_burst_critHit", "hydro_burst_avgHit",
        "hydro_vaporize_normal_avgHit",
        "hydro_vaporize_charged_avgHit",
        "hydro_vaporize_skill_avgHit",
        "hydro_vaporize_burst_avgHit",
        "electrocharged_hit",
        "shattered_hit",
      ]
      PreprocessFormulas(GetDependencies(modifiers, targets), modifiers)(stat)
      expect(stat.finalHP).toBeCloseTo(9184 + 4007, 0)
      expect(stat.finalDEF).toBeCloseTo(576 + 173, 0)
      expect(stat.hydro_normal_avgHit).toBeCloseTo(1137, 0)
      expect(stat.hydro_charged_avgHit).toBeCloseTo(1137, 0)
      expect(stat.hydro_skill_avgHit).toBeCloseTo(1137, 0)
      expect(stat.hydro_burst_avgHit).toBeCloseTo(1137, 0)
      expect(stat.hydro_normal_critHit).toBeCloseTo(1840, 0)
      expect(stat.hydro_charged_critHit).toBeCloseTo(1840, 0)
      expect(stat.hydro_skill_critHit).toBeCloseTo(1840, 0)
      expect(stat.hydro_burst_critHit).toBeCloseTo(1840, 0)
      expect(stat.hydro_vaporize_normal_avgHit).toBeCloseTo(2701, 0)
      expect(stat.hydro_vaporize_charged_avgHit).toBeCloseTo(2701, 0)
      expect(stat.hydro_vaporize_skill_avgHit).toBeCloseTo(2701, 0)
      expect(stat.hydro_vaporize_burst_avgHit).toBeCloseTo(2701, 0)
      expect(stat.electrocharged_hit).toBeCloseTo(1343, 0)
      expect(stat.shattered_hit).toBeCloseTo(1681, 0)
    })
  })
})
