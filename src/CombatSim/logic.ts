import { BattleData, BattleSide, CombatSimulation, SideAction, UnitData } from "./types";

const sideActionList = (() => {
  const all: {[K in SideAction]: true} = {
    ATK: true,
    DEF: true,
    "ATK&DEF": true,
    DBL: true,
    NIL: true,
  }
  const list: SideAction[] = []
  for (const k of Object.keys(all)) {
    list.push(k as SideAction)
  }
  return list
})();


type BattleUnit = UnitData & {
  totalSides: number;
  sidesList: {
    action: SideAction;
    chance: number;
  }[];
  amount: number;
  dying: number;
}

class RoundSideState {
  atk = 0;
  def = 0;
  general = false;

  battleUnits: BattleUnit[];
  opponent: RoundSideState | null = null;
  roundState: {
    firstStrike: boolean;
    dog: boolean;
  }

  constructor(bs: BattleSide, u: BattleUnit[], rs: typeof this.roundState) {
    this.atk = bs.attackModifier;
    this.def = bs.defenceModifier;
    this.general = !!bs.general;
    this.battleUnits = u;
    this.roundState = rs;
  }

  setOpponent(o: RoundSideState) {
    this.opponent = o;
  }

  attack() {
    for (let u of this.battleUnits) {
      const fsAtkCheck = (!this.roundState.firstStrike || u.special.first_strike)
      for (let j = 0; j < u.amount; j++) {
        let success = false;
        let roll = Math.floor(Math.random() * u.totalSides) + 1
        for (let side of u.sidesList) {
          if (roll > side.chance) {
            roll -= side.chance
          } else {
            if (fsAtkCheck && !this.roundState.dog) {
              if (side.action === 'ATK' || side.action === "ATK&DEF") {
                this.atk++;
                success = true;
              }
              if (side.action === 'DBL') {
                this.atk += 2;
                success = true;
              }
            }
            if (side.action === 'DEF' || side.action === "ATK&DEF") {
              this.def++;
              success = true;
            }
            break;
          }
        }
        if (!success && this.general) {
          this.general = false;
          j--;
        }
      }
      if (u.special.dawg && fsAtkCheck) {
        for (let j = 0; j < u.amount; j++) {
          let roll = Math.floor(Math.random() * 6) + 1
          if (roll >= 5) {
            this.atk++;
          }
        }
      }
      if (u.special.phalanx && fsAtkCheck && !this.roundState.dog) {
        for (let j = 0; j < u.amount - 1; j++) {
          let roll = Math.floor(Math.random() * 6) + 1
          if (roll >= 5) {
            this.atk++;
          } else if (roll == 4) {
            this.def++;
          }
        }
      }
    }
  }

  dieFromWounds() {
    for (let i = this.battleUnits.length - 1; i >= 0; i--) {
      const u = this.battleUnits[i];
      if (u) {
        u.amount -= u.dying;
        if (u.amount <= 0) {
          this.battleUnits.splice(i, 1);
        }
      }
    }
  }

  applyDamageToEnemy() {
    if (!this.opponent) return;
    this.atk -= this.opponent.def;

    const panic = this.roundState.dog && (Math.floor(this.opponent.battleUnits.length) <= this.atk);

    for (let i = this.opponent.battleUnits.length - 1; i >= 0; i--) {
      if (this.atk <= 0) break;
      const u = this.opponent.battleUnits[i];
      if (u) {
        const maxPossibleDeaths = Math.min(u.amount - u.dying, this.atk);
        this.atk -= maxPossibleDeaths;
        if (u.special.bull_strength) {
          u.dying += maxPossibleDeaths;
        } else {
          u.amount -= maxPossibleDeaths;
          if (u.amount <= 0) {
            this.opponent.battleUnits.splice(i, 1);
          }
        }
      }
    }

    if (panic) {
      for (let i = this.opponent.battleUnits.length - 1; i >= 0; i--) {
        const u = this.opponent.battleUnits[i];
        if (u && !u.special.epi_tas) {
          let panicd = 0;
          for (let j = 0; j < u.amount - u.dying; j++) {
            if (Math.random() < 0.5) {
              panicd++;
            }
          }
          u.amount -= panicd;
          if (u.amount <= 0) {
            this.opponent.battleUnits.splice(i, 1);
          }
        }
      }
    }
  }

  isDead() {
    return this.battleUnits.filter(u => !u.special.support).length === 0
  }

  willBeDeadSoon() {
    return this.battleUnits.filter(u => !u.special.support).filter(u => u.amount - u.dying > 0).length === 0
  }
}


