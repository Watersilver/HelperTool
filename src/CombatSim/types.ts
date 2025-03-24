export type SideAction = 'ATK' | 'DEF' | 'ATK&DEF' | 'DBL' | 'TRPL' | 'XPL' | 'NIL' | 'DBL-DEF' | 'TRPL-DEF';

export type UnitData = {
  id: string,
  name: string,
  sides: {[K in SideAction]?: number},
  special: {
    support?: boolean;
    first_strike?: boolean;
    bull_strength?: boolean;
    dawg?: boolean;
    epi_tas?: boolean;
    phalanx?: boolean;
  }
};

export type BattleSide = {
  units: {id: string, amount: number}[];
  attackModifier: number;
  defenceModifier: number;
  general?: boolean;
};

export type BattleData = {
  id: string,
  attacker: BattleSide,
  defender: BattleSide,
  iterations: number,
  result: {
    attackerVictories: number,
    draws: number,
    firstRoundDeaths: {attackerChance: number, defenderChance: number}[]
  },
};

export type CombatSimulation = {
  id: string;
  name: string;
  battles: BattleData[];
  script?: string;
};
