import { Alert, AlertTitle, Autocomplete, Box, Button, Card, CardContent, CardHeader, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, FormControlLabel, Grid2, IconButton, List, ListItem, ListItemButton, ListItemText, Stack, Switch, Tab, Tabs, TextField, Typography } from "@mui/material"
import { BarChart } from "@mui/x-charts"
import { atom, useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { useEffect, useMemo, useRef, useState } from "react"

import { BattleData, CombatSimulation, SideAction, UnitData } from "./types"

import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';

import combatSimRunner from "./logic"

const modulo = (n: number, d: number) => ((n % d) + d) % d;

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

const unitsAtom = atomWithStorage<UnitData[]>('units', []);

const selectedUnitAtom = atomWithStorage<UnitData>('selectedUnitAtom', {id: crypto.randomUUID(), name: '', sides: {}, special: {}});
const selectedCombatAtom = atomWithStorage<CombatSimulation>('selectedCombatAtom', {id: crypto.randomUUID(), name: '', battles: []})

function EditUnitsMode() {
  const [_, setCombats] = useAtom(combatsAtom);
  const [__, setSelectedCombat] = useAtom(selectedCombatAtom);

  const [units, setUnits] = useAtom(unitsAtom);

  const [editing, setEditing] = useAtom(selectedUnitAtom);

  const [deleting, setDeleting] = useState<UnitData | null>(null);

  const nameConflict = units.some(u => u.name.toLowerCase() === editing.name.toLowerCase() && u.id !== editing.id);

  return <Stack direction='row'>
    <Box>
      <List>
        {
          units.map(unit => {
            return <ListItemButton
              key={unit.id}
              selected={editing.id === unit.id}
              onClick={() => {
                setEditing(unit)
              }}
            >
              <ListItemText primary={unit.name} />
            </ListItemButton>;
          })
        }
        {units.length > 0 ? <Divider flexItem /> : null}
        <ListItemButton
          onClick={() => {
            setEditing(() => {
              let id = crypto.randomUUID();
              while (units.find(u => u.id === id)) id = crypto.randomUUID();
              return {id, name: '', sides: {}, special: {}};
            })
          }}
        >
          <ListItemText primary="Define New Unit" />
        </ListItemButton>
      </List>
      <Divider />
    </Box>
    <Divider orientation='vertical' flexItem />
    <Container sx={{flexGrow: 1, py: 3}}>
      <Button
        sx={{float: 'right'}}
        onClick={() => {
          if (nameConflict) return;
          setUnits(prev => {
            const i = prev.findIndex(u => u.id === editing.id)
            const newUnits = [...prev]
            if (i === -1) {
              newUnits.push(editing)
            } else {
              newUnits[i] = editing
            }
            return newUnits
          });
          setCombats(prev => {
            const next = structuredClone(prev);
            for (const c of prev) {
              c.battles.forEach(b => {
                if (b.attacker.units.some(u => u.id === editing.id)) {
                  b.result.attackerVictories = 0;
                  b.iterations = 0;
                }
                if (b.defender.units.some(u => u.id === editing.id)) {
                  b.result.attackerVictories = 0;
                  b.iterations = 0;
                }
              });
            }
            return next;
          });
          setSelectedCombat(prev => {
            const next = structuredClone(prev);
            next.battles.forEach(b => {
              if (b.attacker.units.some(u => u.id === editing.id)) {
                b.result.attackerVictories = 0;
                b.iterations = 0;
                next.script = undefined;
              }
              if (b.defender.units.some(u => u.id === editing.id)) {
                b.result.attackerVictories = 0;
                b.iterations = 0;
                next.script = undefined;
              }
            });
            return next;
          });
        }}
        disabled={editing.name === "" || nameConflict}
      >
        Save
      </Button>
      {<Button
        sx={{float: 'right'}}
        onClick={() => {
          if (units.some(u => u.id === editing.id)) {
            setDeleting(editing)
          }
        }}
        disabled={!units.some(u => u.id === editing.id)}
        color="error"
      >
        Delete
      </Button>}
      {
        <Dialog
          open={deleting !== null}
          onClose={() => setDeleting(null)}
        >
          <DialogTitle color="error">
            Whoa there, cowboy!
          </DialogTitle>
          <DialogContent>
            <DialogContentText color="error">
              Do you even understand what you're about to do??
              Deleting this will destroy every battle this unit participates in FOREVER!
              <br></br>
              <br></br>
              Is that what you want? Yes? I'm sorry, am I bothering you? Huh?
              <br></br>
              <br></br>
              What's that? You think you can take me?
              <br></br>
              <br></br>
              Whu-?
              <br></br>
              <br></br>
              What the fuck did you just fucking say about me, you little bitch? I'll have you know I graduated top of my class in the Navy Seals, and I've been involved in secret raids on Al-Quaeda, and I have over 300 confirmed kills. I am trained in gorilla warfare and I'm the top sniper in the entire US armed forces. You are nothing to me but just another target. I will wipe you out with precision the likes of which has never been seen before on this Earth, mark my words. You think you can get away with saying shit to me over the Internet? Think again, fucker. As we speak I am contacting my network of spies across the USA and your IP is being traced right now so you better prepare for the storm, maggot. The storm that wipes out the pathetic little thing you call your life. You're fucking dead, kid. I can be anywhere, anytime, and I can kill you in over seven hundred ways, and that's just with my bare hands. Not only am I extensively trained in unarmed combat, but I have access to the entire arsenal of the United States Marine Corps and I will use it to its full extent to wipe your ass off the face of the continent, you little shit. If only you could have known what unholy retribution your little “clever” comment was about to bring down upon you, maybe you would have held your tongue. You didn't, and now you're paying the price, you goddamn idiot. I will shit all over you and you will drown in it. You're fucking dead, kiddo.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDeleting(null)}
              sx={{
                textTransform: 'none'
              }}
            >
              Sorry sir, I didn't mean to...
            </Button>
            <Button
              onClick={() => {
                if (!deleting) return;
                setUnits(prev => {
                  const newUnits = prev.filter(u => u.id !== deleting.id)
                  return newUnits
                });
                setCombats(prev => {
                  const next = structuredClone(prev);
                  for (const c of prev) {
                    c.battles = c.battles.filter(b => {
                      if (b.attacker.units.some(u => u.id === deleting.id)) return false;
                      if (b.defender.units.some(u => u.id === deleting.id)) return false;
                      return true;
                    });
                  }
                  return next;
                });
                setSelectedCombat(prev => {
                  const next = structuredClone(prev);
                  const startSize = next.battles.length;
                  next.battles = next.battles.filter(b => {
                    if (b.attacker.units.some(u => u.id === deleting.id)) return false;
                    if (b.defender.units.some(u => u.id === deleting.id)) return false;
                    return true;
                  });
                  if (startSize !== next.battles.length) {
                    next.script = undefined;
                  }
                  return next;
                });
                setDeleting(null);
              }}
              color="error"
            >
              I WILL DESTROY THIS UNIT AND THEN YOU
            </Button>
          </DialogActions>
        </Dialog>
      }
      <Stack direction='row' spacing={1}>
        <Stack>
          <TextField
            label='Name'
            value={editing.name}
            onChange={(e) => {setEditing(prev => ({...prev, name: e.target.value}))}}
            required
            color={
              nameConflict ? 'error' : undefined
            }
            helperText={
              nameConflict
              ? 'Unit with this name already exists'
              : undefined
            }
          />
          <FormControlLabel
            control={
            <Switch
              checked={editing.special.support || false}
              onChange={(_, c) => {
                setEditing(p => {
                  return {
                    ...p,
                    special: {
                      ...p.special,
                      support: c
                    }
                  }
                })
              }}
            />
            }
            label="Support Unit"
          />
        </Stack>
        <Stack spacing={1}>
          {
            sideActionList.map(sa => {
              return <TextField
                inputMode="numeric"
                
                label={sa}
                key={sa}
                value={editing.sides[sa] ? editing.sides[sa] : '0'}
                onChange={(e) => {
                  let newVal = 0;
                  if (e.target.value) {
                    const v = Number.parseInt(e.target.value)
                    if (!Number.isNaN(v)) {
                      newVal = v;
                    }
                  }
                  setEditing(prev => {
                    return {
                      ...prev,
                      sides: {
                        ...prev.sides,
                        [sa]: newVal
                      }
                    }
                  });
                }}

                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />
            })
          }
        </Stack>
      </Stack>
    </Container>
  </Stack>;
}


