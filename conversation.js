
let exampleNPCs = [{
  // An NPC definition, containing some identity, state, and arbitrary code for running conversations.
  name: 'catelyn',

  state: { // This isn't really necessary, but it's probably good to put all state in one place
    blah: 1,
  },

  graph: {
    0: {
      // This is a dialogue node. It's identified by its key in the `graph` object
      // and defined by getText and getChoice functions. Also can be thought of
      // as a DFA state.
      getText(npc) {
        return npc.name + ': I have no time to waste.';
      },
      getChoice(npc) {
        return {
          // If this is falsey or empty, no fixed choices will be shown
          choices: [{
            text: 'Children', // Fixed choices have text and an action on selection.
            andThen() {
              // Choices can change NPC state, or influence interpretation via the methods on `this`.
              this.jump('children');
            },
          },
          {
            text: 'Royalty',
            andThen() {
              this.jump('royalty');
            },
          }],
          // If this is falsey, the option to present won't be available.
          present: {
            type: 'things', // A way to say what type of objects should be available to present
            andThen(thing) {
              // Same API available on `this`
              if (thing !== 'pants') {
                this.jump('wrong');
              } else {
                this.jump('win');
              }
            }
          }
        };
      },
    },

    children: {
      getText(npc) {
        return 'It would seem prudent to hide your children and your wives. Perhaps your husbands too.';
      },
      getChoice(npc) {
        return {
          choices: [{
            text: 'back',
            andThen() {
              this.restart(0);
              this.resume();
            }
          }],
          present: false
        }
      }
    },

    royalty: {
      getText(npc) {
        return "Perhaps you'll make a good king. Who knows.";
      },
      getChoice(npc) {
        return {
          choices: [{
            text: 'back',
            andThen() {
              this.restart(0);
              this.resume();
            }
          }],
          present: false
        }
      }
    },

    win: {
      getText(npc) {
        return "you win";
      },
      getChoice(npc) {
        return {
          choices: false,
          present: false
        }
      }
    },

    weather: {
      getText(npc) {
        let choices = [
          "The night descends upon us all.",
          "These are dark and trying times.",
        ];
        return _.sample(choices);
      },
      getChoice(npc) {
        return {
          choices: [{
            text: 'back',
            andThen() {
              this.restart('weather');
              this.resume();
            }
          }],
          present: false
        };
      },
    },

    wrong: {
      getText(npc) {
        let choices = [
          "That's not something that interests me.",
          "You chose badly.",
        ];
        return _.sample(choices);
      },
      getChoice(npc) {
        return {
          choices: [{
            text: 'choose again',
            andThen() {
              this.jump(0);
            }
          }],
          present: false
        };
      },
    },

  },
}];

(function() {

  let [DivInput, RandomInput] = (function() {

    function text(text) {
      return $('<p></p>')
        .text(text);
    }

    function link(text, f) {
      return [$('<a></a>')
        .attr('href', '#')
        .html(text)
        .click(f), $('<br/>')];
    }

    function select(id, items) {
      let e = $('<select></select>')
        .attr('id', id)
        .attr('name', id);
      items.forEach((item, i) => {
        e.append($('<option></option>').val(i).html(item));
      });
      return e;
    }

    function selectValue(elt, items) {
      return items[+elt.val()];
    }

    function div(...items) {
      let e = $('<div></div>');
      for (let i of items) {
        e.append(i);
      }
      return e;
    }

    // Renders options to the DOM and uses that for input
    class DivInput {
      constructor(element) {
        this.element = element;
      }
      reset() {
        this.element.empty();
      }
      addText(t) {
        this.element.append(text(t));
        return this;
      }
      addChoice(text, andThen) {
        this.element.append(link(text, andThen));
        return this;
      }
      addPresent(collection, andThen) {
        let id = 'present';
        this.element.append(div(
          select(id, collection),
          link('present', () => andThen(selectValue($('#'+id), collection)))
        ));
        return this;
      }
      respond() {
        // TODO pick a random link and click it?
        // can be implemented but probably isn't necessary
      }
    }

    // This is supposed to be a means of headless/programmatic input,
    // for NPCs talking to each other
    class RandomInput {
      respond() {
        // TODO this would be the primary means of input
      }
      // The other methods just take the options and store them in fields probably
    }

    return [DivInput, RandomInput];

  })();

  // Not really an object, just some functions + state representing
  // the computational process of the dialogue graph
  class Dialogue {

    constructor(input) {
      this.input = input;

      // These are the roots of the dialogue graph (forest?
      // 'tree' is to 'forest' as 'graph' is to ?)
      this.frontier = [0, 'weather'];

      // Placeholders for what would be stored in some db
      this.things = ['goblet', 'pants', 'crossbow', 'stag stick'];
    }

    start() {
      this.input.reset();
      this.input.addText('pick someone to talk to');

      for (let n of exampleNPCs) {
        this.input.addChoice(n.name, () => this.talkToNPC(n));
      }
    }

    talkToNPC(npc) {
      this.input.reset();
      this.interpretRandom(npc);
    }

    // This starts interpreting the dialogue graph from any node in the current frontier
    interpretRandom(npc) {

      // Pick a random element
      if (this.frontier.length === 0) {
        throw 'ran out of choices in frontier!'
      }

      this.interpret(npc, _.sample(this.frontier));
    }

    // Semantics: take the current dialogue node, run some code to get a list of choices,
    // show them. When a choice is picked, run some code that tells us which node to go
    // to, how the frontier should change, etc.
    interpret(npc, i) {

      // When passing through a node, we ensure that it's not in the frontier after
      let x = this.frontier.indexOf(i);
      if (x >= 0) {
        this.frontier.splice(x, 1);
      }

      let e = npc.graph[i];

      let self = this;
      let options = {
        // Sort of like continuations, i.e. an action should end with them
        resume() {
          // Picks the next node from the frontier
          self.interpretRandom(npc);
        },
        jump(x) {
          // Goes to a specific node
          self.interpret(npc, x);
        },
        // Random side effects
        restart(x) {
          self.frontier.push(x);
        },
      };

      this.input.reset();
      this.input.addText(e.getText(npc));

      let choices = e.getChoice(npc)

      if (choices.choices) {
        for (let o of choices.choices) {
          this.input.addChoice(o.text, o.andThen.bind(options));
        }
      }

      if (choices.present) {
        // TODO these types would be from a db
        if (choices.present.type !== 'things') {
          throw 'invalid choice type ' + choices.present.type;
        }
        let collection = this.things;
        this.input.addPresent(collection, choices.present.andThen.bind(options));
      }

      // TODO a way to stop talking to this NPC
    }
  }

  $(() => {
    let box = $('#dialogue');
    let input = new DivInput(box);
    new Dialogue(input).start();
  });

})();
