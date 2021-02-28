import CharacterDatabase from "./Character/CharacterDatabase"
import ArtifactDatabase from "./Artifact/ArtifactDatabase"
import { DatabaseInitAndVerify } from "./DatabaseUtil"

describe('DatabaseUtil Tests', () => {
  describe('dbVersion 2', () => {
    test('should Convert old characters to unique', () => {
      Object.keys(localStorage).forEach(key => localStorage.removeItem(key))
      const characterKey = "testCharKey"
      const character_1 = {
        id: "character_1",
        name: "TEST1",
        characterKey,
        levelKey: "L1",
        buildSetting: { something: "something" },
        equippedArtifacts: { "slot1": "artifact_1", "slot2": "artifact_2" }//will get equipped to `characterKey`
      }
      const character_2 = {
        id: "character_2",
        name: "TEST2",
        characterKey,
        levelKey: "L1",
        buildSetting: { somethingelse: "somethingelse" },
        equippedArtifacts: { "slot1": "artifact_3" }//will get unequipped
      }
      localStorage.setItem("character_1", JSON.stringify(character_1))
      localStorage.setItem("character_2", JSON.stringify(character_2))
      const artCommon = { setKey: "set", numStars: 5, mainStatKey: "mainStat" }
      const artifact_1 = { id: "artifact_1", location: "character_1", slotKey: "slot1", ...artCommon }
      const artifact_2 = { id: "artifact_2", location: "character_1", slotKey: "slot2", ...artCommon }
      const artifact_3 = { id: "artifact_3", location: "character_2", slotKey: "slot1", ...artCommon }
      localStorage.setItem("artifact_1", JSON.stringify(artifact_1))
      localStorage.setItem("artifact_2", JSON.stringify(artifact_2))
      localStorage.setItem("artifact_3", JSON.stringify(artifact_3))
      localStorage.setItem("db_ver", "1")

      CharacterDatabase.clearDatabase()
      ArtifactDatabase.clearDatabase()

      //should generate unique character from character_1
      DatabaseInitAndVerify()
      const { id, name, ...rest } = character_1
      expect(CharacterDatabase.get(characterKey)).toEqual(rest)
      expect(ArtifactDatabase.get("artifact_1").location).toBe(characterKey)
      expect(ArtifactDatabase.get("artifact_2").location).toBe(characterKey)
      expect(ArtifactDatabase.get("artifact_3").location).toBe("")
    })
  })
})