const simRunningAtom = atom(false);

const combatsAtom = atomWithStorage<CombatSimulation[]>('combats', [])

function BattleUnitsCard({
  battle,
  units,
  setSelected,
  defender
}: {
  battle: BattleData;
  units: readonly UnitData[];
  setSelected: React.Dispatch<React.SetStateAction<CombatSimulation>>;
  defender?: boolean;
}) {

  const field = defender ? "defender" : "attacker";

  const available = useMemo(() => {
    return units.filter(unit => !battle[field].units.some(n => unit.id === n.id))
  }, [units, battle]);

  const [autoVal, setAutoVal] = useState<string | null>(null);

  const changeUnitAmount = (unitId: string, change: number) => {
    setSelected(prev => {
      const next = structuredClone(prev);
      const selected_battle = next.battles.find(b => b.id === battle.id);
      const found = selected_battle?.[field].units.find(u => u.id === unitId);
      if (selected_battle && found) {
        found.amount += change;
        if (found.amount <= 0) {
          const i = selected_battle[field].units.findIndex(u => u.id === unitId);
          if (i !== -1) {
            selected_battle[field].units.splice(i, 1);
          }
        }
        selected_battle.iterations = 0;
        selected_battle.result = {
          attackerVictories: 0
        };
      }
      next.script = undefined;
      return next;
    });
  }

  return <Card variant='outlined' sx={{flexGrow: 1}}>
    <CardHeader title={defender ? "Defender" : "Attacker"} subheader="Higher dies last" />
    <CardContent>
      <List>
        {
          battle[field].units.map(d => {
            const unit = units.find(u => u.id === d.id);
            if (!unit) return <ListItem key={d.id}>Not found</ListItem>;
            return <ListItem key={d.id}>
              <IconButton
                onClick={() => {
                  changeUnitAmount(d.id, -1)
                }}
              >
                <RemoveIcon />
              </IconButton>
              <Typography>
                {d.amount} x {unit.name}
              </Typography>
              <IconButton
                onClick={() => {
                  changeUnitAmount(d.id, 1)
                }}
              >
                <AddIcon />
              </IconButton>
              <ListItemText
                primary=" "
              />
              <IconButton
                disabled={battle[field].units.findIndex(u => u.id === unit.id) === 0}
                onClick={() => {
                  setSelected(prev => {
                    const next: typeof prev = structuredClone(prev);
                    const selected_battle = next.battles.find(b => b.id === battle.id);
                    if (selected_battle) {
                      const i = selected_battle[field].units.findIndex(u => u.id === d.id);
                      if (i !== -1) {
                        const temp = selected_battle[field].units[i];
                        const other = selected_battle[field].units[modulo(i - 1, selected_battle[field].units.length)];
                        if (other) {
                          selected_battle[field].units[i] = other;
                        }
                        if (temp) {
                          selected_battle[field].units[modulo(i - 1, selected_battle[field].units.length)] = temp;
                        }
                        selected_battle.iterations = 0;
                        selected_battle.result = {
                          attackerVictories: 0
                        };
                      }
                    }
                    next.script = undefined;
                    return next;
                  });
                }}
              >
                <KeyboardArrowUpIcon />
              </IconButton>
              <IconButton
                disabled={battle[field].units.findIndex(u => u.id === unit.id) === battle[field].units.length - 1}
                onClick={() => {
                  setSelected(prev => {
                    const next: typeof prev = structuredClone(prev);
                    const selected_battle = next.battles.find(b => b.id === battle.id);
                    if (selected_battle) {
                      const i = selected_battle[field].units.findIndex(u => u.id === d.id);
                      if (i !== -1) {
                        const temp = selected_battle[field].units[i];
                        const other = selected_battle[field].units[modulo(i + 1, selected_battle[field].units.length)];
                        if (other) {
                          selected_battle[field].units[i] = other;
                        }
                        if (temp) {
                          selected_battle[field].units[modulo(i + 1, selected_battle[field].units.length)] = temp;
                        }
                        selected_battle.iterations = 0;
                        selected_battle.result = {
                          attackerVictories: 0
                        };
                      }
                    }
                    next.script = undefined;
                    return next;
                  });
                }}
              >
                <KeyboardArrowDownIcon />
              </IconButton>
            </ListItem>
          })
        }
        {
          available.length > 0
          ? <ListItem>
            <Autocomplete
              fullWidth
              value={autoVal}
              onChange={(_, v) => {
                setAutoVal(v);
              }}
              options={available.map(a => a.name)}
              renderInput={(params) => <TextField {...params} label="Unit" />}
            />
            <Button
              onClick={() => {
                setSelected(prev => {
                  const newVal: typeof prev = structuredClone(prev);
                  const found = newVal.battles.find(b => b.id === battle.id);
                  if (found) {
                    if (autoVal) {
                      const unit = units.find(u => u.name === autoVal);
                      if (unit) {
                        found[field].units.push({id: unit.id, amount: 1});
                        found.iterations = 0;
                        found.result = {attackerVictories: 0};
                        newVal.script = undefined;
                      }
                    }
                  }
                  return newVal;
                })
                setAutoVal(null);
              }}
            >
              Add
            </Button>
          </ListItem>
          : null
        }
      </List>
      <Stack
        direction='row'
        justifyContent='space-between'
      >
        <TextField
          inputMode='numeric'
          label={`${defender ? "Defender" : "Attacker"} attack modifier`}
          value={battle[field].attackModifier}
          onChange={(e) => {
            setSelected(prev => {
              let newVal = 0;
              if (e.target.value) {
                const v = Number.parseInt(e.target.value)
                if (!Number.isNaN(v)) {
                  newVal = v;
                }
              }
              const next: typeof prev = structuredClone(prev);
              const selected_battle = next.battles.find(b => b.id === battle.id);
              if (selected_battle) {
                selected_battle[field].attackModifier = newVal;
                selected_battle.iterations = 0;
                selected_battle.result = {
                  attackerVictories: 0
                };
              }
              next.script = undefined;
              return next;
            });
          }}
        />
        <TextField
          inputMode='numeric'
          label={`${defender ? "Defender" : "Attacker"} defence modifier`}
          value={battle[field].defenceModifier}
          onChange={(e) => {
            setSelected(prev => {
              let newVal = 0;
              if (e.target.value) {
                const v = Number.parseInt(e.target.value)
                if (!Number.isNaN(v)) {
                  newVal = v;
                }
              }
              const next: typeof prev = structuredClone(prev);
              const selected_battle = next.battles.find(b => b.id === battle.id);
              if (selected_battle) {
                selected_battle[field].defenceModifier = newVal;
                selected_battle.iterations = 0;
                selected_battle.result = {
                  attackerVictories: 0
                };
              }
              next.script = undefined;
              return next;
            });
          }}
        />
      </Stack>
    </CardContent>
  </Card>
}

