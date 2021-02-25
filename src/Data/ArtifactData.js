import { getArrLastElement } from '../Util/Util';
import ElementalData from './ElementalData';
let ArtifactData = {}
let ArtifactDataImport = import('./Artifacts')
ArtifactDataImport.then(imp => {
  ArtifactData = imp.default
  ArtifactDataImport = null
})
const ArtifactMainSlotKeys = [
  "hp", "hp_", "atk", "atk_", "def", "def_", "ele_mas", "ener_rech_", "crit_rate_", "crit_dmg_", "heal_", "physical_dmg_",
]
Object.keys(ElementalData).forEach(key => ArtifactMainSlotKeys.push(`${key}_dmg_`))

const ArtifactStarsData = {
  // 1: { subsBaselow: 0, subBaseHigh: 0, numUpgradesOrUnlocks: 1 },
  // 2: { subsBaselow: 0, subBaseHigh: 1, numUpgradesOrUnlocks: 2 },
  3: { subsBaselow: 1, subBaseHigh: 2, numUpgradesOrUnlocks: 3 },
  4: { subsBaselow: 2, subBaseHigh: 3, numUpgradesOrUnlocks: 4 },
  5: { subsBaselow: 3, subBaseHigh: 4, numUpgradesOrUnlocks: 5 }
};

