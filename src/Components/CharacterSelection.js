import Dropdown from "react-bootstrap/Dropdown";
import Character from "../Character/Character";
import CharacterDatabase from "../Character/CharacterDatabase";

function CharacterSelectionDropdownList({ onSelect }) {
  return Object.keys(CharacterDatabase.getCharacterDatabase()).map(characterKey =>
    <Dropdown.Item key={characterKey} onClick={() => onSelect(characterKey)}>
      {Character.getName(characterKey)}
    </Dropdown.Item>)
}
export {
  CharacterSelectionDropdownList,
};

