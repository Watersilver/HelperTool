export type SideAction = 'ATK' | 'DEF' | 'ATK&DEF' | 'NIL';

export type UnitData = {
  id: string,
  name: string,
  sides: {[K in SideAction]?: number},
  special: {
    support?: boolean
  }
};

export type BattleSide = {
  units: {id: string, amount: number}[];
  attackModifier: number;
  defenceModifier: number;
};

export type BattleData = {
  id: string,
  attacker: BattleSide,
  defender: BattleSide,
  iterations: number,
  result: {
    attackerVictories: number
  }
};

export type CombatSimulation = {
  id: string;
  name: string;
  battles: BattleData[];
};