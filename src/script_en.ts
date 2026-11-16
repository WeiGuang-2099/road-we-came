// The English text. Rewritten to read naturally rather than translated word
// for word. Lines that open with “ are spoken.

import {REASON, type Script} from './script';

export const EN: Script = {
  lang: 'en',
  languageName: 'English',
  maxLength: 90,
  title: {
    name: 'The Road We Came',
    note: 'About five minutes. Best somewhere quiet.',
    start: 'Begin',
    resume: 'Carry on',
    restart: 'Start afresh',
    forget: 'Forget the roads behind',
    forgetWarning:
      'Everything you wrote will be wiped away. There’s no getting it back.',
    forgetConfirm: 'Wipe it',
    forgetCancel: 'Keep it',
    forgotten: 'All forgotten.',
  },
  next: 'Go on',
  sound: {mute: 'Sound off', unmute: 'Sound on'},
  road: 'Places you have passed',
  origin: {
    prompt: 'Before you set out, write down why you’re making this journey.',
    hint: 'One sentence will do. Make it the real reason.',
    placeholder: 'Write it here',
    action: 'Set out',
    handover: 'The people along the road will remember it for you.',
    next: 'Take the road',
  },
  replies: {
    accept: 'That’s right',
    deny: 'That’s not it',
    placeholder: 'Say it the way you remember',
  },
  stations: {
    teahouse: {
      place: 'Teahouse',
      tell: 'Tell her',
      first: {
        intro: [
          'There’s a teahouse by the road. Steam curls from a kettle that has only just boiled.',
          'The woman who keeps it pours you a bowl and looks you over for a long moment.',
        ],
        rumor: `“Word travels faster than you, friend. They say you left saying ‘${REASON}’. Am I right?”`,
        accepted: 'She nods and nudges the bowl a little closer.',
        askAgain: '“Then tell me yourself. How did it go?”',
        corrected:
          '“I’ll remember that. If anyone asks further on, that’s what I’ll tell them.”',
      },
      later: [
        {
          intro: [
            'The teahouse is right where it was, and the kettle is boiling again.',
            'The woman who keeps it looks up, and stops. “You again.”',
          ],
          rumor: `“This time, they say you left saying ‘${REASON}’. Have they got it right?”`,
          accepted: 'She tops up your bowl and asks nothing more.',
          askAgain: '“Then how does it go this time? In your own words.”',
          corrected:
            '“All right. If anyone asks this time, that’s what I’ll tell them.”',
        },
        {
          intro: [
            'A light rain starts to fall, and you wait under the teahouse eaves for a while.',
            'The woman who keeps it stirs up the fire and waves you inside.',
          ],
          rumor: `“Rain makes people talk. Someone in here said you left saying ‘${REASON}’. That so?”`,
          accepted: 'She hums, and turns back to watch the rain.',
          askAgain: '“Go on, then. I’m listening.”',
          corrected: '“When the rain stops, that’s how I’ll tell it.”',
        },
      ],
    },
    inn: {
      place: 'Waystation',
      tell: 'Read it out',
      first: {
        intro: [
          'You reach the waystation just before dark.',
          'The keeper is bent over his ledger by lamplight and doesn’t look up.',
        ],
        rumor: `“Heard all about you. The day you left, you said ‘${REASON}’. That right?”`,
        accepted: 'The keeper adds a line to his ledger.',
        askAgain: '“Slowly, now. Let me get it down.”',
        corrected: 'He copies your words into the ledger in a hurried scrawl.',
      },
      later: [
        {
          intro: [
            'Once more, you reach the waystation just before dark.',
            'The keeper knows you at once. He sets down his pen and adds oil to the lamp.',
          ],
          rumor: `“Your words got here before you did: ‘${REASON}’. Have I got that right?”`,
          accepted:
            'Under the line he wrote last time, the keeper adds another.',
          askAgain: '“Go on. I’ll take it down as you say it.”',
          corrected:
            'He strikes out what the road brought him and writes your words in its place.',
        },
        {
          intro: [
            'The rain hasn’t let up. By the time you reach the waystation, it’s fully dark.',
            'The common room is packed with people sheltering from the rain. The keeper waves to you over their heads.',
          ],
          rumor: `“They’re all talking about you. They say you left saying ‘${REASON}’. Is that so?”`,
          accepted:
            'The keeper says nothing more and turns to see to his other guests.',
          askAgain: '“Too noisy in here. Lean in and say it again.”',
          corrected:
            'The keeper reads your words out loud, and the whole room hears them.',
        },
      ],
    },
    bridge: {
      place: 'Stone Bridge',
      tell: 'Tell him',
      first: {
        intro: [
          'Late the next morning, you come to a stone bridge.',
          'A child skipping stones by the bridge spots you and comes running.',
        ],
        rumor: `“I know you! The grown-ups say you left because ‘${REASON}’!”`,
        accepted: 'Very pleased, the child runs back to the stones.',
        askAgain: '“Then what was it? Say it again!”',
        corrected: 'The child repeats it twice under his breath and runs off.',
      },
      later: [
        {
          intro: [
            'Late the next morning, the stone bridge looks just as it did.',
            'The child skipping stones seems a little taller. He knows you, and shouts from a long way off.',
          ],
          rumor: `“You came back! This time the grown-ups say you left because ‘${REASON}’!”`,
          accepted: 'The child claps and says he knew it all along.',
          askAgain: '“It isn’t? Then tell me. I’ve got a really good memory.”',
          corrected:
            'The child says it after you, word by word, and grins up at you.',
        },
        {
          intro: [
            'The morning after the rain, the river is running high and the stone bridge is wet.',
            'The child is crouched by the bridge, drawing something in the mud. He stands up when he sees you.',
          ],
          rumor: `“Look, I wrote down what they say about you: ‘${REASON}’. Is that right?”`,
          accepted:
            'Pleased with himself, the child draws a little boat under the words.',
          askAgain: '“Did I get it wrong? Tell me and I’ll write it again.”',
          corrected:
            'The child rubs the words out with his foot and writes yours in their place, letter by letter.',
        },
      ],
    },
  },
  ferry: {
    place: 'Ferry',
    intro: [
      'The river is wide, and there’s only one boat at the landing.',
      '“I don’t take coins,” says the ferryman. “Give me one word from what you said when you left.”',
    ],
    instruction: 'Choose a word to give the ferryman.',
    giveLabel: word => `Give “${word}” to the ferryman`,
    taken:
      'The ferryman tucks the word into his sleeve. “The river will keep this one for you.”',
    waived:
      'The ferryman glances at you and waves it away. “Never mind. Climb in.”',
    landed: 'The boat bumps against the far bank.',
  },
  gate: {
    place: 'Mountain Gate',
    lines: [
      'Beyond the river is the mountain. The steps go on and on, and you climb for a long time.',
      'At the gate, an old man sweeping the steps stops and looks you over.',
      '“Everyone who comes up here can tell you why they came.”',
      '“Say a thing often enough, and it comes true.”',
    ],
  },
  summit: {
    place: 'Summit',
    arrival: [
      'You’ve made it.',
      'The keeper of the scrolls hands you one. You unroll it. It’s blank.',
    ],
    request: [
      '“Everyone who gets this far writes on it themselves.”',
      '“Write down why you set out.”',
    ],
    placeholder: 'Write it from memory',
    action: 'Write it in',
    // The seal stays in Chinese: a cinnabar seal reads as one in any language.
    seal: '来时路',
    originLabel: 'When you set out, you wrote',
    carriedLabel: 'Along the road, people passed on',
    nothingCarried: 'Not a single word was left.',
    recallLabel: 'Now, you remember',
    legend:
      'Faded words were lost along the way. Words with a wavy line were added later.',
    lastTime: `Last time you came, you wrote “${REASON}”.`,
    sameAsLast: 'Last time, you wrote those very same words.',
    premise: 'At the end of the road, will you still know why you began?',
    count: journeys => `You have made this climb ${journeys} times.`,
    again: 'Walk it again',
  },
  verdicts: {
    exact: 'Word for word. You still remember.',
    mostly: 'Most of it is still with you. A few words fell by the wayside.',
    mixed:
      'Most of it is still yours. But some of the words now belong to the road.',
    rumor: 'What you remember is what the people on the road told you.',
    partly: 'Only a little of it is left. The road rewrote the rest.',
    forgotten: 'You forgot. And still, you made it here.',
  },
};