const ArtifactMainStatsData = {
  1: {
    hp: [129, 178, 227, 275, 324],
    atk: [8, 12, 15, 18, 21],
    hp_: [3.1, 4.3, 5.5, 6.7, 7.9],
    atk_: [3.1, 4.3, 5.5, 6.7, 7.9],
    def_: [3.9, 5.4, 6.9, 8.4, 9.9],
    physical_dmg_: [3.9, 5.4, 6.9, 8.4, 9.9],
    ele_dmg_: [3.1, 4.3, 5.5, 6.7, 7.9],
    ele_mas: [13, 17, 22, 27, 32],
    ener_rech_: [3.5, 4.8, 6.1, 7.5, 8.8],
    crit_rate_: [2.1, 2.9, 3.7, 4.5, 5.3],
    crit_dmg_: [4.2, 5.8, 7.4, 9.0, 10.5],
    heal_: [2.4, 3.3, 4.3, 5.2, 6.1],
  },
  2: {
    hp: [258, 331, 404, 478, 551, 624, 697, 770, 843],
    atk: [17, 22, 26, 31, 36, 41, 45, 50, 55],
    hp_: [4.2, 5.4, 6.6, 7.8, 9, 10.1, 11.3, 12.5, 13.7],
    atk_: [4.2, 5.4, 6.6, 7.8, 9, 10.1, 11.3, 12.5, 13.7],
    def_: [5.2, 6.7, 8.2, 9.7, 11.2, 12.7, 14.2, 15.6, 17.1],
    physical_dmg_: [5.2, 6.7, 8.2, 9.7, 11.2, 12.7, 14.2, 15.6, 17.1],
    ele_dmg_: [4.2, 5.4, 6.6, 7.8, 9, 10.1, 11.3, 12.5, 13.7],
    ele_mas: [17, 22, 26, 31, 36, 41, 45, 50, 55],
    ener_rech_: [4.7, 6, 7.3, 8.6, 9.9, 11.3, 12.6, 13.9, 15.2],
    crit_rate_: [2.8, 3.6, 4.4, 5.2, 6, 6.8, 7.6, 8.3, 9.1],
    crit_dmg_: [5.6, 7.2, 8.8, 10.4, 11.9, 13.5, 15.1, 16.7, 18.3],
    heal_: [3.2, 4.1, 5.1, 6, 6.9, 7.8, 8.7, 9.6, 10.5],
  },
  3: {
    hp: [430, 552, 674, 796, 918, 1040, 1162, 1283, 1405, 1527, 1649, 1771, 1893],
    atk: [28, 36, 44, 52, 60, 68, 76, 84, 91, 99, 107, 115, 123],
    hp_: [5.2, 6.7, 8.2, 9.7, 11.2, 12.7, 14.2, 15.6, 17.1, 18.6, 20.1, 21.6, 23.1],
    atk_: [5.2, 6.7, 8.2, 9.7, 11.2, 12.7, 14.2, 15.6, 17.1, 18.6, 20.1, 21.6, 23.1],
    def_: [6.6, 8.4, 10.3, 12.1, 14.0, 15.8, 17.7, 19.6, 21.4, 23.3, 25.1, 27.0, 28.8],
    physical_dmg_: [6.6, 8.4, 10.3, 12.1, 14.0, 15.8, 17.7, 19.6, 21.4, 23.3, 25.1, 27.0, 28.8],
    ele_dmg_: [5.2, 6.7, 8.2, 9.7, 11.2, 12.7, 14.2, 15.6, 17.1, 18.6, 20.1, 21.6, 23.1],
    ele_mas: [21, 27, 33, 39, 45, 51, 57, 63, 69, 75, 80, 86, 92],
    ener_rech_: [5.8, 7.5, 9.1, 10.8, 12.4, 14.1, 15.7, 17.4, 19.0, 20.7, 22.3, 24.0, 25.6],
    crit_rate_: [3.5, 4.5, 5.5, 6.5, 7.5, 8.4, 9.4, 10.4, 11.4, 12.4, 13.4, 14.4, 15.4],
    crit_dmg_: [7.0, 9.0, 11.0, 12.9, 14.9, 16.9, 18.9, 20.9, 22.8, 24.8, 26.8, 28.8, 30.8],
    heal_: [4.0, 5.2, 6.3, 7.5, 8.6, 9.8, 10.9, 12.0, 13.2, 14.3, 15.5, 16.6, 17.8],
  },
  4: {
    hp: [645, 828, 1011, 1194, 1377, 1559, 1742, 1925, 2108, 2291, 2474, 2657, 2839, 3022, 3205, 3388, 3571],
    atk: [42, 54, 66, 78, 90, 102, 113, 125, 137, 149, 161, 173, 185, 197, 209, 221, 232],
    hp_: [6.3, 8.1, 9.9, 11.6, 13.4, 15.2, 17.0, 18.8, 20.6, 22.3, 24.1, 25.9, 27.7, 29.5, 31.3, 33.0, 34.8],
    atk_: [6.3, 8.1, 9.9, 11.6, 13.4, 15.2, 17.0, 18.8, 20.6, 22.3, 24.1, 25.9, 27.7, 29.5, 31.3, 33.0, 34.8],
    def_: [7.9, 10.1, 12.3, 14.6, 16.8, 19.0, 21.2, 23.5, 25.7, 27.9, 30.2, 32.4, 34.6, 36.8, 39.1, 41.3, 43.5],
    physical_dmg_: [7.9, 10.1, 12.3, 14.6, 16.8, 19.0, 21.2, 23.5, 25.7, 27.9, 30.2, 32.4, 34.6, 36.8, 39.1, 41.3, 43.5],
    ele_dmg_: [6.3, 8.1, 9.9, 11.6, 13.4, 15.2, 17.0, 18.8, 20.6, 22.3, 24.1, 25.9, 27.7, 29.5, 31.3, 33.0, 34.8],
    ele_mas: [25, 32, 39, 47, 54, 61, 68, 75, 82, 89, 97, 104, 111, 118, 125, 132, 139],
    ener_rech_: [7.0, 9.0, 11.0, 12.9, 14.9, 16.9, 18.9, 20.9, 22.8, 24.8, 26.8, 28.8, 30.8, 32.8, 34.7, 36.7, 38.7],
    crit_rate_: [4.2, 5.4, 6.6, 7.8, 9.0, 10.1, 11.3, 12.5, 13.7, 14.9, 16.1, 17.3, 18.5, 19.7, 20.8, 22.0, 23.2],
    crit_dmg_: [8.4, 10.8, 13.1, 15.5, 17.9, 20.3, 22.7, 25.0, 27.4, 29.8, 32.2, 34.5, 36.9, 39.3, 41.7, 44.1, 46.4],
    heal_: [4.8, 6.2, 7.6, 9.0, 10.3, 11.7, 13.1, 14.4, 15.8, 17.2, 18.6, 19.9, 21.3, 22.7, 24.0, 25.4, 26.8],
  },
  5: {
    hp: [717, 920, 1123, 1326, 1530, 1733, 1936, 2139, 2342, 2545, 2749, 2952, 3155, 3358, 3561, 3764, 3967, 4171, 4374, 4577, 4780],
    atk: [47, 60, 73, 86, 100, 113, 126, 139, 152, 166, 179, 192, 205, 219, 232, 245, 258, 272, 285, 298, 311],
    hp_: [7.0, 9.0, 11.0, 12.9, 14.9, 16.9, 18.9, 20.9, 22.8, 24.8, 26.8, 28.8, 30.8, 32.8, 34.7, 36.7, 38.7, 40.7, 42.7, 44.6, 46.6],
    atk_: [7.0, 9.0, 11.0, 12.9, 14.9, 16.9, 18.9, 20.9, 22.8, 24.8, 26.8, 28.8, 30.8, 32.8, 34.7, 36.7, 38.7, 40.7, 42.7, 44.6, 46.6],
    def_: [8.7, 11.2, 13.7, 16.2, 18.6, 21.1, 23.6, 26.1, 28.6, 31, 33.5, 36, 38.5, 40.9, 43.4, 45.9, 48.4, 50.8, 53.3, 55.8, 58.3],
    physical_dmg_: [8.7, 11.2, 13.7, 16.2, 18.6, 21.1, 23.6, 26.1, 28.6, 31, 33.5, 36, 38.5, 40.9, 43.4, 45.9, 48.4, 50.8, 53.3, 55.8, 58.3],
    ele_dmg_: [7.0, 9.0, 11.0, 12.9, 14.9, 16.9, 18.9, 20.9, 22.8, 24.8, 26.8, 28.8, 30.8, 32.8, 34.7, 36.7, 38.7, 40.7, 42.7, 44.6, 46.6],
    ele_mas: [28, 36, 44, 52, 60, 68, 76, 84, 91, 99, 107, 115, 123, 131, 139, 147, 155, 163, 171, 179, 187],
    ener_rech_: [7.8, 10.0, 12.2, 14.4, 16.6, 18.8, 21.0, 23.2, 25.4, 27.6, 29.8, 32.0, 34.2, 36.4, 38.6, 40.8, 43.0, 45.2, 47.4, 49.6, 51.8],
    crit_rate_: [4.7, 6.0, 7.3, 8.6, 9.9, 11.3, 12.6, 13.9, 15.2, 16.6, 17.9, 19.2, 20.5, 21.8, 23.2, 24.5, 25.8, 27.1, 28.4, 29.8, 31.1],
    crit_dmg_: [9.3, 11.9, 14.6, 17.2, 19.9, 22.5, 25.5, 27.8, 30.5, 33.1, 35.8, 38.4, 41.1, 43.7, 46.3, 49.0, 51.6, 54.3, 56.9, 59.6, 62.2],
    heal_: [5.4, 6.9, 8.4, 10.0, 11.5, 13.0, 14.5, 16.1, 17.6, 19.1, 20.6, 22.2, 23.7, 25.2, 26.7, 28.3, 29.8, 31.3, 32.8, 34.4, 35.9],
  }
}

