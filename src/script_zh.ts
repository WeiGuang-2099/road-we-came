// The Chinese text. Lines that open with 「 are spoken.

import {REASON, type Script} from './script';

export const ZH: Script = {
  lang: 'zh-CN',
  languageName: '中文',
  maxLength: 40,
  title: {
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
  },
  next: '继续',
  tooShort: '再多写几个字。',
  sound: {mute: '关闭声音', unmute: '打开声音'},
  road: '走过的地方',
  origin: {
    prompt: '出发之前，写下你为什么要走这一趟。',
    hint: '一句话就好，写真的理由。',
    placeholder: '写在这里',
    action: '出发',
    handover: '这句话，路上的人会替你记着。',
    next: '上路',
  },
  replies: {
    accept: '是这样',
    deny: '不是这样的',
    placeholder: '照你记得的说',
  },
  stations: {
    teahouse: {
      place: '茶寮',
      tell: '告诉她',
      first: {
        intro: [
          '路边有间茶寮，炉上的水刚开。',
          '老板娘给你倒了碗茶，打量了你好一会儿。',
        ],
        rumor: `「前头有人提起过你，说你出门时讲过一句：『${REASON}』。是这么回事吧？」`,
        accepted: '她点点头，把茶碗往你面前推了推。',
        askAgain: '「那你自己说说，是怎么讲的？」',
        corrected: '「记下了。后面有人问起，我就这么说。」',
      },
      later: [
        {
          intro: [
            '茶寮还在老地方，炉上的水又开了。',
            '老板娘看见你，愣了一下：「又是你。」',
          ],
          rumor: `「这回路上传的是『${REASON}』。没传错吧？」`,
          accepted: '她给你续了半碗茶，没再多问。',
          askAgain: '「那这一回，你自己怎么说？」',
          corrected: '「好。这回有人问起，我就照你的说。」',
        },
        {
          intro: [
            '下起了小雨，你在茶寮檐下站了一会儿。',
            '老板娘把炉火拨旺，招手让你进去。',
          ],
          rumor: `「下雨天，喝茶的人话多。有人说你出门是为了『${REASON}』？」`,
          accepted: '她嗯了一声，望着外头的雨。',
          askAgain: '「你自己说，我听着。」',
          corrected: '「雨停了，我就这么跟人说。」',
        },
      ],
    },
    inn: {
      place: '驿站',
      tell: '念给他听',
      first: {
        intro: ['天黑前，你赶到了驿站。', '掌柜在灯下记账，头也没抬。'],
        rumor: `「你的事我听说了。出门那天，你说的是『${REASON}』，对不对？」`,
        accepted: '掌柜在账本上添了一笔。',
        askAgain: '「慢点说，我记一下。」',
        corrected: '掌柜把你的话抄进账本，字写得很潦草。',
      },
      later: [
        {
          intro: [
            '天黑前，你又一次赶到了驿站。',
            '掌柜认出了你，搁下笔，往灯里添了点油。',
          ],
          rumor: `「人还没到，话先到了：『${REASON}』。没记错吧？」`,
          accepted: '掌柜在你上回那一行底下，又添了一笔。',
          askAgain: '「你说，我照着记。」',
          corrected: '掌柜把传来的那句划掉，照你说的重写了一遍。',
        },
        {
          intro: [
            '雨一直没停。你到驿站时，天已经黑透了。',
            '堂屋里挤满了躲雨的客人，掌柜隔着人群朝你招了招手。',
          ],
          rumor: `「他们都在说你，说你出门是为了『${REASON}』。是这样吗？」`,
          accepted: '掌柜没再说什么，转身去招呼别的客人了。',
          askAgain: '「这里太吵，你凑近些说。」',
          corrected: '掌柜大声把你的话念了一遍，满屋的人都听见了。',
        },
      ],
    },
    bridge: {
      place: '桥头',
      tell: '告诉他',
      first: {
        intro: [
          '第二天上午，你走到一座石桥。',
          '桥头有个孩子在扔石子，看见你，一路跑了过来。',
        ],
        rumor: `「我知道你！大人都说，你出门是因为『${REASON}』！」`,
        accepted: '孩子很得意，又跑回去扔石子了。',
        askAgain: '「那是什么？你再说一遍。」',
        corrected: '孩子跟着念了两遍，跑开了。',
      },
      later: [
        {
          intro: [
            '第二天上午，石桥还是老样子。',
            '扔石子的孩子好像长高了一点。他认出了你，老远就喊。',
          ],
          rumor: `「你又来啦！这回大人说，你是因为『${REASON}』才走的！」`,
          accepted: '孩子拍着手，说他早就猜到了。',
          askAgain: '「不对吗？那你说，我记性可好了。」',
          corrected: '孩子一个字一个字地跟着念，念完冲你咧嘴一笑。',
        },
        {
          intro: [
            '雨后的早上，河水涨了，石桥湿漉漉的。',
            '那个孩子蹲在桥头，在泥地上画着什么。看见你，他站了起来。',
          ],
          rumor: `「你看，我把你的事写在地上了：『${REASON}』。对不对？」`,
          accepted: '孩子很满意，又在那行字底下画了一条船。',
          askAgain: '「写错了吗？那你说，我重新写。」',
          corrected: '孩子用脚抹掉那行字，照你说的，一笔一画重新写了一遍。',
        },
      ],
    },
  },
  ferry: {
    place: '渡口',
    intro: [
      '河很宽，岸边只有一条渡船。',
      '「渡钱我不收。」船夫说，「从你出门那句话里，给我一个字。」',
    ],
    instruction: '选一个字，交给船夫。',
    giveLabel: word => `把「${word}」交给船夫`,
    taken: '船夫把那个字收进袖子里。「这个字，河替你记着。」',
    waived: '船夫看了你一眼，摆摆手：「算了，上船吧。」',
    landed: '船靠了岸。',
  },
  gate: {
    place: '山门',
    lines: [
      '对岸就是山。台阶很长，你走了很久。',
      '山门口有位扫地的老人，停下扫帚看你。',
      '「上山的人，都说得出自己为什么来。」',
      '「说得多了，也就当了真。」',
    ],
  },
  summit: {
    place: '山顶',
    arrival: ['你到了。', '守经的人递给你一卷经。你打开，上面一个字也没有。'],
    request: ['「到这里的人，都要自己写上去。」', '「写下你当初为什么出发。」'],
    placeholder: '凭记忆写',
    action: '写上去',
    seal: '来时路',
    originLabel: '出发时，你写的是',
    carriedLabel: '一路上，人们传的是',
    nothingCarried: '一个字也没剩下。',
    recallLabel: '现在，你记得的是',
    legend: '淡下去的字丢在了路上，带波浪线的字是后来添的。',
    lastTime: `上一次，你出发时写的是「${REASON}」。`,
    sameAsLast: '上一次，你写的也是这一句。',
    premise: '当你的旅程抵达终点后，你还会记得你为何而出发吗？',
    count: journeys => `这是你第 ${journeys} 次走到这里。`,
    again: '再走一次',
  },
  verdicts: {
    exact: '一字不差。你还记得。',
    mostly: '你记得大半。有几个字，留在了路上。',
    mixed: '你记得大半。可有的字，已经换成了路上的说法。',
    rumor: '你记住的，是路上的人说的那一句。',
    partly: '你只记得一点。剩下的，路替你改了。',
    forgotten: '你忘了。可你还是走到了这里。',
  },
};
