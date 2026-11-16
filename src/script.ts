// All player-facing text. Lines that start with 「 are spoken and styled as
// speech. Edit the story here; game.ts only decides the order.

import type {Verdict} from './compare';

/** Where the player's reason is quoted inside a line. */
export const REASON = '{reason}';

export interface Station {
  readonly id: 'teahouse' | 'inn' | 'bridge';
  readonly place: string;
  readonly intro: readonly string[];
  /** What people on the road say the reason was. Contains {@link REASON}. */
  readonly rumor: string;
  readonly accepted: string;
  readonly askAgain: string;
  /** Button that hands over the corrected reason. */
  readonly tell: string;
  readonly corrected: string;
  /** How many small changes the reason picks up on its way here. */
  readonly driftSteps: number;
}

export const TITLE = {
  name: '来时路',
  note: '大约五分钟。找个安静的时候。',
  start: '开始',
  resume: '继续上路',
  restart: '重新出发',
  forget: '抹去走过的路',
  forgetWarning: '写下的字都会抹去，不会再回来。',
  forgetConfirm: '抹去',
  forgetCancel: '算了',
  forgotten: '都抹去了。',
} as const;

export const NEXT = '继续';

export const SOUND = {
  mute: '关闭声音',
  unmute: '打开声音',
} as const;

export const ORIGIN = {
  prompt: '出发之前，写下你为什么要走这一趟。',
  hint: '一句话就好，写真的理由。',
  placeholder: '写在这里',
  action: '出发',
  handover: '这句话，路上的人会替你记着。',
  next: '上路',
} as const;

export const REPLIES = {
  accept: '是这样',
  deny: '不是这样的',
  placeholder: '照你记得的说',
} as const;

export const STATIONS: readonly Station[] = [
  {
    id: 'teahouse',
    place: '茶寮',
    intro: [
      '路边有间茶寮，炉上的水刚开。',
      '老板娘给你倒了碗茶，打量了你好一会儿。',
    ],
    rumor: `「前头有人提起过你，说你出门时讲过一句：『${REASON}』。是这么回事吧？」`,
    accepted: '她点点头，把茶碗往你面前推了推。',
    askAgain: '「那你自己说说，是怎么讲的？」',
    tell: '告诉她',
    corrected: '「记下了。后面有人问起，我就这么说。」',
    driftSteps: 1,
  },
  {
    id: 'inn',
    place: '驿站',
    intro: ['天黑前，你赶到了驿站。', '掌柜在灯下记账，头也没抬。'],
    rumor: `「你的事我听说了。出门那天，你说的是『${REASON}』，对不对？」`,
    accepted: '掌柜在账本上添了一笔。',
    askAgain: '「慢点说，我记一下。」',
    tell: '念给他听',
    corrected: '掌柜把你的话抄进账本，字写得很潦草。',
    driftSteps: 2,
  },
  {
    id: 'bridge',
    place: '桥头',
    intro: [
      '第二天上午，你走到一座石桥。',
      '桥头有个孩子在扔石子，看见你，一路跑了过来。',
    ],
    rumor: `「我知道你！大人都说，你出门是因为『${REASON}』！」`,
    accepted: '孩子很得意，又跑回去扔石子了。',
    askAgain: '「那是什么？你再说一遍。」',
    tell: '告诉他',
    corrected: '孩子跟着念了两遍，跑开了。',
    driftSteps: 2,
  },
];

export const FERRY = {
  place: '渡口',
  intro: [
    '河很宽，岸边只有一条渡船。',
    '「渡钱我不收。」船夫说，「从你出门那句话里，给我一个字。」',
  ],
  instruction: '选一个字，交给船夫。',
  giveLabel: (ch: string): string => `把「${ch}」交给船夫`,
  taken: '船夫把那个字收进袖子里。「这个字，河替你记着。」',
  waived: '船夫看了你一眼，摆摆手：「算了，上船吧。」',
  landed: '船靠了岸。',
} as const;

export const GATE = {
  place: '山门',
  lines: [
    '对岸就是山。台阶很长，你走了很久。',
    '山门口有位扫地的老人，停下扫帚看你。',
    '「上山的人，都说得出自己为什么来。」',
    '「说得多了，也就当了真。」',
  ],
} as const;

export const SUMMIT = {
  place: '山顶',
  arrival: ['你到了。', '守经的人递给你一卷经。你打开，上面一个字也没有。'],
  request: ['「到这里的人，都要自己写上去。」', '「写下你当初为什么出发。」'],
  placeholder: '凭记忆写',
  action: '写上去',
  originLabel: '出发时，你写的是',
  carriedLabel: '一路上，人们传的是',
  nothingCarried: '一个字也没剩下。',
  recallLabel: '现在，你记得的是',
  legend: '淡下去的字丢在了路上，带波浪线的字是后来添的。',
  lastTime: `上一次，你出发时写的是「${REASON}」。`,
  sameAsLast: '上一次，你写的也是这一句。',
  premise: '当你的旅程抵达终点后，你还会记得你为何而出发吗？',
  count: (journeys: number): string => `这是你第 ${journeys} 次走到这里。`,
  again: '再走一次',
} as const;

export const VERDICTS: Readonly<Record<Verdict, string>> = {
  exact: '一字不差。你还记得。',
  mostly: '你记得大半。有几个字，留在了路上。',
  mixed: '你记得大半。可有的字，已经换成了路上的说法。',
  rumor: '你记住的，是路上的人说的那一句。',
  partly: '你只记得一点。剩下的，路替你改了。',
  forgotten: '你忘了。可你还是走到了这里。',
};
