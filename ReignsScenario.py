from Event import Event
from SocialGraph import SocialGraph, Person
from Scenario import Scenario

king = Person(name="King Edward")
jester = Person(name="Junius Loosetongue")
scientist = Person(name="Master Avenzoar")


class ReignsScenario(Scenario):

    def init_graph(self):
        graph = SocialGraph("Reigns")
        print(graph.scenario_name)

        graph.add_persons([king, jester, scientist])

        return graph

    def init_events(self):
        # This scenario is meant to be played interactively, so persons[0] is
        # always the king, and all events are expected to have choices.

        def speaking_to(person):
            return lambda graph, persons: persons[1].name == person.name

        def record_interaction(graph, persons):
            self.set_interacted(persons[0], persons[1])

        def change_sentiment(n):
            def f(graph, persons):
                self.add_sentiment(persons[0], persons[1], n)
            return f

        def sentiment_is(l):
            return lambda graph, persons: l(
                self.get_sentiment(persons[0], persons[1]))

        return [
            Event(
                name='Anarchy 1',
                text='All is anarchy. '
                     'Do you still believe science can save us?',
                persons=2,
                conditions=[
                    speaking_to(jester),
                    sentiment_is(lambda s: s < 1)
                ],
                effects=[
                    record_interaction
                ],
                choices=[
                    'Yes',
                    'No'
                ],
                choices_result_text=[
                    '',
                    "You're not sure if anyone overheard."
                ],
                choices_effects=[
                    [
                        change_sentiment(-1)
                    ],
                    [
                        # TODO this needs a way to affect sentiment of people
                        # outside those involved here
                        change_sentiment(1)
                    ]
                ]
            ),
            Event(
                name='Anarchy 2',
                text='Wonderful!',
                persons=2,
                conditions=[
                    # TODO some state which prevents
                    #      this from firing more than once?
                    speaking_to(jester),
                    sentiment_is(lambda s: s >= 1)
                ],
                effects=[
                        record_interaction
                ],
                choices=[
                      "The world isn't getting warmer, not at all!",
                      'We are in total agreement.'
                ],
                choices_result_text=[
                      '',
                      ''
                ],
                choices_effects=[
                        [
                        ],
                        [
                        ]
                ]
            )
        ]