const ArtifactSubStatsData = {
  hp: { 1: [24, 30], 2: [50, 61, 72], 3: [100, 115, 129, 143], 4: [167, 191, 215, 239], 5: [209, 239, 269, 299] },
  hp_: { 1: [1.2, 1.5], 2: [1.6, 2, 2.3], 3: [2.5, 2.8, 3.2, 3.5], 4: [3.3, 3.7, 4.2, 4.7], 5: [4.1, 4.7, 5.3, 5.8] },
  atk: { 1: [2], 2: [3, 4, 5], 3: [7, 8, 9], 4: [11, 12, 14, 16], 5: [14, 16, 18, 19] },
  atk_: { 1: [1.2, 1.5], 2: [1.6, 2, 2.3], 3: [2.5, 2.8, 3.2, 3.5], 4: [3.3, 3.7, 4.2, 4.7], 5: [4.1, 4.7, 5.3, 5.8] },
  def: { 1: [2], 2: [4, 5, 6], 3: [8, 9, 10, 11], 4: [13, 15, 17, 19], 5: [16, 19, 21, 23] },
  def_: { 1: [1.5, 1.8], 2: [2, 2.5, 2.9], 3: [3.1, 3.5, 3.9, 4.4], 4: [4.1, 4.7, 5.3, 5.8], 5: [5.1, 5.8, 6.6, 7.3] },
  ele_mas: { 1: [5, 6], 2: [7, 8, 9], 3: [10, 11, 13, 14], 4: [13, 15, 17, 19], 5: [16, 19, 21, 23] },
  ener_rech_: { 1: [1.3, 1.6], 2: [1.8, 2.2, 2.6], 3: [2.7, 3.1, 3.5, 3.9], 4: [3.6, 4.1, 4.7, 5.2], 5: [4.5, 5.2, 5.8, 6.5] },
  crit_rate_: { 1: [0.8, 1], 2: [1.1, 1.3, 1.6], 3: [1.6, 1.9, 2.1, 2.3], 4: [2.2, 2.5, 2.8, 3.1], 5: [2.7, 3.1, 3.5, 3.9] },
  crit_dmg_: { 1: [1.6, 1.9], 2: [2.2, 2.6, 3.1], 3: [3.3, 3.7, 4.2, 4.7], 4: [4.4, 5, 5.6, 6.2], 5: [5.4, 6.2, 7, 7.8] },
}
const ArtifactSubstatsMinMax = Object.fromEntries(Object.entries(ArtifactSubStatsData).map(([key, obj]) =>
  [key, {
    max: Object.fromEntries(Object.keys(obj).map(key => [key, getArrLastElement(obj[key])])),
    min: Object.fromEntries(Object.keys(obj).map(key => [key, obj[key][0]])),
  }]))

const ArtifactSlotsData = {
  flower: { name: "Flower of Life", stats: ["hp"] },
  plume: { name: "Plume of Death", stats: ["atk"] },
  sands: { name: "Sands of Eon", stats: ["hp_", "def_", "atk_", "ele_mas", "ener_rech_"] },
  goblet: { name: "Goblet of Eonothem", stats: ["hp_", "def_", "atk_", "ele_mas", "physical_dmg_", "anemo_dmg_", "geo_dmg_", "electro_dmg_", "hydro_dmg_", "pyro_dmg_", "cryo_dmg_",] },
  circlet: { name: "Circlet of Logos", stats: ["hp_", "def_", "atk_", "ele_mas", "crit_rate_", "crit_dmg_", "heal_"] },
};

export {
  ArtifactMainSlotKeys,
  ArtifactSlotsData,
  ArtifactData,
  ArtifactDataImport,
  ArtifactSubStatsData,
  ArtifactSubstatsMinMax,
  ArtifactStarsData,
  ArtifactMainStatsData
};