class CombatSimRunner {
  protected battleSims: {
    [battleId: string]: {
      interval: number
    }
  } = {}
  protected current: CombatSimulation | null = null;
  protected units: UnitData[] | null = null;

  initialize(data: CombatSimulation, units: UnitData[]) {
    this.current = structuredClone(data);
    this.units = structuredClone(units);
  }

  start(iterations: number): boolean {
    const c = this.current;
    if (!c) return false;
    for (const b of c.battles) {
      this.startBattle(b.id, iterations);
    }
    return true;
  }

  end(): boolean {
    const c = this.current;
    if (!c) return false;
    for (const b of c.battles) {
      this.endBattle(b.id);
    }
    return true;
  }

  startBattle(id: string, iterations: number): BattleData | null {
    const units = this.units;
    if (!units) return null;
    const battle = this.getBattle(id);
    if (!battle) return battle;
    if (this.battleSims[id] !== undefined) return null; // Already running
    const battleUnits : {
      attacking: BattleUnit[],
      defending: BattleUnit[]
    } = {
      attacking: battle.attacker.units.flatMap((u) => {
        const found = units.find(u2 => u.id === u2.id);
        if (!found) return [];
        const totalSides = Object.values(found.sides).reduce((a, c) => a + c, 0);
        const sidesList = sideActionList.flatMap(a => {
          if (found.sides[a]) {
            const chance = found.sides[a];
            return [{action: a, chance}];
          } else {
            return [];
          }
        });
        return found ? [{...found, totalSides, sidesList, amount: u.amount, dying: 0}] : [];
      }),
      defending: battle.defender.units.flatMap(u => {
        const found = units.find(u2 => u.id === u2.id);
        if (!found) return [];
        const totalSides = Object.values(found.sides).reduce((a, c) => a + c, 0);
        const sidesList = sideActionList.flatMap(a => {
          if (found.sides[a]) {
            const chance = found.sides[a];
            return [{action: a, chance}];
          } else {
            return [];
          }
        });
        return found ? [{...found, totalSides, sidesList, amount: u.amount, dying: 0}] : [];
      })
    }
    const interval = window.setInterval(() => {
      for (let i = 0; i < iterations; i++) {
        const currentBattleUnits = structuredClone(battleUnits);

        // If either side has no viable units battle shouldn't happen
        if (currentBattleUnits.attacking.filter(u => !u.special.support).length == 0 || currentBattleUnits.defending.filter(u => !u.special.support).length == 0) {
          break;
        }

        let first_strike = currentBattleUnits.attacking.concat(currentBattleUnits.defending).some(u => u.special.first_strike);
        let dawg_shock = currentBattleUnits.attacking.concat(currentBattleUnits.defending).some(u => u.special.dawg);
        while (true) {
          const first_strike_round = first_strike;
          const dawg_shock_round = !first_strike_round && dawg_shock;
          first_strike = false;
          if (dawg_shock_round) {
            dawg_shock = false;
          }

          const attacker = new RoundSideState(battle.attacker, currentBattleUnits.attacking, {firstStrike: first_strike_round, dog: dawg_shock_round});
          const defender = new RoundSideState(battle.defender, currentBattleUnits.defending, {firstStrike: first_strike_round, dog: dawg_shock_round});
          attacker.setOpponent(defender);
          defender.setOpponent(attacker);

          attacker.attack();
          defender.attack();

          attacker.dieFromWounds();
          defender.dieFromWounds();

          attacker.applyDamageToEnemy();
          defender.applyDamageToEnemy();

          // Note: If attacker dies they lose even if they kill everyone
          if (attacker.isDead()) {
            battle.iterations++;
            if (defender.isDead()) {
              battle.result.draws++;
            }
            break;
          }

          if (defender.isDead()) {
            battle.iterations++;
            // Berserkers that die next round don't actually win
            if (!attacker.willBeDeadSoon()) {
              battle.result.attackerVictories++;
            } else {
              battle.result.draws++;
            }
            break;
          }
        }
      }
    });
    this.battleSims[id] = {
      interval
    };
    return battle;
  }

  endBattle(id: string): BattleData | null {
    const battle = this.getBattle(id);
    if (!battle) return battle;
    if (this.battleSims[id]) {
      clearInterval(this.battleSims[id].interval);
      delete this.battleSims[id];
    }
    return battle;
  }

  getBattle(id: string): BattleData | null {
    if (!this.current) return null;
    const battle = this.current.battles.find(b => b.id === id);
    if (!battle) return null;
    return battle;
  }
};

const combatSimRunner = new CombatSimRunner();
export default combatSimRunner;

// TODO: check if they die in the correct order