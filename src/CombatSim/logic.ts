import { BattleData, CombatSimulation, SideAction, UnitData } from "./types";

const sideActionList = (() => {
  const all: {[K in SideAction]: true} = {
    ATK: true,
    DEF: true,
    "ATK&DEF": true,
    NIL: true,
  }
  const list: SideAction[] = []
  for (const k of Object.keys(all)) {
    list.push(k as SideAction)
  }
  return list
})();

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
    const battleUnits = {
      attacking: battle.attacker.units.flatMap(u => {
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
        return found ? [{...found, totalSides, sidesList, amount: u.amount}] : [];
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
        return found ? [{...found, totalSides, sidesList, amount: u.amount}] : [];
      })
    }
    const interval = window.setInterval(() => {
      for (let i = 0; i < iterations; i++) {
        const currentBattleUnits = structuredClone(battleUnits);

        // If either side has no viable units battle shouldn't happen
        if (currentBattleUnits.attacking.filter(u => !u.special.support).length == 0 || currentBattleUnits.defending.filter(u => !u.special.support).length == 0) {
          break;
        }

        while (true) {
          // Roll the dice
          let attackerATK = battle.attacker.attackModifier;
          let attackerDEF = battle.attacker.defenceModifier;
          for (let u of currentBattleUnits.attacking) {
            for (let j = 0; j < u.amount; j++) {
              let roll = Math.floor(Math.random() * u.totalSides) + 1
              for (let side of u.sidesList) {
                if (roll > side.chance) {
                  roll -= side.chance
                } else {
                  if (side.action === 'ATK' || side.action === "ATK&DEF") {
                    attackerATK++;
                  }
                  if (side.action === 'DEF' || side.action === "ATK&DEF") {
                    attackerDEF++;
                  }
                  break;
                }
              }
            }
          }
          let defenderATK = battle.defender.attackModifier;
          let defenderDEF = battle.defender.defenceModifier;
          for (let u of currentBattleUnits.defending) {
            for (let j = 0; j < u.amount; j++) {
              let roll = Math.floor(Math.random() * u.totalSides) + 1
              for (let side of u.sidesList) {
                if (roll > side.chance) {
                  roll -= side.chance
                } else {
                  if (side.action === 'ATK' || side.action === "ATK&DEF") {
                    defenderATK++;
                  }
                  if (side.action === 'DEF' || side.action === "ATK&DEF") {
                    defenderDEF++;
                  }
                  break;
                }
              }
            }
          }


          defenderATK -= attackerDEF;
          for (let i = currentBattleUnits.attacking.length - 1; i >= 0; i--) {
            if (defenderATK <= 0) break;
            const u = currentBattleUnits.attacking[i];
            if (u && !u.special.support) {
              defenderATK--
              u.amount -= 1;
              if (u.amount <= 0) {
                currentBattleUnits.attacking.splice(i, 1);
              }
            }
          }

          attackerATK -= defenderDEF;
          for (let i = currentBattleUnits.defending.length - 1; i >= 0; i--) {
            if (attackerATK <= 0) break;
            const u = currentBattleUnits.defending[i];
            if (u && !u.special.support) {
              attackerATK--
              u.amount -= 1;
              if (u.amount <= 0) {
                currentBattleUnits.defending.splice(i, 1);
              }
            }
          }


          // Note: If attacker dies they lose even if they kill everyone
          if (currentBattleUnits.attacking.filter(u => !u.special.support).length === 0) {
            battle.iterations++;
            break;
          }

          if (currentBattleUnits.defending.filter(u => !u.special.support).length === 0) {
            battle.iterations++;
            battle.result.attackerVictories++;
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