function BattleCard({
  battle,
  units,
  selected,
  setSelected
}: {
  battle: BattleData,
  units: readonly UnitData[],
  selected: CombatSimulation,
  setSelected: React.Dispatch<React.SetStateAction<CombatSimulation>>
}) {

  // const [isSimRunning] = useAtom(simRunningAtom);

  const i = selected.battles.findIndex(b => b.id === battle.id);

  return <Card>
    <CardContent sx={{pr:0,pb: "16px !important"}}>
      <Stack direction='row'>
        <Stack spacing={1} sx={{flexGrow: 1}}>
          <Stack direction='row' spacing={1} sx={{flexGrow: 1}}>
            <BattleUnitsCard
              battle={battle}
              units={units}
              setSelected={setSelected}
            />
            <BattleUnitsCard
              battle={battle}
              units={units}
              setSelected={setSelected}
              defender
            />
          </Stack>
          <Card variant="outlined">
            <Grid2 container sx={{p: 1}}>
              <Grid2 size={6}>
                <Stack direction='row'>
                  <Typography textAlign='center' flexGrow={1}>
                    Iterations: {battle.iterations}
                  </Typography>
                  <Divider orientation="vertical" flexItem />
                </Stack>
              </Grid2>
              <Grid2 size={6}>
                <Stack direction='row'>
                  <Divider orientation="vertical" flexItem />
                  <Typography textAlign='center' flexGrow={1}>
                    Attacker Victory Chance: {battle.result.attackerVictories / battle.iterations}
                  </Typography>
                </Stack>
              </Grid2>
            </Grid2>
          </Card>
        </Stack>
        <Stack spacing={1}>
          <Stack flexGrow={1}>
            {i !== 0 ? <IconButton
              onClick={() => {
                setSelected(p => {
                  const nextSel: typeof p = {...p, battles: [...p.battles]};
                  const i = p.battles.findIndex(b => b.id === battle.id);
                  if (i === 0) return nextSel;
                  const current = nextSel.battles[i];
                  if (!current) return nextSel;
                  const prev = nextSel.battles[i-1];
                  if (!prev) return nextSel;
                  nextSel.battles[i] = prev;
                  nextSel.battles[i-1] = current;
                  nextSel.script = undefined;
                  return nextSel;
                });
              }}
            >
              <KeyboardDoubleArrowUpIcon />
            </IconButton> : null}
            {i !== selected.battles.length - 1 ? <IconButton
              onClick={() => {
                setSelected(p => {
                  const nextSel: typeof p = {...p, battles: [...p.battles]};
                  const i = p.battles.findIndex(b => b.id === battle.id);
                  if (i === selected.battles.length) return nextSel;
                  const current = nextSel.battles[i];
                  if (!current) return nextSel;
                  const next = nextSel.battles[i+1];
                  if (!next) return nextSel;
                  nextSel.battles[i] = next;
                  nextSel.battles[i+1] = current;
                  nextSel.script = undefined;
                  return nextSel;
                });
              }}
            >
              <KeyboardDoubleArrowDownIcon />
            </IconButton> : null}
          </Stack>
          {/* <Button
            sx={{minWidth:0}}
            disabled={isSimRunning}
          >
            R<br/>U<br/>N
          </Button> */}
          <Button
            color="error"
            sx={{minWidth:0}}
            onClick={() => {
              setSelected(prev => {
                const next: typeof prev = {...prev, battles: [...prev.battles]};
                const i = next.battles.findIndex(b => b.id === battle.id);
                if (i !== -1) {
                  next.battles.splice(i, 1)
                }
                next.script = undefined;
                return next;
              })
            }}
          >
            D<br/>E<br/>L<br/>E<br/>T<br/>E
          </Button>
        </Stack>
      </Stack>
    </CardContent>
  </Card>
}


