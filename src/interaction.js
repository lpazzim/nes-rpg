// =====================================================================
// INTERAÇÃO (tecla E): cristais de save e conversas com NPCs
// Recebe `game` por parâmetro (nunca importa game.js).
// Ações escolhidas numa conversa passam por dialogAction ('shop', 'sell', 'inn').
// =====================================================================
import { NPC_TUNING } from './data.js';
import { INNS } from './items.js';
import { needsRest, rest } from './shop.js';
import { burst } from './combat.js';
import { DIALOGUES, INN_LINES } from './dialogues.js';
import { DialogRunner } from './dialog-runner.js';
import { DialogBox } from './ui/dialog.js';
import { SlotScreen } from './ui/slots.js';

// alvo mais próximo da tecla E: cristal ('save') ou NPC ('npc')
export function nearInteractable(game) {
  const L = game.leader;
  if (!L) return null;
  const all = [
    ...game.world.interactables.map((o) => ({ kind: o.interact, ref: o, x: o.x, y: o.y })),
    ...game.npcs.map((n) => ({ kind: 'npc', ref: n, x: n.x, y: n.y })),
  ];
  let best = null, bd = NPC_TUNING.talkRange;
  for (const t of all) {
    const d = Math.hypot(t.x - L.x, t.y - L.y);
    if (d < bd) { bd = d; best = t; }
  }
  return best;
}

export function interact(game, target) {
  if (target.kind === 'npc') { talkTo(game, target.ref); return; }
  const o = target.ref;
  if (target.kind !== 'save') return;
  // cristal: cura tudo e abre o save
  for (const h of game.heroes) {
    if (!h.alive) { h.alive = true; h.placeAt(game.leader.x, game.leader.y + 10, 'down'); }
    h.hp = h.maxHp; h.mp = h.maxMp;
  }
  burst(o.x, o.y - 16, '#9fe4ff', 16, 80);
  game.saveEntry = o.entry;
  game.mode = 'save';
  game.slotScreen = new SlotScreen(game, 'save', () => { game.mode = 'play'; game.slotScreen = null; });
}

const REST_FADE = 1; // segundos escurecendo e clareando no descanso

// conversa: o mundo congela (modo 'dialog') até a caixa fechar
export function talkTo(game, npc) { openDialog(game, npc, DIALOGUES[npc.id]); }

function openDialog(game, npc, def) {
  npc.startTalk(game.leader);
  const runner = new DialogRunner(def, game.flags);
  game.dialog = new DialogBox(runner, (action) => {
    npc.endTalk(); game.dialog = null; game.mode = 'play';
    dialogAction(game, action, npc);
  });
  game.mode = 'dialog';
}

// ações escolhidas na conversa: loja do NPC ou estalagem
export function dialogAction(game, action, npc) {
  if (action === 'shop') game.openShop(npc.id, 'buy');
  else if (action === 'sell') game.openShop(npc.id, 'sell');
  else if (action === 'inn') innOffer(game, npc);
  else if (action === 'innRest') innRest(game, npc);
}

// fala curta do NPC (sem escolhas), usando a caixa de diálogo
function say(game, npc, line) {
  openDialog(game, npc, { name: DIALOGUES[npc.id].name, talk: [{ say: [line] }] });
}

// estalagem: avisa se o grupo não precisa; senão diz o preço e pergunta Sim/Não
function innOffer(game, npc) {
  const inn = INNS[npc.id];
  if (!inn) return;
  if (!needsRest(game.heroes)) { say(game, npc, INN_LINES.rested); return; }
  const options = [{ label: INN_LINES.yes, action: 'innRest' }, { label: INN_LINES.no }];
  const line = INN_LINES.offer.replace('{price}', inn.price);
  openDialog(game, npc, { name: DIALOGUES[npc.id].name, talk: [{ say: [line], ask: { options } }] });
}

// cobra e cura ANTES do fade (a animação é só apresentação)
function innRest(game, npc) {
  const r = rest(game, game.heroes, INNS[npc.id].price);
  if (!r.ok) { say(game, npc, r.reason === 'rested' ? INN_LINES.rested : INN_LINES.noGold); return; }
  game.startTransition({
    dur: REST_FADE,
    onMid: () => r.revived.forEach((h) => h.placeAt(game.leader.x, game.leader.y + 10, 'down')),
    onEnd: () => say(game, npc, INN_LINES.morning),
  });
}

// o grupo não atravessa os NPCs: empurra o herói para fora (se couber no mapa)
export function separateFromNpcs(heroes, npcs, world) {
  for (const h of heroes) {
    if (!h.alive) continue;
    for (const n of npcs) {
      const dx = h.x - n.x, dy = h.y - n.y, d = Math.hypot(dx, dy), min = h.r + n.r;
      if (d >= min) continue;
      // exatamente em cima (ex.: revivido no lugar do NPC): empurra para baixo
      const ux = d ? dx / d : 0, uy = d ? dy / d : 1;
      const nx = h.x + ux * (min - d), ny = h.y + uy * (min - d);
      if (!world.collides(nx, ny, h.r)) { h.x = nx; h.y = ny; }
    }
  }
}
