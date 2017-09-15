
import sys

# Fix Python 2.x.
try:
    input = raw_input
except NameError:
    pass


class Event:
    def __init__(self, name="event", text="event text",
                 persons=1, conditions=[], effects=[],
                 choices=[], choices_result_text=[], choices_effects=[]):
        self.name = name
        self.text = text
        self.conditions = conditions
        self.effects = effects

        self.graph = None
        self.target_persons = None

        assert persons >= 1
        self.persons = persons

        assert len(choices) == len(choices_result_text) == len(choices_effects)
        self.choices = choices
        self.choices_result_text = choices_result_text
        self.choices_effects = choices_effects

    def __repr__(self):
        return "{}".format(
            self.name)

    def set_targets(self, graph, persons):
        # graph, persons should meet conditions
        assert(len(persons) == self.persons)
        self.graph = graph
        self.target_persons = persons

    def conditions_check(self, graph, persons):
        assert(len(persons) == self.persons)
        for condition in self.conditions:
            if not condition(graph, persons):
                return False
        return True

    def apply_effects(self):
        assert self.graph is not None and self.target_persons is not None
        for effect in self.effects:
            effect(self.graph, self.target_persons)

    def apply_choice_effects(self, choice):
        if choice == -1:
            return
        assert self.graph is not None and self.target_persons is not None
        assert 0 <= choice <= len(self.choices)
        for choices_effect in self.choices_effects[choice]:
            choices_effect(self.graph, self.target_persons)

    def get_choice(self):
        print(self.text + "\n")

        # Indexing is 1-based
        for i, choice in enumerate(self.choices):
            print("{}. {}".format(i + 1, choice))

        while True:
            sys.stdout.write('>> ')
            sys.stdout.flush()
            try:
                choice = int(input()) - 1
                if 0 <= choice < len(self.choices):
                    break
            except ValueError:
                continue

        print(self.choices_result_text[choice])

        return choice

    def get_text(self, selected_choice=-1):
        text = self.text + "\n"
        for i, choice in enumerate(self.choices):
            if i == selected_choice:
                text += "{}. {}\t\t<< selected\n".format(i, choice)
            else:
                text += "{}. {}\n".format(i, choice)

        if selected_choice != -1:
            assert 0 <= selected_choice <= len(self.choices)
            text += ">> {}\n".format(self.choices_result_text[selected_choice])

        return text