const combatSimInputTabAtom = atomWithStorage<"Tables" | "Script">("combatSimInputTabAtom", "Tables");


function CombatTab() {
  const [inputTab, setInputTab] = useAtom(combatSimInputTabAtom);

  const [isSimRunning, setIsSimRunning] = useAtom(simRunningAtom);

  const [units] = useAtom(unitsAtom);
  const [combats, setCombats] = useAtom(combatsAtom);

  const [selected, setSelected] = useAtom(selectedCombatAtom);

  const [deleting, setDeleting] = useState<CombatSimulation | null>(null);

  const [script, setScript] = useState(selected.script || '');
  const [compileError, setCompileError] = useState("");

  useEffect(() => {
    setScript(selected.script || '')
  }, [selected]);

  const compile = () => {
    const semicolSects = script.replaceAll(":", "").split(';').map(s => s.trim()).filter(s => s !== "");

    if (!semicolSects[0] || !semicolSects[1]) {
      setCompileError("Please define attackers and defenders");
      return;
    }

    const first = semicolSects.at(0);

    if (!first) {
      setCompileError("Initial section is empty");
      return;
    }

    const lines = first.split('\n').map(s => s.trim()).filter(s => s);

    if (!lines[0]) {
      setCompileError("First line is empty for some fucking reason");
      return;
    }

    const regex = /\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/m;
    const match = lines[0].match(regex);
    let start = 1
    let end = 1
    let step = 1

    if (match && match[1] && match[2] && match[3]) {
      start = parseInt(match[1]);
      end = parseInt(match[2]);
      step = parseInt(match[3]);
      lines.shift();
      semicolSects[0] = lines.join('\n');
    }

    if (step == 0) {
      setCompileError("Step cannot be zero you lunatic!!");
      return;
    }
    
    type Val = {
      start: number;
      step: number;
    }
    type Side = {
      ATK: Val,
      DEF: Val,
      units: {amount: Val, unit: UnitData}[]
    }

    // Parse sides
    const sides = semicolSects.map(sec => {
      sec = sec.trim().replace(/^attacker/, "").replace(/^defender/, "")
      const objects = sec.replace(/\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g, "($1|$2)").split(',').map(s => s.trim()).filter(s => s);
      const side: Side = {
        ATK: {start: 0, step: 0},
        DEF: {start: 0, step: 0},
        units: []
      }
      side.units = objects.flatMap(o => {
        const match = o.match(/^\s*\(\s*(-?\d+(?:\.\d+)?)\s*(?:\|\s*(-?\d+(?:\.\d+)?)\s*)?\)\s*(?<name>\w+)$/);
        if (!match) return [];
        if (!match[1]) return [];
        if (!match.groups) return [];
        const name = match.groups.name;
        if (!name) return [];
        const start = parseInt(match[1]);
        const step = parseInt(match[2] || "") || 0;
        if (name.toLowerCase() === "atk") {
          side.ATK = {start,step};
          return [];
        }
        if (name.toLowerCase() === "def") {
          side.DEF = {start,step};
          return [];
        }
        const unit = units.find(u => u.name.toLowerCase() === name.toLowerCase());
        if (!unit) return [];
        return [{unit,amount:{start,step}}];
      });
      return side;
    });

    if (!sides[0]) {
      setCompileError("Attacker side doesn't exist.");
      return;
    }

    if (sides[0].units.filter(u => !u.unit.special.support).length === 0) {
      setCompileError("Attacker has no units.");
      return;
    }

    if (!sides[1]) {
      setCompileError("Defender side doesn't exist.");
      return;
    }

    if (sides[1].units.filter(u => !u.unit.special.support).length === 0) {
      setCompileError("Defender has no units.");
      return;
    }

    const combatSim: CombatSimulation = {
      id: 'temp',
      name: 'temp',
      battles: []
    }

    const attacker = sides[0];
    const defender = sides[1];
    const populate = (i: number) => {
      combatSim.battles.push({
        id: i.toString(),
        iterations: 0,
        result: {attackerVictories: 0},
        attacker: {
          attackModifier: attacker.ATK.start + attacker.ATK.step * i,
          defenceModifier: attacker.DEF.start + attacker.DEF.step * i,
          units: attacker.units.flatMap(u => {
            const amount = Math.ceil(u.amount.start + u.amount.step * i);
            if (amount > 0) {
              return [{
                id: u.unit.id,
                amount: amount
              }]
            } else {
              return [];
            }
          })
        },
        defender: {
          attackModifier: defender.ATK.start + defender.ATK.step * i,
          defenceModifier: defender.DEF.start + defender.DEF.step * i,
          units: defender.units.flatMap(u => {
            const amount = Math.ceil(u.amount.start + u.amount.step * i);
            if (amount > 0) {
              return [{
                id: u.unit.id,
                amount: amount
              }]
            } else {
              return [];
            }
          })
        }
      })
    }

    if (step > 0) {
      for (let i = start; i <= end; i += step) {
        populate(i);
      }
    } else {
      for (let i = start; i >= end; i += step) {
        populate(i);
      }
    }

    combatSim.battles = combatSim.battles
    .filter(b => b.attacker.units.filter(u => {
      const unit = units.find(un => un.id === u.id);
      if (!unit) return false;
      if (unit.special.support) return false;
      return true;
    }).length > 0)
    .filter(b => b.defender.units.filter(u => {
      const unit = units.find(un => un.id === u.id);
      if (!unit) return false;
      if (unit.special.support) return false;
      return true;
    }).length > 0);

    if (combatSim.battles.length === 0) {
      setCompileError("There are no battles in this simulation.");
      return;
    }

    setSelected(prev => {
      return {
        ...prev,
        battles: combatSim.battles,
        script: script
      }
    });

    setCompileError("");
  };

  const nameConflict = combats.some(c => c.name.toLowerCase() === selected.name.toLowerCase() && c.id !== selected.id);

  useEffect(() => {
    combatSimRunner.end();
    setIsSimRunning(false);

    return () => {
      combatSimRunner.end();
      setIsSimRunning(false);
    }
  }, []);

  const simInterval = useRef<number>(null);

  useEffect(() => {
    if (isSimRunning) {
      simInterval.current = setInterval(() => {
        setSelected(prev => {
          const next = structuredClone(prev);
          for (const b of next.battles) {
            const newData = combatSimRunner.getBattle(b.id)
            if (newData) {
              Object.assign(b, newData);
            }
          }
          return next;
        });
      }, 333);
    } else {
      simInterval.current = null;
    }
    const interval = simInterval.current;

    return () => {
      if (interval) clearInterval(interval);
    }
  }, [isSimRunning])

  const dataset = useMemo(() => {
    let i = 1;
    return selected.battles.filter(b => b.iterations).map(b => {
      return {
        battle: `${i++}. ${b.attacker.units.flatMap(u => {
          const unit = units.find(unit => unit.id === u.id);
          if (unit) {
            return [`${u.amount}x${unit.name}`];
          } else {
            return [];
          }
        }).join(', ')} vs ${b.defender.units.flatMap(u => {
          const unit = units.find(unit => unit.id === u.id);
          if (unit) {
            return [`${u.amount}x${unit.name}`];
          } else {
            return [];
          }
        }).join(', ')}`,
        victoryChance: (b.result.attackerVictories / b.iterations),
        iterations: b.iterations
      }
    });
  }, [selected, units]);

  return <Stack direction='row'>
    <Box>
      <List>
        {
          combats.map(c => {
            return <ListItemButton
              key={c.id}
              selected={selected.id === c.id}
              onClick={() => {
                setSelected(c)
              }}
            >
              <ListItemText primary={c.name} />
            </ListItemButton>;
          })
        }
        {combats.length > 0 ? <Divider flexItem /> : null}
        <ListItemButton
          onClick={() => {
            setSelected(() => {
              let id = crypto.randomUUID();
              while (combats.find(c => c.id === id)) id = crypto.randomUUID();
              return {id, name: '', battles: []};
            });
          }}
        >
          <ListItemText primary="New Simulation" />
        </ListItemButton>
      </List>
      <Divider />
    </Box>
    <Divider orientation='vertical' flexItem />
    <Container>
      <Stack sx={{pt: 3}}>
        <Stack>
          <Stack direction='row'>
            <TextField
              sx={{flexGrow: 1}}
              value={selected.name}
              onChange={e => setSelected(p => {
                return {
                  ...p,
                  name: e.target.value
                }
              })}
              label="Simulation Title"
              required
              color={nameConflict ? 'error' : undefined}
              helperText={
                nameConflict
                ? "Simulation with this name already exists"
                : undefined
              }
            />
            <Button
              color="success"
              variant='outlined'
              disabled={selected.name === "" || nameConflict}
              onClick={() => {
                if (nameConflict) return;
                setCombats(prev => {
                  const i = prev.findIndex(u => u.id === selected.id)
                  const next = [...prev]
                  if (i === -1) {
                    next.push(selected)
                  } else {
                    next[i] = selected
                  }
                  return next
                });
              }}
            >
              Save Simulation
            </Button>
            {<Button
              sx={{float: 'right'}}
              onClick={() => {
                if (combats.some(u => u.id === selected.id)) {
                  setDeleting(selected)
                }
              }}
              disabled={!combats.some(u => u.id === selected.id)}
              color="error"
            >
              Delete Simulation
            </Button>}
            {
              <Dialog
                open={deleting !== null}
                onClose={() => setDeleting(null)}
              >
                <DialogTitle color="error">
                  You sure?
                </DialogTitle>
                <DialogContent>
                  <DialogContentText color="error">
                    This data cannot be recovered!
                    <br></br>
                    <br></br>
                    ...
                    <br></br>
                    <br></br>
                    Unless you save again immediatelly afterwards.
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button
                    onClick={() => setDeleting(null)}
                  >
                    Oh, GOD save my precious simulation :'(
                  </Button>
                  <Button
                    onClick={() => {
                      if (!deleting) return;
                      setCombats(prev => {
                        const next = prev.filter(u => u.id !== deleting.id)
                        return next
                      });
                      setDeleting(null);
                    }}
                    color="error"
                  >
                    Nuke the entire simulation fom orbit! It's the only way to be sure!
                  </Button>
                </DialogActions>
              </Dialog>
            }
          </Stack>
          <Stack mt={2} mb={1} direction='row' justifyContent='center' spacing={5}>
            <Typography variant="h5" textAlign="center" sx={{textDecoration: 'underline'}}>
              Simulated Battles
            </Typography>
            <Autocomplete
              sx={{width: "9em"}}
              options={["Tables", "Script"]}
              disableClearable
              value={inputTab}
              onChange={(_, newValue: string | null) => {
                if (newValue === "Tables" || newValue === "Script") {
                  setInputTab(newValue);
                }
              }}
              renderInput={(params) => <TextField {...params} label="Input Type" />}
            />
            {!isSimRunning ? <Button
              endIcon={<PlayArrowIcon />}
              onClick={() => {
                setIsSimRunning(true);
                combatSimRunner.initialize(selected, units);
                combatSimRunner.start(1000);
              }}
            >
              Run simulation
            </Button> : null}
            {isSimRunning ? <Button
              color='secondary'
              endIcon={<PauseIcon />}
              onClick={() => {
                setIsSimRunning(false);
                combatSimRunner.end();
                setSelected(prev => {
                  const next = structuredClone(prev);
                  for (const b of next.battles) {
                    const newData = combatSimRunner.getBattle(b.id)
                    if (newData) {
                      Object.assign(b, newData);
                    }
                  }
                  return next;
                });
              }}
            >
              Stop simulation
            </Button> : null}
          </Stack>
          {
            inputTab === "Tables"
            ? <Stack spacing={1}>
              {
                selected.battles.map(
                  battle => <BattleCard
                    key={battle.id}
                    battle={battle}
                    units={units}
                    selected={selected}
                    setSelected={setSelected}
                  />)
              }
              <Button
                onClick={() => {
                  setSelected(prev => {
                    const newVal = structuredClone(prev)
                    const lastBattle = prev.battles.at(-1);
                    let id = crypto.randomUUID();
                    while (prev.battles.some(b => b.id === id)) id = crypto.randomUUID();
                    newVal.battles.push(lastBattle ? {
                      ...lastBattle,
                      id
                    } : {
                      id,
                      attacker: {units: [], attackModifier: 0, defenceModifier: 0},
                      defender: {units: [], attackModifier: 0, defenceModifier: 0},
                      iterations: 0,
                      result: {attackerVictories: 0}
                    });
                    return newVal;
                  })
                }}
              >
                Add battle
              </Button>
            </Stack>
            : null
          }
          {
            inputTab === "Script"
            ? <Stack>
              <Stack direction='row'>
                <TextField
                  multiline
                  label="Script"
                  minRows={3}
                  placeholder="for i = (start,end,step)                           // If a unit's final value is negative it counts as zero
attacker: (local_start[, local_step])object, ... ; // local_step is multiplied with i to get the final number of objects
defender: (local_start[, local_step])object, ... ; // object can be any unit, or ATK & DEF (For fixed modifiers)"
                  value={script}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setScript(event.target.value);
                  }}
                  slotProps={{
                    input: {
                      spellCheck: false,
                      sx: {
                        fontFamily: "monospace"
                      }
                    }
                  }}
                  sx={{flexGrow: 1}}
                />
                <Button
                  disabled={
                    script === selected.script
                    || script === ""
                  }
                  onClick={compile}
                  variant='contained'
                >
                  Compile
                </Button>
              </Stack>
              {compileError ? <Alert severity="error">
                <AlertTitle>Failed to compile</AlertTitle>
                {compileError}
              </Alert> : null}
            </Stack>
            : null
          }
        </Stack>
        <BarChart
          xAxis={[{ scaleType: 'band', dataKey: 'battle', label: 'Battles' }]}
          yAxis={[{ max: 1, label: "Chance" }]}
          dataset={dataset}
          series={[
            {dataKey: 'victoryChance', label: "Victory Chance"}
          ]}
          height={444}
        />
        {
          inputTab === "Script"
          ? <Typography textAlign='center'>
            Iterations: {selected.battles.reduce<number | null>((a, c) => {
              if (a === null) return c.iterations;
              return Math.min(a, c.iterations);
            }, null) ?? "--"} - {selected.battles.reduce<number | null>((a, c) => {
              if (a === null) return c.iterations;
              return Math.max(a, c.iterations);
            }, null) ?? "--"}
          </Typography>
          : null
        }
        {!isSimRunning ? <Button
          endIcon={<PlayArrowIcon />}
          onClick={() => {
            setIsSimRunning(true);
            combatSimRunner.initialize(selected, units);
            combatSimRunner.start(1000);
          }}
        >
          Run simulation
        </Button> : null}
        {isSimRunning ? <Button
          color='secondary'
          endIcon={<PauseIcon />}
          onClick={() => {
            setIsSimRunning(false);
            combatSimRunner.end();
            setSelected(prev => {
              const next = structuredClone(prev);
              for (const b of next.battles) {
                const newData = combatSimRunner.getBattle(b.id)
                if (newData) {
                  Object.assign(b, newData);
                }
              }
              return next;
            });
          }}
        >
          Stop simulation
        </Button> : null}
      </Stack>
    </Container>
  </Stack>;
}


const combatSimTabAtom = atomWithStorage<"Edit Units" | "Simulation">('combatSimTab', "Edit Units")

function CombatSim() {
  const [tab, setTab] = useAtom(combatSimTabAtom);
  return <Box>
    <Tabs value={tab} onChange={(_, v) => setTab(v)} centered >
      <Tab label="Edit Units" value="Edit Units" />
      <Tab label="Simulation" value="Simulation" />
    </Tabs>
    <Divider></Divider>
    {
      tab === "Edit Units"
      ? <Stack>
        <EditUnitsMode />
        <Divider flexItem />
      </Stack>
      : tab === "Simulation"
      ? <CombatTab />
      : null
    }
  </Box>;
}

export default CombatSim;
