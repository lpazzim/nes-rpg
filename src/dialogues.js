// =====================================================================
// FALAS DOS NPCs
//
// Cada NPC (o id é o mesmo da folha de sprites "npcs") tem:
//   name: nome mostrado na caixa
//   talk: lista de versões da conversa. Vale a PRIMEIRA cuja condição
//         "if" (uma flag da campanha) estiver ativa; a última, sem "if",
//         é a padrão. Ex.: if: 'bosque' -> depois de vencer o Treant Anciao.
//
// Cada versão tem "say" (falas em sequência) e, opcionalmente, "ask"
// (escolhas depois da última fala). A ÚLTIMA opção é a de sair (tecla K/Esc).
// "action" é o que o jogo faz depois das falas da opção ('shop' = comprar,
// 'sell' = vender; a estalagem usa 'inn').
//
// Escreva SEM ACENTOS (a fonte do jogo ainda não tem acentos).
// Falas longas viram várias páginas automaticamente.
// =====================================================================

const SHOP_OPTIONS = [
  { label: 'Comprar', action: 'shop', say: ['Deem uma olhada na mercadoria!'] },
  { label: 'Vender', action: 'sell', say: ['Vamos ver o que voces tem para mim.'] },
  { label: 'Sair', say: ['Volte sempre! E cuidado com os espantalhos.'] },
];

const INN_OPTIONS = [
  { label: 'Descansar', action: 'inn' },
  { label: 'Sair', say: ['Boa viagem! Se cansarem, o cristal azul da praca tambem ajuda.'] },
];

// Falas da estalagem (src/interaction.js). {price} vira o preço da noite.
export const INN_LINES = {
  offer: 'Uma noite custa {price} G. Vao descansar?',
  yes: 'Sim', no: 'Nao',
  noGold: 'Hmm, falta ouro para o quarto. Volte quando puder!',
  rested: 'Voces parecem descansados! Nao precisam de quarto agora.',
  morning: 'Bom dia! Dormiram bem? Voces parecem novos em folha!',
};

export const DIALOGUES = {
  mercador_fazenda: {
    name: 'Mercador',
    talk: [
      {
        if: 'bosque',
        say: ['Ei, herois! Dizem que voces acalmaram o Treant Anciao. Meus clientes voltaram a passar pela floresta!'],
        ask: { options: SHOP_OPTIONS },
      },
      {
        say: ['Bem-vindos a minha barraca! Tenho de tudo um pouco para quem vai encarar a Floresta Sussurrante.'],
        ask: { options: SHOP_OPTIONS },
      },
    ],
  },

  estalajadeira: {
    name: 'Estalajadeira',
    talk: [
      {
        if: 'bosque',
        say: ['A vila inteira so fala da vitoria de voces! Fiz ate uma sopa especial em sua homenagem.'],
        ask: { options: INN_OPTIONS },
      },
      {
        say: [
          'Ola, viajantes! A estalagem da Pradaria tem as camas mais macias da regiao.',
          'Bem... as unicas camas da regiao, mas ainda assim!',
        ],
        ask: { options: INN_OPTIONS },
      },
    ],
  },

  velho_agricultor: {
    name: 'Velho Agricultor',
    talk: [
      {
        if: 'bosque',
        say: [
          'As raizes pararam de tremer debaixo da minha horta. Obrigado, jovens!',
          'Agora meus nabos vao crescer em paz.',
        ],
      },
      {
        say: [
          'Esses espantalhos andam se mexendo sozinhos... Na minha epoca eles so espantavam corvos!',
          'Se forem para a floresta, sigam a estrada para o leste. A caverna fica no fundo, ao norte.',
          'E salvem no cristal azul antes de entrar. Velho sabe das coisas.',
        ],
      },
    ],
  },

  aprendiz: {
    name: 'Jovem Aprendiz',
    talk: [
      {
        if: 'bosque',
        say: [
          'Voces derrotaram o Treant Anciao?! Quando eu crescer quero ser igualzinho!',
          'Me ensina aquele golpe da katana? So um pouquinho?',
        ],
      },
      {
        say: [
          'Um dia eu tambem vou ser aventureiro! Ja treino com este balde todo dia.',
          'Sabia que alguns tocos da floresta sao treants disfarcados? Cheguem perto com cuidado!',
          'Dizem que dentro da caverna e tao escuro que da para ver os cogumelos brilhando.',
        ],
      },
    ],
  },
};
